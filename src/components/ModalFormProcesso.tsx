import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ModalFormProcessoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processoParaEditar?: any | null;
}

export function ModalFormProcesso({ isOpen, onClose, onSuccess, processoParaEditar }: ModalFormProcessoProps) {
  const [clientes, setClientes] = useState<{ cliente_id: number; nome: string }[]>([]);
  const [etapas, setEtapas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden font-sans">

        {/* Cabeçalho */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border">
          <DialogTitle className="text-sm font-serif font-bold uppercase tracking-wider pr-6">
            {processoParaEditar ? 'Editar Autos Processuais' : 'Abertura de Autos Judiciais'}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            {processoParaEditar ? 'Atualização de parâmetros e fase' : 'Registro de nova demanda no pipeline'}
          </p>
        </DialogHeader>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {erro && (
            <div role="alert" className="p-3 bg-red-950/40 border border-red-900/60 text-red-300 rounded">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="numero-processo" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Nº dos Autos *</label>
              <Input
                id="numero-processo"
                type="text"
                placeholder="Ex: 5001234-88.2024.8.00"
                value={numeroProcesso}
                onChange={e => setNumeroProcesso(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="cliente-processo" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Parte / Cliente *</label>
              <select
                id="cliente-processo"
                value={clienteId}
                onChange={e => setClienteId(Number(e.target.value))}
                className="w-full border border-input bg-surface-sunken rounded px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="area-processo" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Área do Direito</label>
              <select
                id="area-processo"
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full border border-input bg-surface-sunken rounded px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
              >
                <option value="Trabalhista">Trabalhista</option>
                <option value="Cível">Cível</option>
                <option value="Tributário">Tributário</option>
                <option value="Família">Família</option>
                <option value="Empresarial">Empresarial</option>
              </select>
            </div>

            <div>
              <label htmlFor="responsavel-processo" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Advogado Responsável</label>
              <select
                id="responsavel-processo"
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
                className="w-full border border-input bg-surface-sunken rounded px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
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
            <label htmlFor="objeto-processo" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Objeto / Ação *</label>
            <Input
              id="objeto-processo"
              type="text"
              placeholder="Ex: Ação Anulatória de Débito Fiscal"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fase-processo" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Fase Inicial</label>
              <select
                id="fase-processo"
                value={etapaAtual}
                onChange={e => setEtapaAtual(e.target.value)}
                className="w-full border border-input bg-surface-sunken rounded px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
              >
                {etapas.map(etp => (
                  <option key={etp} value={etp}>{etp}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="valor-causa" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Valor em Causa (€) *</label>
              <Input
                id="valor-causa"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={valorCausa}
                onChange={e => setValorCausa(e.target.value === '' ? '' : Number(e.target.value))}
                className="text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Slider de Probabilidade */}
          <div className="p-3.5 rounded border border-border bg-surface-sunken">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="prob-sucesso" className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Probabilidade de Êxito</label>
              <span className="font-mono font-bold text-accent-foreground text-xs">
                {Math.round(probSucesso * 100)}%
              </span>
            </div>
            <input
              id="prob-sucesso"
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={probSucesso}
              onChange={e => setProbSucesso(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border rounded appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Ações */}
          <DialogFooter className="pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs font-semibold">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="text-xs font-semibold uppercase tracking-wider">
              {loading ? 'Gravando...' : (processoParaEditar ? 'Salvar Alterações' : 'Cadastrar Autos')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}