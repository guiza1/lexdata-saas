import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { IconScale, IconTrendingUp } from './Icons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType, SVGProps, ReactNode } from 'react';

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

function KpiCard({ label, icon: Icon, iconTone = 'default', value, valueTone = 'default', footnote, badge }: {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>> | LucideIcon;
  iconTone?: 'default' | 'accent';
  value: ReactNode;
  valueTone?: 'default' | 'accent' | 'success';
  footnote: string;
  badge?: { text: string; active: boolean };
}) {
  const valueClass = {
    default: 'text-foreground',
    accent: 'text-accent-foreground',
    success: 'text-emerald-500',
  }[valueTone];

  return (
    <Card className="p-5 justify-between">
      <div className="flex justify-between items-start">
        <span className="text-[11px] uppercase font-mono tracking-wider font-semibold text-muted-foreground">{label}</span>
        {badge ? (
          <Badge variant={badge.active ? 'default' : 'secondary'} className="text-[10px] font-mono font-bold">
            {badge.text}
          </Badge>
        ) : (
          <div className={`p-1.5 rounded border ${iconTone === 'accent' ? 'bg-accent/20 border-accent/40 text-accent-foreground' : 'bg-surface-sunken border-border text-muted-foreground'}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="my-2">
        <span className={`text-2xl font-mono tabular-nums font-bold ${valueClass}`}>{value}</span>
      </div>
      <p className="text-[10px] pt-2 border-t border-border font-mono text-muted-foreground">{footnote}</p>
    </Card>
  );
}

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

  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const dadosMensais = mesesNomes.map((mesNome, index) => {
    const mesNum = index + 1;

    const faturasNoMes = faturasDoUsuario.filter(f => {
      const dataStr = f.data_emissao || f.data_vencimento;
      if (!dataStr) return false;
      const d = new Date(dataStr);
      const bateAno = anoSelecionado === 'todos' || d.getFullYear().toString() === anoSelecionado;
      const bateMes = d.getMonth() + 1 === mesNum;
      return bateAno && bateMes;
    });

    const faturadoMes = faturasNoMes.reduce((acc, f) => acc + (Number(f.valor) || 0), 0);

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
    return <div className="p-8 text-muted-foreground font-mono text-xs">Carregando métricas consolidadas...</div>;
  }

  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const axisStroke = isDark ? '#64748B' : '#94A3B8';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0E1424' : '#FFFFFF',
    borderColor: isDark ? '#1E293B' : '#E2E8F0',
    borderRadius: '6px',
    color: isDark ? '#FFFFFF' : '#0F172A'
  };

  return (
    <div className="space-y-6">

      {/* Barra de Filtro de Exercício */}
      <Card className="p-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Recorte de Exercício Financeiro &amp; Processual
          </h3>
          <p className="text-[11px] text-muted-foreground">Métricas sincronizadas com a base relacional</p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="ano-fiscal" className="text-xs font-medium text-muted-foreground">Exercício Fiscal:</label>
          <Select value={anoSelecionado} onValueChange={(value) => value && setAnoSelecionado(value)}>
            <SelectTrigger id="ano-fiscal" className="w-56 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Exercícios (Consolidado)</SelectItem>
              {anosDisponiveis.map(ano => (
                <SelectItem key={ano} value={ano}>Ano {ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Grid Principal dos 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Processos Ativos"
          icon={IconScale}
          value={<span className="flex items-baseline gap-2">{processosAtivos.length}<span className="text-xs font-mono text-muted-foreground">/ {totalProcessosGeral} totais</span></span>}
          footnote="Em andamento no tribunal"
        />
        <KpiCard
          label="Pipeline Ponderado"
          icon={IconTrendingUp}
          iconTone="accent"
          value={formatarMoeda(pipelinePonderado)}
          valueTone="accent"
          footnote="Valor Causa × Prob. Êxito"
        />
        <KpiCard
          label="Honorários Liquidados"
          icon={IconScale}
          badge={{ text: 'RECEBIDO', active: true }}
          value={formatarMoeda(totalRecebido)}
          valueTone="success"
          footnote="Faturas liquidadas no período"
        />
        <KpiCard
          label="Saldo Pendente"
          icon={IconScale}
          badge={{ text: 'A QUITAR', active: honorariosPendentes > 0 }}
          value={formatarMoeda(honorariosPendentes)}
          valueTone={honorariosPendentes > 0 ? 'accent' : 'default'}
          footnote="Aguardando pagamento"
        />
      </div>

      {/* Gráficos de Estrutura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Volume de Demandas por Área Jurídica
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">Qtd. Processos</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficoArea} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                <XAxis type="number" stroke={axisStroke} tick={{ fontSize: 11 }} />
                <YAxis dataKey="area" type="category" stroke={axisStroke} tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val || 0} processos`, 'Volume']} />
                <Bar dataKey="processos" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Distribuição Financeira do Valor em Causa
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">Montante (€)</span>
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
                <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [formatarMoeda(val), 'Volume (€)']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Gráfico 3: Fluxo Financeiro Mensal */}
      <Card className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Fluxo Financeiro Mensal: Faturamento Emitido vs. Receita Liquidada
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Comparação entre honorários emitidos (Competência) e honorários recebidos (Caixa) ao longo do ano
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Faturado (Emitido)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Recebido (Liquidado)
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 270 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosMensais} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="mes" stroke={axisStroke} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: any, name: any) => {
                  const nomeStr = String(name || '');
                  const rotulo = nomeStr.includes('Recebidos') || nomeStr === 'recebido'
                    ? 'Honorários Recebidos (Caixa)'
                    : 'Honorários Faturados (Competência)';
                  return [formatarMoeda(val), rotulo];
                }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="faturado" name="Honorários Faturados (€)" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="recebido" name="Honorários Recebidos (€)" stroke="#10B981" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 3.5 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}