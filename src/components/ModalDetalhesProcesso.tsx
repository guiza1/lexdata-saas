import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { IconScale } from './Icons';

interface ModalDetalhesProcessoProps {
  processoId: number | null;
  onClose: () => void;
}

export function ModalDetalhesProcesso({ processoId, onClose }: ModalDetalhesProcessoProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [detalhes, setDetalhes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDetalhes() {
      if (!processoId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('processos')
          .select('*, clientes(*)')
          .eq('processo_id', processoId)
          .single();

        if (error) throw error;
        setDetalhes(data);
      } catch (err) {
        console.error('Erro ao carregar detalhes do processo:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDetalhes();
  }, [processoId]);

  if (!processoId) return null;

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const formatarData = (dataStr: string) => {
    if (!dataStr) return 'N/D';
    return new Date(dataStr).toLocaleDateString('pt-PT');
  };

  const modalBg = isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200';
  const headerBg = isDark ? 'bg-[#090D16]/90 border-slate-800' : 'bg-slate-50 border-slate-200';
  const cardItemBg = isDark ? 'bg-[#090D16] border-slate-800/80' : 'bg-slate-50 border-slate-200';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-sans">
      <div className={`border rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${modalBg}`}>
        
        {/* Cabeçalho */}
        <div className={`p-6 border-b flex justify-between items-start ${headerBg}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                AUTOS Nº {detalhes?.numero_processo || processoId}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                {detalhes?.area || 'Geral'}
              </span>
            </div>

            <h2 className={`text-lg font-serif font-bold uppercase tracking-wider ${textTitle}`}>
              {detalhes?.tipo || 'Ficha Técnica dos Autos'}
            </h2>
            <p className={`text-xs mt-0.5 font-mono ${textSub}`}>
              Comarca de Abertura: {formatarData(detalhes?.data_abertura)}
            </p>
          </div>

          <button
            onClick={onClose}
            className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-mono transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Conteúdo com Rolagem */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="text-center py-16 font-mono text-slate-400">Consultando registros processuais...</div>
          ) : (
            <>
              {/* KPIs do Processo */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-md border ${cardItemBg}`}>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${textSub}`}>Valor da Causa</span>
                  <span className="text-lg font-mono font-bold text-blue-500 mt-1 block">
                    {formatarMoeda(detalhes?.valor_causa)}
                  </span>
                </div>
                <div className={`p-3.5 rounded-md border ${cardItemBg}`}>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${textSub}`}>Taxa de Êxito</span>
                  <span className="text-lg font-mono font-bold text-emerald-500 mt-1 block">
                    {Math.round((detalhes?.prob_sucesso || 0) * 100)}%
                  </span>
                </div>
                <div className={`p-3.5 rounded-md border ${cardItemBg}`}>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${textSub}`}>Fase Atual</span>
                  <span className="text-sm font-serif font-bold text-amber-500 mt-1.5 block uppercase">
                    {detalhes?.etapa_atual}
                  </span>
                </div>
              </div>

              {/* Informações da Parte / Cliente */}
              <div className={`p-4 rounded-md border space-y-2 ${cardItemBg}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${textTitle}`}>
                  <IconScale className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dados da Parte Representada</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className={`text-[10px] uppercase font-mono block ${textSub}`}>Titular / Razão Social</span>
                    <strong className={`font-serif font-bold text-sm ${textTitle}`}>
                      {detalhes?.clientes?.nome || 'Não vinculado'}
                    </strong>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-mono block ${textSub}`}>Localização / Segmento</span>
                    <span className={`font-mono text-xs ${textSub}`}>
                      {detalhes?.clientes?.cidade || 'N/D'} • {detalhes?.clientes?.uf || 'N/D'} ({detalhes?.clientes?.segmento || 'Geral'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Condução Processual */}
              <div className={`p-4 rounded-md border space-y-2 ${cardItemBg}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${textTitle}`}>
                  Patronato & Responsabilidade Técnica
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className={`text-[10px] uppercase font-mono block ${textSub}`}>Advogado Condutor</span>
                    <strong className={`font-serif text-xs ${textTitle}`}>
                      {detalhes?.responsavel || 'Sem atribuição'}
                    </strong>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-mono block ${textSub}`}>Estimativa de Retorno (Ponderada)</span>
                    <span className="font-mono font-bold text-emerald-500">
                      {formatarMoeda((detalhes?.valor_causa || 0) * (detalhes?.prob_sucesso || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className={`p-4 border-t flex justify-end ${headerBg}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-semibold rounded border transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            Fechar Ficha Técnica
          </button>
        </div>
      </div>
    </div>
  );
}