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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

  if (loading) {
    return <div className="p-8 font-mono text-xs text-muted-foreground">Carregando pipeline de andamentos...</div>;
  }

  const toastTone = {
    salvando: 'border-accent/50 text-accent-foreground',
    sucesso: 'border-emerald-500/50 text-emerald-500',
    erro: 'border-red-500/50 text-red-400',
  } as const;

  return (
    <div className="space-y-6 relative font-sans">
      {/* Toast Notificação */}
      {notificacao && (
        <div className="fixed bottom-6 right-6 z-50" role="status" aria-live="polite">
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded border text-xs font-mono font-medium shadow-2xl backdrop-blur-md transition-all bg-surface',
            toastTone[notificacao.tipo]
          )}>
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
        <div className="p-4 rounded-lg border border-blue-800/40 bg-blue-950/20 text-blue-800 dark:text-blue-300 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <IconScale className="w-4 h-4 text-blue-500" />
            <span className="text-xs">
              Quadro restrito às causas sob condução de: <strong className="font-semibold text-foreground">{usuario.nome}</strong>
            </span>
          </div>
          <Badge variant="outline" className="text-xs font-mono font-bold">
            {processosFiltrados.length} causas ativas
          </Badge>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <Card className="p-4 flex flex-wrap gap-4 items-center justify-between flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="w-full sm:w-64">
            <label htmlFor="busca-kanban" className="block text-[10px] uppercase font-mono mb-1 font-semibold text-muted-foreground">Busca por Termo:</label>
            <div className="relative">
              <Input
                id="busca-kanban"
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Nº autos, objeto ou titular..."
                className="text-xs pr-8"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="filtro-area" className="block text-[10px] uppercase font-mono mb-1 font-semibold text-muted-foreground">Área do Direito:</label>
            <select
              id="filtro-area"
              value={filtroArea}
              onChange={e => setFiltroArea(e.target.value)}
              className="border border-input bg-surface-sunken rounded px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
            >
              <option value="todas">Todas as Áreas</option>
              {areasUnicas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {usuario?.perfil === 'admin' && (
            <div>
              <label htmlFor="filtro-resp" className="block text-[10px] uppercase font-mono mb-1 font-semibold text-muted-foreground">Advogado Responsável:</label>
              <select
                id="filtro-resp"
                value={filtroResponsavel}
                onChange={e => setFiltroResponsavel(e.target.value)}
                className="border border-input bg-surface-sunken rounded px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
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
          <div className="text-xs font-mono text-muted-foreground">
            Exibindo <strong className="text-foreground">{processosFiltrados.length}</strong> causas
          </div>

          <Button type="button" onClick={() => setModalFormAberto(true)} className="gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <span>+</span> Novo Processo
          </Button>
        </div>
      </Card>

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
                className="flex-shrink-0 w-80 rounded-lg border border-border bg-surface-sunken/90 flex flex-col max-h-[75vh] transition-colors"
              >
                {/* Header da Coluna */}
                <div className="p-4 border-b border-border rounded-t-lg bg-surface">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-xs uppercase tracking-wider">{etapa}</h3>
                    <Badge variant="secondary" className="text-[10px] font-mono font-bold">
                      {cardsDaEtapa.length}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-accent-foreground mt-1 font-mono font-bold">
                    {formatarMoeda(totalValorEtapa)}
                  </p>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={etapa}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'p-3 overflow-y-auto space-y-3 flex-1 transition-colors',
                        snapshot.isDraggingOver && 'bg-border/30'
                      )}
                    >
                      {cardsDaEtapa.length === 0 ? (
                        <div className="p-4 text-center text-[11px] font-mono border border-dashed border-border text-muted-foreground rounded">
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
                                className={cn(
                                  'p-3.5 rounded border transition-all cursor-pointer bg-surface',
                                  dragSnapshot.isDragging
                                    ? 'border-accent shadow-2xl'
                                    : 'border-border hover:border-ring/60 hover:shadow-sm'
                                )}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <Badge className="text-[10px] font-mono font-bold bg-accent/15 border-accent/30 text-accent-foreground">
                                    {proc.numero_processo}
                                  </Badge>
                                  <Badge variant="secondary" className="text-[9px] font-mono uppercase">
                                    {proc.area}
                                  </Badge>
                                </div>

                                <p className="text-xs font-semibold tracking-wide line-clamp-1 mb-1">
                                  {proc.tipo}
                                </p>

                                <div className="flex justify-between items-center text-[11px] font-mono mb-2 text-muted-foreground">
                                  <span className="truncate max-w-[140px]">{proc.responsavel}</span>
                                  <span className="text-emerald-500 font-semibold">
                                    {Math.round((proc.prob_sucesso || 0) * 100)}% êxito
                                  </span>
                                </div>

                                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                                  <span className="font-mono font-bold text-accent-foreground">
                                    {formatarMoeda(proc.valor_causa)}
                                  </span>
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
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