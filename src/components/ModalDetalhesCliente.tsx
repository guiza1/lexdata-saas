import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { IconScale, IconUsers } from './Icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ModalDetalhesClienteProps {
  clienteId: number | null;
  onClose: () => void;
}

export function ModalDetalhesCliente({ clienteId, onClose }: ModalDetalhesClienteProps) {
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

        const listaProcessos: any[] = processosData || [];
        const listaFaturas: any[] = faturasData || [];

        const totalCausa = listaProcessos.reduce((acc: number, p: any) => acc + (Number(p.valor_causa) || 0), 0);
        const totalFaturado = listaFaturas.reduce((acc: number, f: any) => acc + (Number(f.valor) || 0), 0);

        let totalPago = 0;
        listaFaturas.forEach((f: any) => {
          if (f.pagamentos && Array.isArray(f.pagamentos)) {
            f.pagamentos.forEach((pg: any) => {
              totalPago += Number(pg.valor_pago) || 0;
            });
          }
        });

        setDetalhes({
          cliente: clienteData,
          processos: listaProcessos,
          faturas: listaFaturas,
          resumo: {
            totalProcessos: listaProcessos.length,
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

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const formatarData = (dataStr: string) => {
    if (!dataStr) return 'N/D';
    return new Date(dataStr).toLocaleDateString('pt-PT');
  };

  return (
    <Dialog open={!!clienteId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden font-sans">

        {/* Cabeçalho */}
        <DialogHeader className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="text-[10px] font-mono font-bold bg-accent/15 border-accent/30 text-accent-foreground">
              CLIENTE ID #{detalhes?.cliente?.cliente_id || clienteId}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {detalhes?.cliente?.cidade || 'N/D'} • {detalhes?.cliente?.uf || detalhes?.cliente?.UF || 'N/D'}
            </Badge>
          </div>

          <DialogTitle className="text-base sm:text-lg font-bold uppercase tracking-wider break-words pr-6">
            {detalhes?.cliente?.nome || 'Ficha Cadastral do Cliente'}
          </DialogTitle>
          <p className="text-xs mt-0.5 text-muted-foreground">
            Segmento de Mercado: <strong className="text-foreground">{detalhes?.cliente?.segmento || 'Geral'}</strong>
          </p>
        </DialogHeader>

        {/* Conteúdo com Rolagem */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="text-center py-16 font-mono text-muted-foreground">Consolidando dados relacionais da conta...</div>
          ) : detalhes ? (
            <>
              {/* KPIs de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-md border border-border bg-surface-sunken min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">Processos</span>
                  <span className="text-xl font-bold font-mono mt-1 block">
                    {detalhes.resumo.totalProcessos}
                  </span>
                </div>
                <div className="p-3.5 rounded-md border border-border bg-surface-sunken min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">Volume em Causa</span>
                  <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 block tabular-nums truncate">
                    {formatarMoeda(detalhes.resumo.totalCausa)}
                  </span>
                </div>
                <div className="p-3.5 rounded-md border border-border bg-surface-sunken min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">Honorários Pagos</span>
                  <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block tabular-nums truncate">
                    {formatarMoeda(detalhes.resumo.totalPago)}
                  </span>
                </div>
                <div className="p-3.5 rounded-md border border-border bg-surface-sunken min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">Saldo Pendente</span>
                  <span className={`text-lg font-mono font-bold mt-1 block tabular-nums truncate ${detalhes.resumo.totalPendente > 0 ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                    {formatarMoeda(detalhes.resumo.totalPendente)}
                  </span>
                </div>
              </div>

              {/* Processos Judiciais */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
                  <IconScale className="w-3.5 h-3.5 text-accent-foreground flex-shrink-0" />
                  <span>Processos Judiciais Vinculados ({detalhes.processos.length})</span>
                </h3>

                {detalhes.processos.length === 0 ? (
                  <div className="p-4 text-center font-mono text-[11px] rounded-md border border-dashed border-border text-muted-foreground bg-surface-sunken/50">
                    Nenhum processo judicial ativo registrado para este cliente.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detalhes.processos.map((proc: any) => (
                      <div
                        key={proc.processo_id}
                        className="p-3.5 rounded-md border border-border bg-surface-sunken flex flex-wrap justify-between items-start gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
                              {proc.numero_processo}
                            </span>
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              {proc.area}
                            </Badge>
                            <span className="font-medium break-words">
                              {proc.tipo}
                            </span>
                          </div>
                          <div className="text-[11px] flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                            <span>Advogado: <strong className="text-foreground">{proc.responsavel}</strong></span>
                            <span>Fase: <strong className="text-foreground">{proc.etapa_atual}</strong></span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                              Êxito: {Math.round((proc.prob_sucesso || 0) * 100)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] uppercase font-mono block text-muted-foreground">Valor em Causa</span>
                          <span className="font-mono font-bold text-xs tabular-nums">
                            {formatarMoeda(proc.valor_causa)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico Financeiro */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <IconUsers className="w-3.5 h-3.5 text-accent-foreground flex-shrink-0" />
                  <span>Faturamento &amp; Honorários Emitidos ({detalhes.faturas.length})</span>
                </h3>

                {detalhes.faturas.length === 0 ? (
                  <div className="p-4 text-center font-mono text-[11px] rounded-md border border-dashed border-border text-muted-foreground bg-surface-sunken/50">
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
                          className="p-3 rounded-md border border-border bg-surface-sunken flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-medium">
                                FATURA #{fat.fatura_id}
                              </span>
                              <Badge className={
                                isLiquidada || (fat.status || '').toLowerCase() === 'pago'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-accent/15 text-accent-foreground border-accent/30'
                              }>
                                {isLiquidada ? 'LIQUIDADA' : (fat.status || 'PENDENTE').toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-[11px] font-mono block text-muted-foreground">
                              Vencimento: {formatarData(fat.data_vencimento || fat.data_emissao || fat.data)}
                            </span>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold font-mono block tabular-nums">
                              {formatarMoeda(valorFatura)}
                            </span>
                            {pagoNaFat > 0 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
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
          ) : null}
        </div>

        {/* Rodapé */}
        <DialogFooter className="p-4 border-t border-border">
  <Button type="button" variant="outline" onClick={onClose} className="text-xs font-semibold">
    Fechar Ficha
  </Button>
</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}