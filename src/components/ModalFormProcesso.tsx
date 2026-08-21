import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface ModalFormProcessoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processoParaEditar?: any | null;
}

export function ModalFormProcesso({ isOpen, onClose, onSuccess, processoParaEditar }: ModalFormProcessoProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [clientes, setClientes] = useState<{ cliente_id: number; nome: string }[]>([]);
  const [etapas, setEtapas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form State
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [area, setArea] = useState('Trabalhista');
  const [tipo, setTipo] = useState('');
  const [responsavel, setResponsavel] = useState('Dr. Bruno Azevedo');
  const [etapaAtual, setEtapaAtual] = useState('Petição Inicial');
  const [valorCausa, setValorCausa] = useState<number | ''>('');
  const [probSucesso, setProbSucesso] = useState<number>(0.7);

  useEffect(() => {
    async function carregarAuxiliares() {
      const { data: dataClientes } = await supabase.from('clientes').select('cliente_id, nome').order('nome');
      const { data: dataEtapas } = await supabase.from('lk_etapas').select('etapa');

      if (dataClientes) setClientes(dataClientes);
      if (dataEtapas && dataEtapas.length > 0) {
        setEtapas(dataEtapas.map((e: any) => e.etapa));
      } else {
        setEtapas(['Petição Inicial', 'Audiência', 'Perícia/Provas', 'Sentença', 'Recurso', 'Execução', 'Arquivado']);
      }
    }

    if (isOpen) {
      carregarAuxiliares();
      if (processoParaEditar) {
        setClienteId(processoParaEditar.cliente_id || '');
        setNumeroProcesso(processoParaEditar.numero_processo || '');
        setArea(processoParaEditar.area || 'Trabalhista');
        setTipo(processoParaEditar.tipo || '');
        setResponsavel(processoParaEditar.responsavel || 'Dr. Bruno Azevedo');
        setEtapaAtual(processoParaEditar.etapa_atual || 'Petição Inicial');
        setValorCausa(processoParaEditar.valor_causa || '');
        setProbSucesso(processoParaEditar.prob_sucesso ?? 0.7);
      } else {
        setClienteId('');
        setNumeroProcesso('');
        setArea('Trabalhista');
        setTipo('');
        setResponsavel('Dr. Bruno Azevedo');
        setEtapaAtual('Petição Inicial');
        setValorCausa('');
        setProbSucesso(0.7);
      }
      setErro(null);
    }
  }, [isOpen, processoParaEditar]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!numeroProcesso.trim() || !tipo.trim() || valorCausa === '' || clienteId === '') {
      setErro('Preencha todos os parâmetros obrigatórios (*).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        cliente_id: Number(clienteId),
        numero_processo: numeroProcesso.trim(),
        area,
        tipo: tipo.trim(),
        responsavel,
        etapa_atual: etapaAtual,
        valor_causa: Number(valorCausa),
        prob_sucesso: Number(probSucesso),
        ...(processoParaEditar ? {} : { data_abertura: new Date().toISOString().slice(0, 10) })
      };

      if (processoParaEditar) {
        const { error } = await supabase
          .from('processos')
          .update(payload)
          .eq('processo_id', processoParaEditar.processo_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('processos')
          .insert([payload]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar processo:', err);
      setErro(err.message || 'Falha ao gravar no PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const mainTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-sans">
      <div className={`border rounded-lg max-w-lg w-full shadow-2xl overflow-hidden ${cardBg}`}>
        
        {/* Cabeçalho */}
        <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-[#090D16]/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <h2 className={`text-sm font-serif font-bold uppercase tracking-wider ${mainTitle}`}>
              {processoParaEditar ? 'Editar Autos Processuais' : 'Abertura de Autos Judiciais'}
            </h2>
            <p className={`text-[11px] ${subText}`}>
              {processoParaEditar ? 'Atualização de parâmetros e fase' : 'Registro de nova demanda no pipeline'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-mono ${
              isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {erro && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-300 rounded">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Nº dos Autos *</label>
              <input
                type="text"
                placeholder="Ex: 5001234-88.2024.8.00"
                value={numeroProcesso}
                onChange={e => setNumeroProcesso(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Parte / Cliente *</label>
              <select
                value={clienteId}
                onChange={e => setClienteId(Number(e.target.value))}
                className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
                required
              >
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => (
                  <option key={c.cliente_id} value={c.cliente_id}>
                    {c.nome} (ID #{c.cliente_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Área do Direito</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              >
                <option value="Trabalhista">Trabalhista</option>
                <option value="Cível">Cível</option>
                <option value="Tributário">Tributário</option>
                <option value="Família">Família</option>
                <option value="Empresarial">Empresarial</option>
              </select>
            </div>

            <div>
              <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Advogado Responsável</label>
              <select
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              >
                <option value="Dr. Bruno Azevedo">Dr. Bruno Azevedo</option>
                <option value="Dr. Diego Castro">Dr. Diego Castro</option>
                <option value="Dr. Felipe Mendes">Dr. Felipe Mendes</option>
                <option value="Dra. Ana Nogueira">Dra. Ana Nogueira</option>
                <option value="Dra. Carla Farias">Dra. Carla Farias</option>
                <option value="Dra. Eduarda Pinto">Dra. Eduarda Pinto</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Objeto / Ação *</label>
            <input
              type="text"
              placeholder="Ex: Ação Anulatória de Débito Fiscal"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Fase Inicial</label>
              <select
                value={etapaAtual}
                onChange={e => setEtapaAtual(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              >
                {etapas.map(etp => (
                  <option key={etp} value={etp}>{etp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Valor em Causa (€) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={valorCausa}
                onChange={e => setValorCausa(e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
                required
              />
            </div>
          </div>

          {/* Slider de Probabilidade */}
          <div className={`p-3.5 rounded border ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <label className={`font-semibold uppercase tracking-wider text-[10px] ${subText}`}>Probabilidade de Êxito</label>
              <span className="font-mono font-bold text-amber-500 text-xs">
                {Math.round(probSucesso * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={probSucesso}
              onChange={e => setProbSucesso(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Ações */}
          <div className={`pt-3 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded text-xs font-semibold border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-amber-500/40 text-xs font-semibold rounded uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Gravando...' : (processoParaEditar ? 'Salvar Alterações' : 'Cadastrar Autos')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}