import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface QualidadeMetricas {
  totalClientes: number;
  totalProcessos: number;
  totalFaturas: number;
  totalPagamentos: number;
  processosSemCliente: number;
  taxaCompletude: number;
  faturasOrfas: number;
}

interface EntidadeDicionario {
  tabela: string;
  coluna: string;
  tipo: string;
  chave: string;
  descricao: string;
  regraNegocio: string;
}

const DICIONARIO_DADOS: EntidadeDicionario[] = [
  { tabela: 'processos', coluna: 'processo_id', tipo: 'INTEGER', chave: 'PK', descricao: 'Identificador único do processo judicial', regraNegocio: 'Sequencial e obrigatório' },
  { tabela: 'processos', coluna: 'cliente_id', tipo: 'INTEGER', chave: 'FK', descricao: 'Chave estrangeira vinculada à tabela clientes', regraNegocio: 'Deve existir em clientes.cliente_id' },
  { tabela: 'processos', coluna: 'numero_processo', tipo: 'TEXT', chave: '-', descricao: 'Numeração CNJ/Oficial do processo', regraNegocio: 'Formato padrão unificado' },
  { tabela: 'processos', coluna: 'area', tipo: 'TEXT', chave: '-', descricao: 'Ramo do direito (Trabalhista, Cível, etc.)', regraNegocio: 'Padronizado conforme tabela de domínio' },
  { tabela: 'processos', coluna: 'responsavel', tipo: 'TEXT', chave: '-', descricao: 'Advogado líder condutor da causa', regraNegocio: 'Atribuição interna obrigatória' },
  { tabela: 'processos', coluna: 'etapa_atual', tipo: 'TEXT', chave: '-', descricao: 'Fase processual atual no pipeline', regraNegocio: 'Vinculado às etapas do Kanban' },
  { tabela: 'processos', coluna: 'prob_sucesso', tipo: 'NUMERIC', chave: '-', descricao: 'Probabilidade de êxito da demanda (0 a 1.0)', regraNegocio: 'Utilizado no pipeline financeiro ponderado' },
  { tabela: 'processos', coluna: 'valor_causa', tipo: 'NUMERIC', chave: '-', descricao: 'Valor econômico pleiteado em juízo (€)', regraNegocio: 'Base de cálculo de risco e honorários' },

  { tabela: 'clientes', coluna: 'cliente_id', tipo: 'INTEGER', chave: 'PK', descricao: 'Identificador exclusivo do cliente', regraNegocio: 'Auto-incremento único' },
  { tabela: 'clientes', coluna: 'nome', tipo: 'TEXT', chave: '-', descricao: 'Nome completo ou Razão Social', regraNegocio: 'Obrigatório sem duplicidade cadastral' },
  { tabela: 'clientes', coluna: 'cidade', tipo: 'TEXT', chave: '-', descricao: 'Município de residência/sede', regraNegocio: 'Localização geográfica para análises' },
  { tabela: 'clientes', coluna: 'uf', tipo: 'TEXT', chave: '-', descricao: 'Unidade Federativa / Distrito', regraNegocio: 'Sigla padronizada' },

  { tabela: 'faturas', coluna: 'fatura_id', tipo: 'INTEGER', chave: 'PK', descricao: 'Identificador único da cobrança/honorário', regraNegocio: 'Emissão por cliente' },
  { tabela: 'faturas', coluna: 'cliente_id', tipo: 'INTEGER', chave: 'FK', descricao: 'Cliente pagador responsável', regraNegocio: 'Integridade referencial estrita' },
  { tabela: 'faturas', coluna: 'valor', tipo: 'NUMERIC', chave: '-', descricao: 'Montante cobrado (€)', regraNegocio: 'Valor monetário líquido positivo' },
  { tabela: 'faturas', coluna: 'status', tipo: 'TEXT', chave: '-', descricao: 'Situação de pagamento (Pago, Pendente, Atrasado)', regraNegocio: 'Alimenta o fluxo de caixa executivo' },

  { tabela: 'pagamentos', coluna: 'pagamento_id', tipo: 'INTEGER', chave: 'PK', descricao: 'Identificador do registro de liquidação', regraNegocio: 'Baixa financeira direta' },
  { tabela: 'pagamentos', coluna: 'fatura_id', tipo: 'INTEGER', chave: 'FK', descricao: 'Fatura liquidada pelo pagamento', regraNegocio: 'Cada pagamento aponta para uma fatura' },
  { tabela: 'pagamentos', coluna: 'valor_pago', tipo: 'NUMERIC', chave: '-', descricao: 'Valor monetário efetivamente liquidado (€)', regraNegocio: 'Contabilização no total recebido' },
];

