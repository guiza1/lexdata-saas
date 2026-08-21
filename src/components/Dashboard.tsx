import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { IconScale, IconTrendingUp } from './Icons';

interface Processo {
  processo_id: number;
  cliente_id: number;
  area: string;
  tipo: string;
  responsavel: string;
  etapa_atual: string;
  prob_sucesso: number;
  valor_causa: number;
  data_abertura?: string;
}

interface Pagamento {
  pagamento_id: number;
  fatura_id: number;
  valor_pago: number;
  data_pagamento?: string;
}

interface Fatura {
  fatura_id: number;
  cliente_id: number;
  valor: number;
  status: string;
  data_vencimento?: string;
  data_emissao?: string;
  pagamentos?: Pagamento[];
}

const PALETA_NOBRE = ['#2563EB', '#D97706', '#059669', '#7C3AED', '#DC2626', '#475569'];

export function Dashboard() {
  const { usuario } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [processosOriginais, setProcessosOriginais] = useState<Processo[]>([]);
  const [faturasOriginais, setFaturasOriginais] = useState<Fatura[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<string>('2024');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const [
          { data: dataProcessos },
          { data: dataFaturas }
        ] = await Promise.all([
          supabase.from('processos').select('*'),
          supabase.from('faturas').select('*, pagamentos(*)')
        ]);

        if (dataProcessos) setProcessosOriginais(dataProcessos);
        if (dataFaturas) setFaturasOriginais(dataFaturas);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const formatarMoeda = (val?: number | null) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val || 0);

  // Isolamento RBAC
  const processosDoUsuario = processosOriginais.filter(p => {
    if (usuario?.perfil === 'advogado' && usuario.advogadoResponsavel) {
      return (p.responsavel || '').trim().toLowerCase() === usuario.advogadoResponsavel.trim().toLowerCase();
    }
    return true;
  });

  const idsClientesPermitidos = new Set(processosDoUsuario.map(p => p.cliente_id));
  const faturasDoUsuario = faturasOriginais.filter(f => {
    if (usuario?.perfil === 'advogado') {
      return idsClientesPermitidos.has(f.cliente_id);
    }
    return true;
  });

  // Anos disponíveis
  const anosDisponiveis = Array.from(
    new Set(
      [
        ...processosDoUsuario.map(p => p.data_abertura ? new Date(p.data_abertura).getFullYear().toString() : null),
        ...faturasDoUsuario.map(f => f.data_emissao ? new Date(f.data_emissao).getFullYear().toString() : null),
        '2024'
      ].filter(Boolean) as string[]
    )
  ).sort((a, b) => Number(b) - Number(a));

  const filtrarPorAno = (dataStr?: string) => {
    if (anoSelecionado === 'todos' || !dataStr) return true;
    return new Date(dataStr).getFullYear().toString() === anoSelecionado;
  };

  const processosFiltrados = processosDoUsuario.filter(p => filtrarPorAno(p.data_abertura));
  const faturasFiltradas = faturasDoUsuario.filter(f => filtrarPorAno(f.data_emissao || f.data_vencimento));

  // KPIs
  const processosAtivos = processosFiltrados.filter(
    p => (p.etapa_atual || '').toLowerCase() !== 'arquivado'
  );
  const totalProcessosGeral = processosFiltrados.length;

  const pipelinePonderado = processosAtivos.reduce(
    (acc, p) => acc + (Number(p.valor_causa) || 0) * (Number(p.prob_sucesso) || 0),
    0
  );

  const totalFaturado = faturasFiltradas.reduce((acc, f) => acc + (Number(f.valor) || 0), 0);
  
  let totalRecebido = 0;
  faturasFiltradas.forEach(f => {
    if (f.pagamentos && Array.isArray(f.pagamentos)) {
      f.pagamentos.forEach(pg => {
        totalRecebido += Number(pg.valor_pago) || 0;
      });
    }
  });
  const honorariosPendentes = Math.max(0, totalFaturado - totalRecebido);

  // Agrupamento por Área
  const contagemAreas: Record<string, { processos: number; valor: number }> = {};
  processosFiltrados.forEach(p => {
    const area = p.area || 'Outros';
    if (!contagemAreas[area]) {
      contagemAreas[area] = { processos: 0, valor: 0 };
    }
    contagemAreas[area].processos += 1;
    contagemAreas[area].valor += Number(p.valor_causa) || 0;
  });

  const dadosGraficoArea = Object.entries(contagemAreas).map(([name, val]) => ({
    name,
    area: name,
    processos: val.processos,
    valor: val.valor
  }));

  // Série Mensal Financeira: Faturamento Emitido vs. Receita Liquidada
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const dadosMensais = mesesNomes.map((mesNome, index) => {
    const mesNum = index + 1;

    // 1. Total faturado/emitido no mês
    const faturasNoMes = faturasDoUsuario.filter(f => {
      const dataStr = f.data_emissao || f.data_vencimento;
      if (!dataStr) return false;
      const d = new Date(dataStr);
      const bateAno = anoSelecionado === 'todos' || d.getFullYear().toString() === anoSelecionado;
      const bateMes = d.getMonth() + 1 === mesNum;
      return bateAno && bateMes;
    });

    const faturadoMes = faturasNoMes.reduce((acc, f) => acc + (Number(f.valor) || 0), 0);

    // 2. Total recebido/pago no mês
    let recebidoMes = 0;
    faturasDoUsuario.forEach(f => {
      if (f.pagamentos && Array.isArray(f.pagamentos)) {
        f.pagamentos.forEach(pg => {
          const dataPag = pg.data_pagamento || f.data_emissao || f.data_vencimento;
          if (dataPag) {
            const d = new Date(dataPag);
            const bateAno = anoSelecionado === 'todos' || d.getFullYear().toString() === anoSelecionado;
            const bateMes = d.getMonth() + 1 === mesNum;
            if (bateAno && bateMes) {
              recebidoMes += Number(pg.valor_pago) || 0;
            }
          }
        });
      }
    });

    return {
      mes: mesNome,
      faturado: faturadoMes,
      recebido: recebidoMes,
    };
  });

  if (loading) {
    return <div className="p-8 text-slate-400 font-mono text-xs">Carregando métricas consolidadas...</div>;
  }

  const cardBg = isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const mainTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-6">
      
      {/* Barra de Filtro de Exercício */}
      <div className={`p-4 rounded-lg border flex flex-wrap justify-between items-center gap-4 transition-colors duration-200 ${cardBg}`}>
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${mainTitle}`}>
            Recorte de Exercício Financeiro & Processual
          </h3>
          <p className={`text-[11px] ${subText}`}>Métricas sincronizadas com a base relacional</p>
        </div>

        <div className="flex items-center gap-3">
          <label className={`text-xs font-medium ${subText}`}>Exercício Fiscal:</label>
          <select
            value={anoSelecionado}
            onChange={e => setAnoSelecionado(e.target.value)}
            className={`border text-xs font-semibold rounded-md px-3 py-1.5 focus:outline-none transition-colors ${
              isDark
                ? 'bg-[#090D16] border-slate-700 text-white focus:border-amber-500'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-slate-800'
            }`}
          >
            <option value="todos">Todos os Exercícios (Consolidado)</option>
            {anosDisponiveis.map(ano => (
              <option key={ano} value={ano}>
                Ano {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Principal dos 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className={`p-5 rounded-lg border flex flex-col justify-between transition-colors duration-200 ${cardBg}`}>
          <div className="flex justify-between items-start">
            <span className={`text-[11px] uppercase font-mono tracking-wider font-semibold ${subText}`}>Processos Ativos</span>
            <div className={`p-1.5 rounded border ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <IconScale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono tabular-nums ${mainTitle}`}>{processosAtivos.length}</span>
              <span className={`text-xs font-mono ${subText}`}>/ {totalProcessosGeral} totais</span>
            </div>
          </div>
          <p className={`text-[10px] pt-2 border-t font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
            Em andamento no tribunal
          </p>
        </div>

        {/* KPI 2 */}
        <div className={`p-5 rounded-lg border flex flex-col justify-between transition-colors duration-200 ${cardBg}`}>
          <div className="flex justify-between items-start">
            <span className={`text-[11px] uppercase font-mono tracking-wider font-semibold ${subText}`}>Pipeline Ponderado</span>
            <div className={`p-1.5 rounded border ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <IconTrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-mono tabular-nums font-bold text-amber-500">
              {formatarMoeda(pipelinePonderado)}
            </span>
          </div>
          <p className={`text-[10px] pt-2 border-t font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
            Valor Causa × Prob. Êxito
          </p>
        </div>

        {/* KPI 3 */}
        <div className={`p-5 rounded-lg border flex flex-col justify-between transition-colors duration-200 ${cardBg}`}>
          <div className="flex justify-between items-start">
            <span className={`text-[11px] uppercase font-mono tracking-wider font-semibold ${subText}`}>Honorários Liquidados</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              isDark ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              RECEBIDO
            </span>
          </div>
          <div className="my-2">
            <span className={`text-2xl font-mono tabular-nums font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {formatarMoeda(totalRecebido)}
            </span>
          </div>
          <p className={`text-[10px] pt-2 border-t font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
            Faturas liquidadas no período
          </p>
        </div>

        {/* KPI 4 */}
        <div className={`p-5 rounded-lg border flex flex-col justify-between transition-colors duration-200 ${cardBg}`}>
          <div className="flex justify-between items-start">
            <span className={`text-[11px] uppercase font-mono tracking-wider font-semibold ${subText}`}>Saldo Pendente</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              honorariosPendentes > 0
                ? isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              A QUITAR
            </span>
          </div>
          <div className="my-2">
            <span className={`text-2xl font-mono tabular-nums font-bold ${
              honorariosPendentes > 0 ? 'text-amber-500' : (isDark ? 'text-slate-300' : 'text-slate-700')
            }`}>
              {formatarMoeda(honorariosPendentes)}
            </span>
          </div>
          <p className={`text-[10px] pt-2 border-t font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
            Aguardando pagamento
          </p>
        </div>
      </div>

      {/* Gráficos de Estrutura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Barras por Área */}
        <div className={`p-6 rounded-lg border transition-colors duration-200 ${cardBg}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${mainTitle}`}>
              Volume de Demandas por Área Jurídica
            </h3>
            <span className={`text-[11px] font-mono ${subText}`}>Qtd. Processos</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficoArea}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} horizontal={false} />
                <XAxis type="number" stroke={isDark ? '#64748B' : '#94A3B8'} tick={{ fontSize: 11 }} />
                <YAxis dataKey="area" type="category" stroke={isDark ? '#64748B' : '#94A3B8'} tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#090D16' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    borderRadius: '6px',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                  formatter={(val: any) => [`${val || 0} processos`, 'Volume']}
                />
                <Bar dataKey="processos" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Donut Distribuição */}
        <div className={`p-6 rounded-lg border transition-colors duration-200 ${cardBg}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${mainTitle}`}>
              Distribuição Financeira do Valor em Causa
            </h3>
            <span className={`text-[11px] font-mono ${subText}`}>Montante (€)</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGraficoArea}
                  dataKey="valor"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {dadosGraficoArea.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETA_NOBRE[index % PALETA_NOBRE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#090D16' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    borderRadius: '6px',
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                  formatter={(val: any) => [formatarMoeda(val), 'Volume (€)']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico 3: Fluxo Financeiro Mensal (Faturado vs. Recebido) */}
      <div className={`p-6 rounded-lg border transition-colors duration-200 ${cardBg}`}>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${mainTitle}`}>
              Fluxo Financeiro Mensal: Faturamento Emitido vs. Receita Liquidada
            </h3>
            <p className={`text-[11px] ${subText}`}>
              Comparação entre honorários emitidos (Competência) e honorários recebidos (Caixa) ao longo do ano
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Faturado (Emitido)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Recebido (Liquidado)
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 270 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosMensais} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
              <XAxis dataKey="mes" stroke={isDark ? '#64748B' : '#94A3B8'} tick={{ fontSize: 11 }} />
              <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#090D16' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  borderRadius: '6px',
                  color: isDark ? '#FFFFFF' : '#0F172A'
                }}
                formatter={(val: any, name: any) => {
                  const nomeStr = String(name || '');
                  const rotulo = nomeStr.includes('Recebidos') || nomeStr === 'recebido'
                    ? 'Honorários Recebidos (Caixa)'
                    : 'Honorários Faturados (Competência)';
                  return [formatarMoeda(val), rotulo];
                }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="faturado"
                name="Honorários Faturados (€)"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 3.5 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="recebido"
                name="Honorários Recebidos (€)"
                stroke="#10B981"
                strokeWidth={2.5}
                strokeDasharray="3 3"
                dot={{ r: 3.5 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}