import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ModalDetalhesCliente } from './ModalDetalhesCliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ClienteComMetricas {
  cliente_id: number;
  nome: string;
  cidade: string;
  uf: string;
  segmento?: string;
  totalProcessos: number;
  valorTotalCarteira: number;
  totalFaturado: number;
}

export function ClientesView() {
  const { usuario } = useAuth();

  const [clientes, setClientes] = useState<ClienteComMetricas[]>([]);
  const [busca, setBusca] = useState('');
  const [visualizacao, setVisualizacao] = useState<'cards' | 'lista'>('cards');
  const [loading, setLoading] = useState(true);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<ClienteComMetricas | null>(null);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);

  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [segmento, setSegmento] = useState('Pessoa Jurídica');

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const [
        { data: dataClientes },
        { data: dataProcessos },
        { data: dataFaturas }
      ] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('processos').select('cliente_id, valor_causa, responsavel'),
        supabase.from('faturas').select('cliente_id, valor')
      ]);

      const todosProcessos: any[] = dataProcessos || [];
      const todasFaturas: any[] = dataFaturas || [];
      const todosClientes: any[] = dataClientes || [];

      const isAdvogado = usuario?.perfil === 'advogado' && usuario.advogadoResponsavel;
      const processosFiltrados = isAdvogado
        ? todosProcessos.filter((p: any) => p.responsavel === usuario.advogadoResponsavel)
        : todosProcessos;

      const idsClientesPermitidos = new Set(processosFiltrados.map((p: any) => p.cliente_id));

      const processosPorCliente: Record<number, { count: number; valor: number }> = {};
      processosFiltrados.forEach((p: any) => {
        if (!processosPorCliente[p.cliente_id]) {
          processosPorCliente[p.cliente_id] = { count: 0, valor: 0 };
        }
        processosPorCliente[p.cliente_id].count += 1;
        processosPorCliente[p.cliente_id].valor += Number(p.valor_causa) || 0;
      });

      const faturasPorCliente: Record<number, number> = {};
      todasFaturas.forEach((f: any) => {
        faturasPorCliente[f.cliente_id] = (faturasPorCliente[f.cliente_id] || 0) + (Number(f.valor) || 0);
      });

      const consolidados: ClienteComMetricas[] = todosClientes
        .filter((c: any) => !isAdvogado || idsClientesPermitidos.has(c.cliente_id))
        .map((c: any) => ({
          cliente_id: c.cliente_id,
          nome: c.nome,
          cidade: c.cidade || 'N/D',
          uf: c.uf || c.UF || c.estado || 'N/D',
          segmento: c.segmento || 'Geral',
          totalProcessos: processosPorCliente[c.cliente_id]?.count || 0,
          valorTotalCarteira: processosPorCliente[c.cliente_id]?.valor || 0,
          totalFaturado: isAdvogado ? 0 : (faturasPorCliente[c.cliente_id] || 0)
        }));

      setClientes(consolidados);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, [usuario]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  const abrirModalCriacao = () => {
    setClienteParaEditar(null);
    setNome('');
    setCidade('');
    setUf('');
    setSegmento('Pessoa Jurídica');
    setErroForm(null);
    setModalCadastroAberto(true);
  };

  const abrirModalEdicao = (c: ClienteComMetricas, e: React.MouseEvent) => {
    e.stopPropagation();
    setClienteParaEditar(c);
    setNome(c.nome);
    setCidade(c.cidade === 'N/D' ? '' : c.cidade);
    setUf(c.uf === 'N/D' ? '' : c.uf);
    setSegmento(c.segmento || 'Pessoa Jurídica');
    setErroForm(null);
    setModalCadastroAberto(true);
  };

  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!nome.trim()) {
      setErroForm('A razão social / nome do titular é de preenchimento obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        cidade: cidade.trim() || null,
        uf: uf.trim().toUpperCase() || null,
        segmento
      };

      if (clienteParaEditar) {
        const { error } = await supabase
          .from('clientes')
          .update(payload)
          .eq('cliente_id', clienteParaEditar.cliente_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([payload]);

        if (error) throw error;
      }

      setModalCadastroAberto(false);
      carregarClientes();
    } catch (err: any) {
      setErroForm(err.message || 'Falha ao salvar registro cadastral.');
    } finally {
      setSalvando(false);
    }
  };

  const exportarCSV = () => {
    if (clientesFiltrados.length === 0) return;

    const cabecalho = ['ID', 'Cliente/Razao Social', 'Cidade', 'UF', 'Segmento', 'Processos Vinculados', 'Volume em Causa (€)', 'Faturamento Total (€)'].join(';');

    const linhas = clientesFiltrados.map(c => [
      c.cliente_id,
      `"${(c.nome || '').replace(/"/g, '""')}"`,
      `"${(c.cidade || '').replace(/"/g, '""')}"`,
      `"${(c.uf || '').replace(/"/g, '""')}"`,
      `"${(c.segmento || '').replace(/"/g, '""')}"`,
      c.totalProcessos,
      c.valorTotalCarteira.toFixed(2),
      c.totalFaturado.toFixed(2)
    ].join(';'));

    const conteudoCSV = '\uFEFF' + [cabecalho, ...linhas].join('\n');
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `carteira_clientes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return true;
    return (
      c.nome.toLowerCase().includes(termo) ||
      c.cidade.toLowerCase().includes(termo) ||
      c.uf.toLowerCase().includes(termo) ||
      String(c.cliente_id).includes(termo)
    );
  });

  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina) || 1;
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indexInicio, indexFim);

  return (
    <div className="flex flex-col gap-4 pb-2 font-sans">
      {/* Modal Ficha 360° */}
      <ModalDetalhesCliente
        clienteId={clienteSelecionadoId}
        onClose={() => setClienteSelecionadoId(null)}
      />

      {/* Modal Criar / Editar Cliente */}
      <Dialog open={modalCadastroAberto} onOpenChange={setModalCadastroAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider">
              {clienteParaEditar ? `Editar Cadastro #${clienteParaEditar.cliente_id}` : 'Novo Registro Cadastral'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSalvarCliente} className="space-y-4 text-xs">
            {erroForm && (
              <div role="alert" className="p-3 bg-red-950/40 border border-red-900/60 text-red-300 rounded font-mono">
                {erroForm}
              </div>
            )}

            <div>
              <label htmlFor="nome-cliente" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">
                Razão Social / Nome do Titular *
              </label>
              <Input
                id="nome-cliente"
                type="text"
                placeholder="Ex: Investcorp S.A. ou Maria Souza"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label htmlFor="cidade-cliente" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Cidade</label>
                <Input
                  id="cidade-cliente"
                  type="text"
                  placeholder="Ex: Lisboa"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label htmlFor="uf-cliente" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">UF / Distrito</label>
                <Input
                  id="uf-cliente"
                  type="text"
                  placeholder="LX"
                  maxLength={3}
                  value={uf}
                  onChange={e => setUf(e.target.value)}
                  className="text-xs uppercase text-center font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="segmento-cliente" className="block font-medium mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">Classificação de Segmento</label>
              <select
                id="segmento-cliente"
                value={segmento}
                onChange={e => setSegmento(e.target.value)}
                className="w-full border border-input bg-surface-sunken rounded px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
              >
                <option value="Pessoa Jurídica">Pessoa Jurídica (Corporativo)</option>
                <option value="Pessoa Física">Pessoa Física (Individual)</option>
                <option value="Instituição Financeira">Instituição Financeira</option>
                <option value="Setor Público">Setor Público</option>
              </select>
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalCadastroAberto(false)} className="text-xs font-semibold">
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} className="text-xs font-semibold uppercase tracking-wider">
                {salvando ? 'Gravando...' : clienteParaEditar ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Barra de Ferramentas Superior */}
      <Card className="p-4 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por razão social, cidade ou ID..."
              className="text-xs"
              aria-label="Buscar clientes"
            />
          </div>

          <div className="p-1 rounded border border-border bg-surface-sunken flex items-center gap-1" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              onClick={() => setVisualizacao('cards')}
              aria-pressed={visualizacao === 'cards'}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                visualizacao === 'cards' ? 'bg-surface text-accent-foreground shadow-sm border border-border' : 'text-muted-foreground'
              )}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao('lista')}
              aria-pressed={visualizacao === 'lista'}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                visualizacao === 'lista' ? 'bg-surface text-accent-foreground shadow-sm border border-border' : 'text-muted-foreground'
              )}
            >
              Tabela
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <label htmlFor="itens-pagina">Exibir:</label>
            <select
              id="itens-pagina"
              value={itensPorPagina}
              onChange={e => setItensPorPagina(Number(e.target.value))}
              className="border border-input bg-surface-sunken rounded px-2 py-1.5 focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
            >
              <option value={6}>6 por página</option>
              <option value={9}>9 por página</option>
              <option value={12}>12 por página</option>
              <option value={24}>24 por página</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={exportarCSV}
            title="Descarregar planilha CSV"
            className="gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/40"
          >
            <span>[CSV]</span> Exportar Relatório
          </Button>

          {usuario?.perfil === 'admin' && (
            <Button type="button" onClick={abrirModalCriacao} className="gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <span>+</span> Novo Registro
            </Button>
          )}
        </div>
      </Card>

      {/* Grid de Cards ou Tabela */}
      <div className="w-full">
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-muted-foreground">Carregando carteira consolidada...</div>
        ) : visualizacao === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesPaginados.map(c => (
              <Card
                key={c.cliente_id}
                onClick={() => setClienteSelecionadoId(c.cliente_id)}
                className="p-5 justify-between cursor-pointer group hover:border-ring/60 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] font-mono font-bold bg-accent/15 border-accent/30 text-accent-foreground">
                        ID #{c.cliente_id}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {c.cidade} • {c.uf}
                      </Badge>
                    </div>

                    {usuario?.perfil === 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => abrirModalEdicao(c, e)}
                        aria-label={`Editar dados de ${c.nome}`}
                        className="p-1.5 rounded border border-border bg-surface-sunken hover:bg-border/40 text-[10px] font-mono transition-colors cursor-pointer"
                      >
                        EDIT
                      </button>
                    )}
                  </div>

                  <h4 className="text-sm font-bold uppercase tracking-wider mb-1 line-clamp-1 group-hover:text-accent-foreground transition-colors">
                    {c.nome}
                  </h4>
                  <p className="text-xs font-mono mb-4 text-muted-foreground">{c.segmento}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-muted-foreground">Processos</span>
                    <span className="font-bold">{c.totalProcessos} causas</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-muted-foreground">Volume em Causa</span>
                    <span className="font-mono font-bold text-accent-foreground tabular-nums">{formatarMoeda(c.valorTotalCarteira)}</span>
                  </div>
                </div>

                <div className="pt-2 mt-2 text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-accent-foreground group-hover:underline">
                    Inspecionar Ficha &rarr;
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-x-auto p-0">
            <Table>
              <caption className="sr-only">Lista de clientes cadastrados</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Titular / Razão Social</TableHead>
                  <TableHead>Comarca / Região</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-center">Processos</TableHead>
                  <TableHead className="text-right">Volume em Causa</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesPaginados.map(c => (
                  <TableRow
                    key={c.cliente_id}
                    onClick={() => setClienteSelecionadoId(c.cliente_id)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-accent-foreground font-bold">#{c.cliente_id}</TableCell>
                    <TableCell className="font-bold uppercase tracking-wider">{c.nome}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{c.cidade} • {c.uf}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-mono">{c.segmento}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold font-mono tabular-nums">
                      {c.totalProcessos}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-accent-foreground tabular-nums">
                      {formatarMoeda(c.valorTotalCarteira)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {usuario?.perfil === 'admin' ? formatarMoeda(c.totalFaturado) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {usuario?.perfil === 'admin' && (
                          <button
                            type="button"
                            onClick={(e) => abrirModalEdicao(c, e)}
                            aria-label={`Editar dados de ${c.nome}`}
                            className="px-2 py-1 rounded border border-border bg-surface-sunken hover:bg-border/40 text-[10px] font-mono transition-colors cursor-pointer"
                          >
                            EDIT
                          </button>
                        )}
                        <span className="text-[10px] font-mono text-accent-foreground hover:underline uppercase">
                          Ficha &rarr;
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Paginação Inferior */}
      <Card className="p-4 flex flex-wrap justify-between items-center gap-4 text-xs mt-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          Exibindo <strong className="text-foreground">{clientesFiltrados.length > 0 ? indexInicio + 1 : 0}</strong> a{' '}
          <strong className="text-foreground">{Math.min(indexFim, clientesFiltrados.length)}</strong> de{' '}
          <strong className="text-foreground">{clientesFiltrados.length}</strong> contas registradas
        </span>

        <div className="flex items-center gap-2 font-mono">
          <Button
            type="button"
            variant="outline"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
            className="text-xs font-semibold"
          >
            &larr; Anterior
          </Button>

          <Badge className="text-xs font-bold bg-accent/15 border-accent/30 text-accent-foreground">
            {paginaAtual} / {totalPaginas}
          </Badge>

          <Button
            type="button"
            variant="outline"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
            className="text-xs font-semibold"
          >
            Próxima &rarr;
          </Button>
        </div>
      </Card>
    </div>
  );
}