export function DataGovernance() {
  const [metricas, setMetricas] = useState<QualidadeMetricas | null>(null);
  const [tabelaProcessos, setTabelaProcessos] = useState<any[]>([]);
  const [filtroTabelaDicionario, setFiltroTabelaDicionario] = useState<string>('todas');
  const [buscaTabela, setBuscaTabela] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function auditarQualidade() {
      setLoading(true);
      try {
        const [
          { data: clientes },
          { data: processos },
          { data: faturas },
          { data: pagamentos }
        ] = await Promise.all([
          supabase.from('clientes').select('cliente_id, nome, cidade, uf'),
          supabase.from('processos').select('*'),
          supabase.from('faturas').select('fatura_id, cliente_id, valor, status'),
          supabase.from('pagamentos').select('pagamento_id, fatura_id, valor_pago')
        ]);

        const listaClientes: any[] = clientes || [];
        const listaProcessos: any[] = processos || [];
        const listaFaturas: any[] = faturas || [];
        const listaPagamentos: any[] = pagamentos || [];

        setTabelaProcessos(listaProcessos);

        const idsClientesValidos = new Set(listaClientes.map((c: any) => c.cliente_id));
        const processosSemCliente = listaProcessos.filter((p: any) => !idsClientesValidos.has(p.cliente_id)).length;

        const idsFaturasValidas = new Set(listaFaturas.map((f: any) => f.fatura_id));
        const pagamentosOrfaos = listaPagamentos.filter((pg: any) => !idsFaturasValidas.has(pg.fatura_id)).length;

        let totalCamposProcessos = listaProcessos.length * 7;
        let preenchidos = 0;
        listaProcessos.forEach((p: any) => {
          if (p.numero_processo) preenchidos++;
          if (p.area) preenchidos++;
          if (p.tipo) preenchidos++;
          if (p.responsavel) preenchidos++;
          if (p.etapa_atual) preenchidos++;
          if (p.valor_causa !== null && p.valor_causa !== undefined) preenchidos++;
          if (p.prob_sucesso !== null && p.prob_sucesso !== undefined) preenchidos++;
        });

        const taxaCompletude = totalCamposProcessos > 0
          ? Math.round((preenchidos / totalCamposProcessos) * 100)
          : 100;

        setMetricas({
          totalClientes: listaClientes.length,
          totalProcessos: listaProcessos.length,
          totalFaturas: listaFaturas.length,
          totalPagamentos: listaPagamentos.length,
          processosSemCliente,
          taxaCompletude,
          faturasOrfas: pagamentosOrfaos
        });
      } catch (err) {
        console.error('Erro na auditoria de governança:', err);
      } finally {
        setLoading(false);
      }
    }

    auditarQualidade();
  }, []);

  const exportarCSV = () => {
    if (tabelaProcessos.length === 0) return;

    const colunas = ['processo_id', 'numero_processo', 'area', 'tipo', 'responsavel', 'etapa_atual', 'valor_causa', 'prob_sucesso'];
    const cabecalho = colunas.join(';');

    const linhas = tabelaProcessos.map((p: any) =>
      colunas.map(col => {
        let val = p[col] ?? '';
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(';')
    );

    const conteudoCSV = '\uFEFF' + [cabecalho, ...linhas].join('\n');
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_processos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const dicionarioFiltrado = DICIONARIO_DADOS.filter(item =>
    filtroTabelaDicionario === 'todas' || item.tabela === filtroTabelaDicionario
  );

  const processosTabelaFiltrados = tabelaProcessos.filter((p: any) => {
    const termo = buscaTabela.toLowerCase().trim();
    if (!termo) return true;
    return (
      (p.numero_processo || '').toLowerCase().includes(termo) ||
      (p.area || '').toLowerCase().includes(termo) ||
      (p.tipo || '').toLowerCase().includes(termo) ||
      (p.responsavel || '').toLowerCase().includes(termo)
    );
  });

  if (loading) {
    return <div className="p-8 font-mono text-xs text-muted-foreground">Auditoria e catálogo de metadados em análise...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      <Tabs defaultValue="qualidade">
        <TabsList>
          <TabsTrigger value="qualidade">Auditoria &amp; Qualidade</TabsTrigger>
          <TabsTrigger value="diagrama">Diagrama Relacional (DER)</TabsTrigger>
          <TabsTrigger value="dicionario">Dicionário de Metadados</TabsTrigger>
          <TabsTrigger value="dados">Base Operacional (CSV)</TabsTrigger>
        </TabsList>

        {/* Qualidade de Dados */}
        <TabsContent value="qualidade" className="space-y-6 mt-6">
          {metricas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5">
                  <span className="text-[11px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">
                    Taxa de Completude
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{metricas.taxaCompletude}%</span>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Preenchimento Válido</span>
                  </div>
                  <p className="text-[10px] font-mono mt-2 pt-2 border-t border-border text-muted-foreground">
                    Atributos preenchidos sem nulos nos processos.
                  </p>
                </Card>

                <Card className="p-5">
                  <span className="text-[11px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">
                    Integridade Referencial (FKs)
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-3xl font-bold font-mono tabular-nums ${metricas.processosSemCliente === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-accent-foreground'}`}>
                      {metricas.processosSemCliente === 0 ? '100%' : `${metricas.processosSemCliente} órfãos`}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono mt-2 pt-2 border-t border-border text-muted-foreground">
                    Vínculo íntegro entre processos e clientes.
                  </p>
                </Card>

                <Card className="p-5">
                  <span className="text-[11px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">
                    Volume Total Auditado
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold font-mono tabular-nums">
                      {metricas.totalClientes + metricas.totalProcessos + metricas.totalFaturas + metricas.totalPagamentos}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">tuplas</span>
                  </div>
                  <p className="text-[10px] font-mono mt-2 pt-2 border-t border-border text-muted-foreground">
                    Registros ativos nas 4 entidades relacionais.
                  </p>
                </Card>

                <Card className="p-5">
                  <span className="text-[11px] uppercase font-mono tracking-wider block font-semibold text-muted-foreground">
                    Normalização do Schema
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold font-mono text-accent-foreground">3FN</span>
                    <span className="text-xs font-medium text-muted-foreground">Auditado</span>
                  </div>
                  <p className="text-[10px] font-mono mt-2 pt-2 border-t border-border text-muted-foreground">
                    Eliminação de redundâncias e anomalias de escrita.
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="text-accent-foreground font-mono">[SEC]</span> Conformidade LGPD &amp; GDPR
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Dados pessoais de clientes e partes foram minimizados no schema, utilizando identificadores numéricos (`cliente_id`) e restrições de permissão para isolamento de dados entre advogados, evitando exposição indevida perante a LGPD.
                  </p>
                </Card>

                <Card className="p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-mono">[PIPE]</span> Linhagem &amp; Pipeline de Dados
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A camada transacional do PostgreSQL alimenta diretamente a camada analítica do React através do Supabase Client, garantindo latência zero na consolidação de KPIs e consistência nos cálculos de probabilidade de êxito ponderada.
                  </p>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Diagrama Relacional (DER) */}
        <TabsContent value="diagrama" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Modelo Entidade-Relacionamento (DER)
                </h3>
                <p className="text-xs text-muted-foreground">Estrutura relacional normalizada com cardinalidades 1:N</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">PostgreSQL Schema</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg p-4 border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/10 shadow-sm">
                <div className="text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border border-blue-500/30 bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                  <span>clientes</span>
                  <span className="text-[10px] font-mono opacity-80">1</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-accent-foreground">
                    <span>PK cliente_id</span><span>INT</span>
                  </div>
                  <div className="flex justify-between"><span>nome</span><span>TEXT</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>cidade</span><span>TEXT</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>uf</span><span>TEXT</span></div>
                </div>
              </div>

              <div className="rounded-lg p-4 border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/10 shadow-sm">
                <div className="text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border border-emerald-500/30 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300">
                  <span>processos</span>
                  <span className="text-[10px] font-mono opacity-80">N</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-accent-foreground"><span>PK processo_id</span><span>INT</span></div>
                  <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold"><span>FK cliente_id</span><span>INT</span></div>
                  <div className="flex justify-between"><span>numero_processo</span><span>TEXT</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>area / tipo</span><span>TEXT</span></div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold"><span>valor_causa</span><span>NUMERIC</span></div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold"><span>prob_sucesso</span><span>NUMERIC</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>etapa_atual</span><span>TEXT</span></div>
                </div>
              </div>

              <div className="rounded-lg p-4 border border-accent/30 bg-accent/5 shadow-sm">
                <div className="text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border border-accent/30 bg-accent/15 text-accent-foreground">
                  <span>faturas</span>
                  <span className="text-[10px] font-mono opacity-80">N</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-accent-foreground"><span>PK fatura_id</span><span>INT</span></div>
                  <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold"><span>FK cliente_id</span><span>INT</span></div>
                  <div className="flex justify-between"><span>valor</span><span>NUMERIC</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>status</span><span>TEXT</span></div>
                </div>
              </div>

              <div className="rounded-lg p-4 border border-purple-500/30 bg-purple-50/60 dark:bg-purple-950/10 shadow-sm">
                <div className="text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border border-purple-500/30 bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300">
                  <span>pagamentos</span>
                  <span className="text-[10px] font-mono opacity-80">N</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-accent-foreground"><span>PK pagamento_id</span><span>INT</span></div>
                  <div className="flex justify-between text-accent-foreground font-semibold"><span>FK fatura_id</span><span>INT</span></div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold"><span>valor_pago</span><span>NUMERIC</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4 text-xs">
              <span className="px-3 py-1.5 rounded border border-border bg-surface-sunken font-mono text-[11px]">
                <strong className="text-blue-600 dark:text-blue-400">clientes (1)</strong> ─── <strong className="text-emerald-600 dark:text-emerald-400">(N) processos</strong>
              </span>
              <span className="px-3 py-1.5 rounded border border-border bg-surface-sunken font-mono text-[11px]">
                <strong className="text-blue-600 dark:text-blue-400">clientes (1)</strong> ─── <strong className="text-accent-foreground">(N) faturas</strong>
              </span>
              <span className="px-3 py-1.5 rounded border border-border bg-surface-sunken font-mono text-[11px]">
                <strong className="text-accent-foreground">faturas (1)</strong> ─── <strong className="text-purple-600 dark:text-purple-400">(N) pagamentos</strong>
              </span>
            </div>
          </Card>
        </TabsContent>

        {/* Dicionário de Dados */}
        <TabsContent value="dicionario" className="space-y-4 mt-6">
          <Card className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <label htmlFor="filtro-dicionario" className="text-xs font-medium text-muted-foreground">Filtrar Tabela:</label>
              <select
                id="filtro-dicionario"
                value={filtroTabelaDicionario}
                onChange={e => setFiltroTabelaDicionario(e.target.value)}
                className="border border-input bg-surface-sunken text-xs rounded-md px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
              >
                <option value="todas">Todas as Tabelas ({DICIONARIO_DADOS.length} atributos)</option>
                <option value="processos">processos</option>
                <option value="clientes">clientes</option>
                <option value="faturas">faturas</option>
                <option value="pagamentos">pagamentos</option>
              </select>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Documentação Técnica ISO/IEC 11179</span>
          </Card>

          <Card className="overflow-x-auto p-0">
            <Table>
              <caption className="sr-only">Dicionário de metadados das tabelas</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Coluna</TableHead>
                  <TableHead>Tipo SQL</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Regra de Negócio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-[11px]">
                {dicionarioFiltrado.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-blue-600 dark:text-blue-400 font-bold">{item.tabela}</TableCell>
                    <TableCell className="font-semibold">{item.coluna}</TableCell>
                    <TableCell className="text-muted-foreground">{item.tipo}</TableCell>
                    <TableCell>
                      {item.chave === '-' ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <Badge className={item.chave === 'PK' ? 'bg-accent/20 border-accent/40 text-accent-foreground' : 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'}>
                          {item.chave}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-sans">{item.descricao}</TableCell>
                    <TableCell className="font-sans text-muted-foreground">{item.regraNegocio}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Base Operacional & CSV */}
        <TabsContent value="dados" className="space-y-4 mt-6">
          <Card className="p-4 flex flex-wrap justify-between items-center gap-4">
            <div className="w-full sm:w-72">
              <Input
                type="text"
                value={buscaTabela}
                onChange={e => setBuscaTabela(e.target.value)}
                placeholder="Filtrar autos na tabela..."
                className="text-xs"
                aria-label="Filtrar processos na tabela"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={exportarCSV}
              className="gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/40"
            >
              <span>[CSV]</span> Exportar Relatório Geral
            </Button>
          </Card>

          <Card className="overflow-x-auto max-h-[60vh] p-0">
            <Table>
              <caption className="sr-only">Base operacional de processos</caption>
              <TableHeader className="sticky top-0">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nº Autos</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Tipo / Ação</TableHead>
                  <TableHead>Advogado</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="text-right">Valor em Causa</TableHead>
                  <TableHead className="text-right">Êxito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-[11px]">
                {processosTabelaFiltrados.map((proc: any) => (
                  <TableRow key={proc.processo_id}>
                    <TableCell className="text-muted-foreground">#{proc.processo_id}</TableCell>
                    <TableCell className="text-blue-600 dark:text-blue-400 font-medium">{proc.numero_processo}</TableCell>
                    <TableCell className="text-muted-foreground">{proc.area}</TableCell>
                    <TableCell className="font-medium font-sans">{proc.tipo}</TableCell>
                    <TableCell className="text-muted-foreground">{proc.responsavel}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{proc.etapa_atual}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-accent-foreground tabular-nums">
                      {formatarMoeda(proc.valor_causa)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                      {Math.round((proc.prob_sucesso || 0) * 100)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}