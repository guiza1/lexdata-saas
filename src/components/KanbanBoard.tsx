import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { ModalDetalhesProcesso } from './ModalDetalhesProcesso';
import { ModalFormProcesso } from './ModalFormProcesso';
import { IconScale } from './Icons';

interface ProcessoKanban {
  processo_id: number;
  numero_processo: string;
  area: string;
  tipo: string;
  responsavel: string;
  etapa_atual: string;
  prob_sucesso: number;
  valor_causa: number;
}

interface FeedbackNotificacao {
  tipo: 'salvando' | 'sucesso' | 'erro';
  mensagem: string;
}

export function KanbanBoard() {
  const { usuario } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [processos, setProcessos] = useState<ProcessoKanban[]>([]);
  const [etapas, setEtapas] = useState<string[]>([]);
  const [busca, setBusca] = useState<string>('');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [processoSelecionadoId, setProcessoSelecionadoId] = useState<number | null>(null);
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [notificacao, setNotificacao] = useState<FeedbackNotificacao | null>(null);

  const recarregarProcessos = async () => {
    try {
      const { data: dataProcessos } = await supabase.from('processos').select('*');
      if (dataProcessos) setProcessos(dataProcessos);
    } catch (err) {
      console.error('Erro ao recarregar processos:', err);
    }
  };

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const { data: dataEtapas } = await supabase.from('lk_etapas').select('etapa');
        const { data: dataProcessos } = await supabase.from('processos').select('*');

        if (dataEtapas && dataEtapas.length > 0) {
          setEtapas(dataEtapas.map((e: any) => e.etapa));
        } else {
          setEtapas(['Petição Inicial', 'Audiência', 'Perícia/Provas', 'Sentença', 'Recurso', 'Execução', 'Arquivado']);
        }

        if (dataProcessos) setProcessos(dataProcessos);
      } catch (err) {
        console.error('Erro ao carregar dados do Kanban:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const processoId = Number(draggableId);
    const novaEtapa = destination.droppableId;
    const etapaAnterior = source.droppableId;

    setProcessos(prev =>
      prev.map(p =>
        p.processo_id === processoId ? { ...p, etapa_atual: novaEtapa } : p
      )
    );

    setNotificacao({
      tipo: 'salvando',
      mensagem: `Atualizando autos para "${novaEtapa}"...`,
    });

    try {
      const { error } = await supabase
        .from('processos')
        .update({ etapa_atual: novaEtapa })
        .eq('processo_id', processoId);

      if (error) throw error;

      setNotificacao({
        tipo: 'sucesso',
        mensagem: `Autos sincronizados com a fase "${novaEtapa}".`,
      });

      setTimeout(() => setNotificacao(null), 3000);
    } catch (err) {
      console.error('Erro ao persistir:', err);
      setProcessos(prev =>
        prev.map(p =>
          p.processo_id === processoId ? { ...p, etapa_atual: etapaAnterior } : p
        )
      );

      setNotificacao({
        tipo: 'erro',
        mensagem: 'Falha de gravação no banco de dados. Revertido.',
      });

      setTimeout(() => setNotificacao(null), 4000);
    }
  };

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const areasUnicas = Array.from(new Set(processos.map(p => p.area).filter(Boolean)));
  const responsaveisUnicos = Array.from(new Set(processos.map(p => p.responsavel).filter(Boolean)));

  // Regra RBAC: Filtro por advogado autenticado
  const processosFiltrados = processos.filter(p => {
    if (usuario?.perfil === 'advogado' && usuario.advogadoResponsavel) {
      const respBanco = (p.responsavel || '').trim().toLowerCase();
      const respUser = usuario.advogadoResponsavel.trim().toLowerCase();
      if (respBanco !== respUser) return false;
    }

    const termo = busca.trim().toLowerCase();
    const bateBusca =
      termo === '' ||
      (p.numero_processo || '').toLowerCase().includes(termo) ||
      (p.tipo || '').toLowerCase().includes(termo) ||
      (p.responsavel || '').toLowerCase().includes(termo);

    const bateArea = filtroArea === 'todas' || p.area === filtroArea;
    const bateResp = filtroResponsavel === 'todos' || p.responsavel === filtroResponsavel;

    return bateBusca && bateArea && bateResp;
  });

  const cardBg = isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const mainTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  if (loading) {
    return <div className="p-8 font-mono text-xs text-slate-400">Carregando pipeline de andamentos...</div>;
  }

  return (
    <div className="space-y-6 relative font-sans">
      {/* Toast Notificação */}
      {notificacao && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded border text-xs font-mono font-medium shadow-2xl backdrop-blur-md transition-all ${
              notificacao.tipo === 'salvando'
                ? isDark ? 'bg-[#0E1424] border-amber-500/50 text-amber-300' : 'bg-white border-amber-400 text-amber-900'
                : notificacao.tipo === 'sucesso'
                ? isDark ? 'bg-[#0E1424] border-emerald-500/50 text-emerald-300' : 'bg-white border-emerald-400 text-emerald-900'
                : isDark ? 'bg-[#0E1424] border-red-500/50 text-red-300' : 'bg-white border-red-400 text-red-900'
            }`}
          >
            <span>[{notificacao.tipo.toUpperCase()}]</span>
            <span>{notificacao.mensagem}</span>
          </div>
        </div>
      )}

      {/* Modais */}
      <ModalDetalhesProcesso
        processoId={processoSelecionadoId}
        onClose={() => setProcessoSelecionadoId(null)}
      />

      <ModalFormProcesso
        isOpen={modalFormAberto}
        onClose={() => setModalFormAberto(false)}
        onSuccess={() => {
          recarregarProcessos();
          setNotificacao({
            tipo: 'sucesso',
            mensagem: 'Novo processo registrado no PostgreSQL com sucesso!',
          });
          setTimeout(() => setNotificacao(null), 3500);
        }}
      />

      {/* Banner Informativo se for Advogado */}
      {usuario?.perfil === 'advogado' && (
        <div className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
          isDark ? 'bg-blue-950/20 border-blue-800/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <IconScale className="w-4 h-4 text-blue-500" />
            <span className="text-xs">
              Quadro restrito às causas sob condução de: <strong className="font-semibold text-white">{usuario.nome}</strong>
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border">
            {processosFiltrados.length} causas ativas
          </span>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className={`p-4 rounded-lg border flex flex-wrap gap-4 items-center justify-between flex-shrink-0 ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="w-full sm:w-64">
            <label className={`block text-[10px] uppercase font-mono mb-1 font-semibold ${subText}`}>Busca por Termo:</label>
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Nº autos, objeto ou titular..."
                className={`w-full border rounded px-3 pr-8 py-2 text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div>
            <label className={`block text-[10px] uppercase font-mono mb-1 font-semibold ${subText}`}>Área do Direito:</label>
            <select
              value={filtroArea}
              onChange={e => setFiltroArea(e.target.value)}
              className={`border rounded px-3 py-2 text-xs focus:outline-none ${
                isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
              }`}
            >
              <option value="todas">Todas as Áreas</option>
              {areasUnicas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {usuario?.perfil === 'admin' && (
            <div>
              <label className={`block text-[10px] uppercase font-mono mb-1 font-semibold ${subText}`}>Advogado Responsável:</label>
              <select
                value={filtroResponsavel}
                onChange={e => setFiltroResponsavel(e.target.value)}
                className={`border rounded px-3 py-2 text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              >
                <option value="todos">Todos os Advogados</option>
                {responsaveisUnicos.map(resp => (
                  <option key={resp} value={resp}>{resp}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className={`text-xs font-mono ${subText}`}>
            Exibindo <strong className={mainTitle}>{processosFiltrados.length}</strong> causas
          </div>

          <button
            onClick={() => setModalFormAberto(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
            }`}
          >
            <span>+</span> Novo Processo
          </button>
        </div>
      </div>

      {/* Grid de Colunas Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {etapas.map(etapa => {
            const cardsDaEtapa = processosFiltrados.filter(
              p => (p.etapa_atual || '').toLowerCase() === etapa.toLowerCase()
            );
            const totalValorEtapa = cardsDaEtapa.reduce(
              (acc, p) => acc + (Number(p.valor_causa) || 0),
              0
            );

            return (
              <div
                key={etapa}
                className={`flex-shrink-0 w-80 rounded-lg border flex flex-col max-h-[75vh] transition-colors ${
                  isDark ? 'bg-[#090D16]/90 border-slate-800/80' : 'bg-slate-100 border-slate-200 shadow-sm'
                }`}
              >
                {/* Header da Coluna */}
                <div className={`p-4 border-b rounded-t-lg ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`font-semibold text-xs uppercase tracking-wider ${mainTitle}`}>{etapa}</h3>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
                    }`}>
                      {cardsDaEtapa.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-500 mt-1 font-mono font-bold">
                    {formatarMoeda(totalValorEtapa)}
                  </p>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={etapa}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 overflow-y-auto space-y-3 flex-1 transition-colors ${
                        snapshot.isDraggingOver ? (isDark ? 'bg-slate-900/50' : 'bg-slate-200/50') : ''
                      }`}
                    >
                      {cardsDaEtapa.length === 0 ? (
                        <div className={`p-4 text-center text-[11px] font-mono border border-dashed rounded ${
                          isDark ? 'border-slate-800 text-slate-600' : 'border-slate-300 text-slate-400'
                        }`}>
                          Sem demandas nesta fase
                        </div>
                      ) : (
                        cardsDaEtapa.map((proc, index) => (
                          <Draggable
                            key={proc.processo_id}
                            draggableId={String(proc.processo_id)}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => setProcessoSelecionadoId(proc.processo_id)}
                                className={`p-3.5 rounded border transition-all cursor-pointer ${
                                  dragSnapshot.isDragging
                                    ? isDark ? 'bg-[#151D33] border-amber-500 shadow-2xl' : 'bg-white border-slate-900 shadow-xl'
                                    : isDark
                                    ? 'bg-[#0E1424] hover:bg-[#151D33] border-slate-800 hover:border-slate-700'
                                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                    isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                                  }`}>
                                    {proc.numero_processo}
                                  </span>
                                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                    isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                                  }`}>
                                    {proc.area}
                                  </span>
                                </div>

                                <p className={`text-xs font-semibold tracking-wide line-clamp-1 mb-1 ${mainTitle}`}>
                                  {proc.tipo}
                                </p>

                                <div className={`flex justify-between items-center text-[11px] font-mono mb-2 ${subText}`}>
                                  <span className="truncate max-w-[140px]">{proc.responsavel}</span>
                                  <span className="text-emerald-500 font-semibold">
                                    {Math.round((proc.prob_sucesso || 0) * 100)}% êxito
                                  </span>
                                </div>

                                <div className={`pt-2 border-t flex items-center justify-between text-xs ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                                  <span className="font-mono font-bold text-amber-500">
                                    {formatarMoeda(proc.valor_causa)}
                                  </span>
                                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Ficha &rarr;
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}