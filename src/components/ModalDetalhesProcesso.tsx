import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { IconScale } from './Icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ModalDetalhesProcessoProps {
  processoId: number | null;
  onClose: () => void;
}

export function ModalDetalhesProcesso({ processoId, onClose }: ModalDetalhesProcessoProps) {
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

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const formatarData = (dataStr: string) => {
    if (!dataStr) return 'N/D';
    return new Date(dataStr).toLocaleDateString('pt-PT');
  };

  return (
    <Dialog open={!!processoId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden font-sans">

        {/* Cabeçalho */}
        <DialogHeader className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="text-[10px] font-mono font-bold bg-accent/15 border-accent/30 text-accent-foreground">
              AUTOS Nº {detalhes?.numero_processo || processoId}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {detalhes?.area || 'Geral'}
            </Badge>
          </div>

          <DialogTitle className="text-base sm:text-lg font-serif font-bold uppercase tracking-wider break-words pr-6">
            {detalhes?.tipo || 'Ficha Técnica dos Autos'}
          </DialogTitle>
          <p className="text-xs mt-0.5 font-mono text-muted-foreground">
            Comarca de Abertura: {formatarData(detalhes?.data_abertura)}
          </p>
        </DialogHeader>

        {/* Conteúdo com Rolagem */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="text-center py-16 font-mono text-muted-foreground">Consultando registros processuais...</div>
          ) : (
            <>
              {/* KPIs do Processo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-md border border-border bg-surface-sunken min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">Valor da Causa</span>
                  <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 block truncate">
                    {formatarMoeda(detalhes?.valor_causa)}
                  </span>
                </div>
                <div className="p-3.5 rounded-md border border-border bg-surface-sunken min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">Taxa de Êxito</span>
                  <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {Math.round((detalhes?.prob_sucesso || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-md border border-border bg-surface-sunken min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">Fase Atual</span>
                  <span className="text-sm font-serif font-bold text-accent-foreground mt-1.5 block uppercase break-words">
                    {detalhes?.etapa_atual}
                  </span>
                </div>
              </div>

              {/* Informações da Parte / Cliente */}
              <div className="p-4 rounded-md border border-border bg-surface-sunken space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <IconScale className="w-3.5 h-3.5 text-accent-foreground flex-shrink-0" />
                  <span>Dados da Parte Representada</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono block text-muted-foreground">Titular / Razão Social</span>
                    <strong className="font-serif font-bold text-sm break-words">
                      {detalhes?.clientes?.nome || 'Não vinculado'}
                    </strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono block text-muted-foreground">Localização / Segmento</span>
                    <span className="font-mono text-xs text-muted-foreground break-words">
                      {detalhes?.clientes?.cidade || 'N/D'} • {detalhes?.clientes?.uf || 'N/D'} ({detalhes?.clientes?.segmento || 'Geral'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Condução Processual */}
              <div className="p-4 rounded-md border border-border bg-surface-sunken space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Patronato &amp; Responsabilidade Técnica
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono block text-muted-foreground">Advogado Condutor</span>
                    <strong className="font-serif text-xs break-words">
                      {detalhes?.responsavel || 'Sem atribuição'}
                    </strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono block text-muted-foreground">Estimativa de Retorno (Ponderada)</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                      {formatarMoeda((detalhes?.valor_causa || 0) * (detalhes?.prob_sucesso || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        <DialogFooter className="p-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs font-semibold">
            Fechar Ficha Técnica
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}