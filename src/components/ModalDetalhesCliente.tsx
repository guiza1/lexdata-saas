import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { IconScale, IconUsers } from './Icons';

interface ModalDetalhesClienteProps {
  clienteId: number | null;
  onClose: () => void;
}

export function ModalDetalhesCliente({ clienteId, onClose }: ModalDetalhesClienteProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [detalhes, setDetalhes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarFichaCliente() {
      if (!clienteId) return;
      setLoading(true);
      try {
        const [
          { data: clienteData },
          { data: processosData },
          { data: faturasData }
        ] = await Promise.all([
          supabase.from('clientes').select('*').eq('cliente_id', clienteId).single(),
          supabase.from('processos').select('*').eq('cliente_id', clienteId),
          supabase.from('faturas').select('*, pagamentos(*)').eq('cliente_id', clienteId)
        ]);

        const processos = processosData || [];
        const faturas = faturasData || [];

        const totalCausa = processos.reduce((acc, p) => acc + (Number(p.valor_causa) || 0), 0);
        const totalFaturado = faturas.reduce((acc, f) => acc + (Number(f.valor) || 0), 0);
        
        let totalPago = 0;
        faturas.forEach(f => {
          if (f.pagamentos && Array.isArray(f.pagamentos)) {
            f.pagamentos.forEach((pg: any) => {
              totalPago += Number(pg.valor_pago) || 0;
            });
          }
        });

        setDetalhes({
          cliente: clienteData,
          processos,
          faturas,
          resumo: {
            totalProcessos: processos.length,
            totalCausa,
            totalFaturado,
            totalPago,
            totalPendente: Math.max(0, totalFaturado - totalPago)
          }
        });
      } catch (err) {
        console.error('Erro ao buscar ficha do cliente:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarFichaCliente();
  }, [clienteId]);

  if (!clienteId) return null;

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
      <div className={`border rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${modalBg}`}>
        
        {/* Cabeçalho */}
        <div className={`p-6 border-b flex justify-between items-start ${headerBg}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                CLIENTE ID #{detalhes?.cliente?.cliente_id || clienteId}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                {detalhes?.cliente?.cidade || 'N/D'} • {detalhes?.cliente?.uf || detalhes?.cliente?.UF || 'N/D'}
              </span>
            </div>

            <h2 className={`text-lg font-serif font-bold uppercase tracking-wider ${textTitle}`}>
              {detalhes?.cliente?.nome || 'Ficha Cadastral do Cliente'}
            </h2>
            <p className={`text-xs mt-0.5 ${textSub}`}>
              Segmento de Mercado: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{detalhes?.cliente?.segmento || 'Geral'}</strong>
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
            <div className="text-center py-16 font-mono text-slate-400">Consolidando dados relacionais da conta...</div>
          ) : (
            <>
              {/* KPIs de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-md border ${cardItemBg}`}>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${textSub}`}>Processos</span>
                  <span className={`text-xl font-serif font-bold mt-1 block ${textTitle}`}>
                    {detalhes.resumo.totalProcessos}
                  </span>
                </div>
                <div className={`p-3.5 rounded-md border ${cardItemBg}`}>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${textSub}`}>Volume em Causa</span>
                  <span className="text-lg font-mono font-bold text-blue-500 mt-1 block">
                    {formatarMoeda(detalhes.resumo.totalCausa)}
                  </span>
                </div>
                <div className={`p-3.5 rounded-md border ${cardItemBg}`}>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${textSub}`}>Honorários Pagos</span>
                  <span className="text-lg font-mono font-bold text-emerald-500 mt-1 block">
                    {formatarMoeda(detalhes.resumo.totalPago)}
                  </span>
                </div>
                <div className={`p-3.5 rounded-md border ${cardItemBg}`}>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${textSub}`}>Saldo Pendente</span>
                  <span className={`text-lg font-mono font-bold mt-1 block ${detalhes.resumo.totalPendente > 0 ? 'text-amber-500' : textSub}`}>
                    {formatarMoeda(detalhes.resumo.totalPendente)}
                  </span>
                </div>
              </div>

              {/* Seção 1: Processos Judiciais */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${textTitle}`}>
                    <IconScale className="w-3.5 h-3.5 text-amber-500" />
                    <span>Processos Judiciais Vinculados ({detalhes.processos.length})</span>
                  </h3>
                </div>

                {detalhes.processos.length === 0 ? (
                  <div className={`p-4 text-center font-mono text-[11px] rounded-md border border-dashed ${
                    isDark ? 'border-slate-800 text-slate-500 bg-[#090D16]/50' : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}>
                    Nenhum processo judicial ativo registrado para este cliente.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalhes.processos.map((proc: any) => (
                      <div
                        key={proc.processo_id}
                        className={`p-3.5 rounded-md border flex flex-wrap justify-between items-center gap-3 transition-colors ${cardItemBg}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-blue-500 text-[11px]">
                              {proc.numero_processo}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                              isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
                            }`}>
                              {proc.area}
                            </span>
                            <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {proc.tipo}
                            </span>
                          </div>
                          <div className={`text-[11px] flex gap-4 ${textSub}`}>
                            <span>Advogado: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{proc.responsavel}</strong></span>
                            <span>Fase: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{proc.etapa_atual}</strong></span>
                            <span className="font-mono text-emerald-500 font-semibold">
                              Êxito: {Math.round((proc.prob_sucesso || 0) * 100)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] uppercase font-mono block ${textSub}`}>Valor em Causa</span>
                          <span className={`font-mono font-bold text-xs ${textTitle}`}>
                            {formatarMoeda(proc.valor_causa)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 2: Histórico Financeiro */}
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${textTitle}`}>
                  <IconUsers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Faturamento & Honorários Emitidos ({detalhes.faturas.length})</span>
                </h3>

                {detalhes.faturas.length === 0 ? (
                  <div className={`p-4 text-center font-mono text-[11px] rounded-md border border-dashed ${
                    isDark ? 'border-slate-800 text-slate-500 bg-[#090D16]/50' : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}>
                    Nenhuma fatura emitida para este cliente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detalhes.faturas.map((fat: any) => {
                      const valorFatura = Number(fat.valor) || 0;
                      const pagoNaFat = (fat.pagamentos || []).reduce((acc: number, p: any) => acc + (Number(p.valor_pago) || 0), 0);
                      const isLiquidada = pagoNaFat >= valorFatura && valorFatura > 0;

                      return (
                        <div
                          key={fat.fatura_id}
                          className={`p-3 rounded-md border flex items-center justify-between ${cardItemBg}`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-medium ${textTitle}`}>
                                FATURA #{fat.fatura_id}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  isLiquidada || (fat.status || '').toLowerCase() === 'pago'
                                    ? isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isDark ? 'bg-amber-950/40 text-amber-400 border-amber-800/50' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {isLiquidada ? 'LIQUIDADA' : (fat.status || 'PENDENTE').toUpperCase()}
                              </span>
                            </div>
                            <span className={`text-[11px] font-mono block ${textSub}`}>
                              Vencimento: {formatarData(fat.data_vencimento || fat.data_emissao || fat.data)}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-bold font-mono block ${textTitle}`}>
                              {formatarMoeda(valorFatura)}
                            </span>
                            {pagoNaFat > 0 && (
                              <span className="text-[10px] text-emerald-500 font-mono">
                                Quitado: {formatarMoeda(pagoNaFat)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}