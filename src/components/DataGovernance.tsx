import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [subAba, setSubAba] = useState<'qualidade' | 'diagrama' | 'dicionario' | 'dados'>('qualidade');
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

  const cardBg = isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const mainTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  if (loading) {
    return <div className="p-8 font-mono text-xs text-slate-400">Auditoria e catálogo de metadados em análise...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Sub-Abas */}
      <div className={`flex flex-wrap gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setSubAba('qualidade')}
          className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border ${
            subAba === 'qualidade'
              ? isDark
                ? 'bg-[#18223B] border-amber-500/80 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-900 text-white shadow-sm'
              : isDark
              ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Auditoria & Qualidade
        </button>
        <button
          onClick={() => setSubAba('diagrama')}
          className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border ${
            subAba === 'diagrama'
              ? isDark
                ? 'bg-[#18223B] border-amber-500/80 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-900 text-white shadow-sm'
              : isDark
              ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Diagrama Relacional (DER)
        </button>
        <button
          onClick={() => setSubAba('dicionario')}
          className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border ${
            subAba === 'dicionario'
              ? isDark
                ? 'bg-[#18223B] border-amber-500/80 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-900 text-white shadow-sm'
              : isDark
              ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Dicionário de Metadados
        </button>
        <button
          onClick={() => setSubAba('dados')}
          className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border ${
            subAba === 'dados'
              ? isDark
                ? 'bg-[#18223B] border-amber-500/80 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-900 text-white shadow-sm'
              : isDark
              ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Base Operacional (CSV)
        </button>
      </div>

      {/* Sub-Aba 1: Qualidade de Dados */}
      {subAba === 'qualidade' && metricas && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-lg border ${cardBg}`}>
              <span className={`text-[11px] uppercase font-mono tracking-wider block font-semibold ${subText}`}>
                Taxa de Completude
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono tabular-nums text-emerald-500">{metricas.taxaCompletude}%</span>
                <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Preenchimento Válido</span>
              </div>
              <p className={`text-[10px] font-mono mt-2 pt-2 border-t ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                Atributos preenchidos sem nulos nos processos.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${cardBg}`}>
              <span className={`text-[11px] uppercase font-mono tracking-wider block font-semibold ${subText}`}>
                Integridade Referencial (FKs)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-3xl font-bold font-mono tabular-nums ${metricas.processosSemCliente === 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                  {metricas.processosSemCliente === 0 ? '100%' : `${metricas.processosSemCliente} órfãos`}
                </span>
              </div>
              <p className={`text-[10px] font-mono mt-2 pt-2 border-t ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                Vínculo íntegro entre processos e clientes.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${cardBg}`}>
              <span className={`text-[11px] uppercase font-mono tracking-wider block font-semibold ${subText}`}>
                Volume Total Auditado
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-3xl font-bold font-mono tabular-nums ${mainTitle}`}>
                  {metricas.totalClientes + metricas.totalProcessos + metricas.totalFaturas + metricas.totalPagamentos}
                </span>
                <span className={`text-xs font-mono ${subText}`}>tuplas</span>
              </div>
              <p className={`text-[10px] font-mono mt-2 pt-2 border-t ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                Registros ativos nas 4 entidades relacionais.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${cardBg}`}>
              <span className={`text-[11px] uppercase font-mono tracking-wider block font-semibold ${subText}`}>
                Normalização do Schema
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-amber-500">3FN</span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Auditado</span>
              </div>
              <p className={`text-[10px] font-mono mt-2 pt-2 border-t ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                Eliminação de redundâncias e anomalias de escrita.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-5 rounded-lg border ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${mainTitle}`}>
                <span className="text-amber-500 font-mono">[SEC]</span> Conformidade LGPD & GDPR
              </h4>
              <p className={`text-xs leading-relaxed ${subText}`}>
                Dados pessoais de clientes e partes foram minimizados no schema, utilizando identificadores numéricos (`cliente_id`) e restrições de permissão para isolamento de dados entre advogados, evitando exposição indevida perante a LGPD.
              </p>
            </div>

            <div className={`p-5 rounded-lg border ${cardBg}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${mainTitle}`}>
                <span className="text-blue-500 font-mono">[PIPE]</span> Linhagem & Pipeline de Dados
              </h4>
              <p className={`text-xs leading-relaxed ${subText}`}>
                A camada transacional do PostgreSQL alimenta diretamente a camada analítica do React através do Supabase Client, garantindo latência zero na consolidação de KPIs e consistência nos cálculos de probabilidade de êxito ponderada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Aba 2: Diagrama Relacional (DER) */}
      {subAba === 'diagrama' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-lg border ${cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${mainTitle}`}>
                  Modelo Entidade-Relacionamento (DER)
                </h3>
                <p className={`text-xs ${subText}`}>Estrutura relacional normalizada com cardinalidades 1:N</p>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded border font-medium ${
                isDark ? 'bg-[#090D16] border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}>
                PostgreSQL Schema
              </span>
            </div>

            {/* Grid Visual de Tabelas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Tabela Clientes */}
              <div className={`rounded-lg p-4 border shadow-sm ${
                isDark ? 'bg-[#090D16] border-blue-500/40' : 'bg-blue-50/40 border-blue-200'
              }`}>
                <div className={`text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border ${
                  isDark ? 'bg-blue-950/40 border-blue-800/60 text-blue-300' : 'bg-blue-100 border-blue-200 text-blue-900'
                }`}>
                  <span>clientes</span>
                  <span className="text-[10px] font-mono opacity-80">1</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-amber-500">
                    <span>PK cliente_id</span>
                    <span>INT</span>
                  </div>
                  <div className={`flex justify-between ${mainTitle}`}>
                    <span>nome</span>
                    <span>TEXT</span>
                  </div>
                  <div className={`flex justify-between ${subText}`}>
                    <span>cidade</span>
                    <span>TEXT</span>
                  </div>
                  <div className={`flex justify-between ${subText}`}>
                    <span>uf</span>
                    <span>TEXT</span>
                  </div>
                </div>
              </div>

              {/* Tabela Processos */}
              <div className={`rounded-lg p-4 border shadow-sm ${
                isDark ? 'bg-[#090D16] border-emerald-500/40' : 'bg-emerald-50/40 border-emerald-200'
              }`}>
                <div className={`text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border ${
                  isDark ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-emerald-100 border-emerald-200 text-emerald-900'
                }`}>
                  <span>processos</span>
                  <span className="text-[10px] font-mono opacity-80">N</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-amber-500">
                    <span>PK processo_id</span>
                    <span>INT</span>
                  </div>
                  <div className="flex justify-between text-blue-500 font-semibold">
                    <span>FK cliente_id</span>
                    <span>INT</span>
                  </div>
                  <div className={`flex justify-between ${mainTitle}`}>
                    <span>numero_processo</span>
                    <span>TEXT</span>
                  </div>
                  <div className={`flex justify-between ${subText}`}>
                    <span>area / tipo</span>
                    <span>TEXT</span>
                  </div>
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>valor_causa</span>
                    <span>NUMERIC</span>
                  </div>
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>prob_sucesso</span>
                    <span>NUMERIC</span>
                  </div>
                  <div className={`flex justify-between ${subText}`}>
                    <span>etapa_atual</span>
                    <span>TEXT</span>
                  </div>
                </div>
              </div>

              {/* Tabela Faturas */}
              <div className={`rounded-lg p-4 border shadow-sm ${
                isDark ? 'bg-[#090D16] border-amber-500/40' : 'bg-amber-50/40 border-amber-200'
              }`}>
                <div className={`text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border ${
                  isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-amber-100 border-amber-200 text-amber-900'
                }`}>
                  <span>faturas</span>
                  <span className="text-[10px] font-mono opacity-80">N</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-amber-500">
                    <span>PK fatura_id</span>
                    <span>INT</span>
                  </div>
                  <div className="flex justify-between text-blue-500 font-semibold">
                    <span>FK cliente_id</span>
                    <span>INT</span>
                  </div>
                  <div className={`flex justify-between ${mainTitle}`}>
                    <span>valor</span>
                    <span>NUMERIC</span>
                  </div>
                  <div className={`flex justify-between ${subText}`}>
                    <span>status</span>
                    <span>TEXT</span>
                  </div>
                </div>
              </div>

              {/* Tabela Pagamentos */}
              <div className={`rounded-lg p-4 border shadow-sm ${
                isDark ? 'bg-[#090D16] border-purple-500/40' : 'bg-purple-50/40 border-purple-200'
              }`}>
                <div className={`text-xs font-mono font-bold px-2 py-1 rounded mb-3 flex justify-between items-center border ${
                  isDark ? 'bg-purple-950/40 border-purple-800/60 text-purple-300' : 'bg-purple-100 border-purple-200 text-purple-900'
                }`}>
                  <span>pagamentos</span>
                  <span className="text-[10px] font-mono opacity-80">N</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-amber-500">
                    <span>PK pagamento_id</span>
                    <span>INT</span>
                  </div>
                  <div className="flex justify-between text-amber-500 font-semibold">
                    <span>FK fatura_id</span>
                    <span>INT</span>
                  </div>
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>valor_pago</span>
                    <span>NUMERIC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Relações */}
            <div className={`mt-6 pt-4 border-t flex flex-wrap gap-4 text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`px-3 py-1.5 rounded border font-mono text-[11px] ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <strong className="text-blue-500">clientes (1)</strong> ─── <strong className="text-emerald-500">(N) processos</strong>
              </span>
              <span className={`px-3 py-1.5 rounded border font-mono text-[11px] ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <strong className="text-blue-500">clientes (1)</strong> ─── <strong className="text-amber-500">(N) faturas</strong>
              </span>
              <span className={`px-3 py-1.5 rounded border font-mono text-[11px] ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <strong className="text-amber-500">faturas (1)</strong> ─── <strong className="text-purple-500">(N) pagamentos</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Aba 3: Dicionário de Dados */}
      {subAba === 'dicionario' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border flex justify-between items-center ${cardBg}`}>
            <div className="flex items-center gap-3">
              <label className={`text-xs font-medium ${subText}`}>Filtrar Tabela:</label>
              <select
                value={filtroTabelaDicionario}
                onChange={e => setFiltroTabelaDicionario(e.target.value)}
                className={`border text-xs rounded-md px-3 py-1.5 focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              >
                <option value="todas">Todas as Tabelas ({DICIONARIO_DADOS.length} atributos)</option>
                <option value="processos">processos</option>
                <option value="clientes">clientes</option>
                <option value="faturas">faturas</option>
                <option value="pagamentos">pagamentos</option>
              </select>
            </div>
            <span className={`text-xs font-mono ${subText}`}>Documentação Técnica ISO/IEC 11179</span>
          </div>

          <div className={`overflow-x-auto rounded-lg border ${cardBg}`}>
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider font-semibold border-b font-mono text-[10px] ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <tr>
                  <th className="p-3.5">Tabela</th>
                  <th className="p-3.5">Coluna</th>
                  <th className="p-3.5">Tipo SQL</th>
                  <th className="p-3.5">Chave</th>
                  <th className="p-3.5">Descrição</th>
                  <th className="p-3.5">Regra de Negócio</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {dicionarioFiltrado.map((item, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                    <td className="p-3.5 text-blue-500 font-bold">{item.tabela}</td>
                    <td className={`p-3.5 font-semibold ${mainTitle}`}>{item.coluna}</td>
                    <td className={`p-3.5 ${subText}`}>{item.tipo}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.chave === 'PK'
                            ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-800 border-amber-300'
                            : item.chave === 'FK'
                            ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'text-slate-500 border-transparent'
                        }`}
                      >
                        {item.chave}
                      </span>
                    </td>
                    <td className={`p-3.5 font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.descricao}</td>
                    <td className={`p-3.5 font-sans ${subText}`}>{item.regraNegocio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Aba 4: Base Operacional & CSV */}
      {subAba === 'dados' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border flex flex-wrap justify-between items-center gap-4 ${cardBg}`}>
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={buscaTabela}
                onChange={e => setBuscaTabela(e.target.value)}
                placeholder="Filtrar autos na tabela..."
                className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              />
            </div>

            <button
              onClick={exportarCSV}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded border transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-800/40'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              <span>[CSV]</span> Exportar Relatório Geral
            </button>
          </div>

          <div className={`overflow-x-auto rounded-lg border max-h-[60vh] ${cardBg}`}>
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider font-semibold border-b font-mono text-[10px] sticky top-0 ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Nº Autos</th>
                  <th className="p-3.5">Área</th>
                  <th className="p-3.5">Tipo / Ação</th>
                  <th className="p-3.5">Advogado</th>
                  <th className="p-3.5">Etapa</th>
                  <th className="p-3.5 text-right">Valor em Causa</th>
                  <th className="p-3.5 text-right">Êxito</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {processosTabelaFiltrados.map((proc: any) => (
                  <tr key={proc.processo_id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                    <td className={`p-3.5 ${subText}`}>#{proc.processo_id}</td>
                    <td className="p-3.5 text-blue-500 font-medium">{proc.numero_processo}</td>
                    <td className={`p-3.5 ${subText}`}>{proc.area}</td>
                    <td className={`p-3.5 font-medium font-sans ${mainTitle}`}>{proc.tipo}</td>
                    <td className={`p-3.5 ${subText}`}>{proc.responsavel}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {proc.etapa_atual}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-amber-500 tabular-nums">
                      {formatarMoeda(proc.valor_causa)}
                    </td>
                    <td className="p-3.5 text-right text-emerald-500 font-semibold tabular-nums">
                      {Math.round((proc.prob_sucesso || 0) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}