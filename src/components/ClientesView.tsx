import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { ModalDetalhesCliente } from './ModalDetalhesCliente';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [clientes, setClientes] = useState<ClienteComMetricas[]>([]);
  const [busca, setBusca] = useState('');
  const [visualizacao, setVisualizacao] = useState<'cards' | 'lista'>('cards');
  const [loading, setLoading] = useState(true);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<ClienteComMetricas | null>(null);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);

  // Form State
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
        supabase.from('processos').select('cliente_id, valor_causa'),
        supabase.from('faturas').select('cliente_id, valor')
      ]);

      const processosPorCliente: Record<number, { count: number; valor: number }> = {};
      dataProcessos?.forEach((p: any) => {
        if (!processosPorCliente[p.cliente_id]) {
          processosPorCliente[p.cliente_id] = { count: 0, valor: 0 };
        }
        processosPorCliente[p.cliente_id].count += 1;
        processosPorCliente[p.cliente_id].valor += Number(p.valor_causa) || 0;
      });

      const faturasPorCliente: Record<number, number> = {};
      dataFaturas?.forEach((f: any) => {
        faturasPorCliente[f.cliente_id] = (faturasPorCliente[f.cliente_id] || 0) + (Number(f.valor) || 0);
      });

      const consolidados: ClienteComMetricas[] = (dataClientes || []).map((c: any) => ({
        cliente_id: c.cliente_id,
        nome: c.nome,
        cidade: c.cidade || 'N/D',
        uf: c.uf || c.UF || c.estado || 'N/D',
        segmento: c.segmento || 'Geral',
        totalProcessos: processosPorCliente[c.cliente_id]?.count || 0,
        valorTotalCarteira: processosPorCliente[c.cliente_id]?.valor || 0,
        totalFaturado: faturasPorCliente[c.cliente_id] || 0
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
  }, []);

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

    const cabecalho = ['ID', 'Cliente/Razao Social', 'Cidade', 'UF', 'Segmento', 'Processos Ativos', 'Volume em Causa (€)', 'Faturamento Total (€)'].join(';');
    
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

  const cardBg = isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const mainTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="flex flex-col gap-4 pb-2 font-sans">
      {/* Modal Ficha 360° */}
      <ModalDetalhesCliente
        clienteId={clienteSelecionadoId}
        onClose={() => setClienteSelecionadoId(null)}
      />

      {/* Modal Criar / Editar Cliente */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`border rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-150 ${cardBg}`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-[#090D16]/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${mainTitle}`}>
                {clienteParaEditar ? `Editar Cadastro #${clienteParaEditar.cliente_id}` : 'Novo Registro Cadastral'}
              </h3>
              <button
                type="button"
                onClick={() => setModalCadastroAberto(false)}
                className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-mono cursor-pointer ${
                  isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700'
                }`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarCliente} className="p-6 space-y-4 text-xs">
              {erroForm && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-300 rounded font-mono">
                  {erroForm}
                </div>
              )}

              <div>
                <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>
                  Razão Social / Nome do Titular *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Investcorp S.A. ou Maria Souza"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: Lisboa"
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                    className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                      isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>UF / Distrito</label>
                  <input
                    type="text"
                    placeholder="LX"
                    maxLength={3}
                    value={uf}
                    onChange={e => setUf(e.target.value)}
                    className={`w-full border rounded px-3 py-2 text-xs uppercase text-center font-mono focus:outline-none ${
                      isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-medium mb-1 uppercase tracking-wider text-[10px] ${subText}`}>Classificação de Segmento</label>
                <select
                  value={segmento}
                  onChange={e => setSegmento(e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
                  }`}
                >
                  <option value="Pessoa Jurídica">Pessoa Jurídica (Corporativo)</option>
                  <option value="Pessoa Física">Pessoa Física (Individual)</option>
                  <option value="Instituição Financeira">Instituição Financeira</option>
                  <option value="Setor Público">Setor Público</option>
                </select>
              </div>

              <div className={`pt-3 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setModalCadastroAberto(false)}
                  className={`px-4 py-2 rounded text-xs font-semibold border cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-amber-500/40 text-xs font-semibold rounded uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'Gravando...' : clienteParaEditar ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barra de Ferramentas Superior */}
      <div className={`p-4 rounded-lg border flex flex-wrap justify-between items-center gap-4 flex-shrink-0 ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por razão social, cidade ou ID..."
              className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                isDark ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500/80' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800'
              }`}
            />
          </div>

          <div className={`p-1 rounded border flex items-center gap-1 ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setVisualizacao('cards')}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                visualizacao === 'cards'
                  ? isDark ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700' : 'bg-white text-slate-900 shadow-sm border border-slate-300'
                  : subText
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao('lista')}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                visualizacao === 'lista'
                  ? isDark ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700' : 'bg-white text-slate-900 shadow-sm border border-slate-300'
                  : subText
              }`}
            >
              Tabela
            </button>
          </div>

          <div className={`flex items-center gap-2 text-xs ${subText}`}>
            <span>Exibir:</span>
            <select
              value={itensPorPagina}
              onChange={e => setItensPorPagina(Number(e.target.value))}
              className={`border rounded px-2 py-1 focus:outline-none ${
                isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value={6}>6 por página</option>
              <option value={9}>9 por página</option>
              <option value={12}>12 por página</option>
              <option value={24}>24 por página</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportarCSV}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-800/40'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title="Descarregar planilha CSV"
          >
            <span>[CSV]</span> Exportar Relatório
          </button>

          <button
            type="button"
            onClick={abrirModalCriacao}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
            }`}
          >
            <span>+</span> Novo Registro
          </button>
        </div>
      </div>

      {/* Grid de Cards ou Tabela */}
      <div className="w-full">
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-slate-400">Carregando carteira consolidada...</div>
        ) : visualizacao === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesPaginados.map(c => (
              <div
                key={c.cliente_id}
                onClick={() => setClienteSelecionadoId(c.cliente_id)}
                className={`p-5 rounded-lg border transition-all flex flex-col justify-between cursor-pointer group ${cardBg} hover:border-slate-600`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        ID #{c.cliente_id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {c.cidade} • {c.uf}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => abrirModalEdicao(c, e)}
                      title="Editar Dados Cadastrais"
                      className={`p-1.5 rounded border text-[10px] font-mono transition-colors cursor-pointer ${
                        isDark ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      EDIT
                    </button>
                  </div>

                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 line-clamp-1 group-hover:text-amber-500 transition-colors ${mainTitle}`}>
                    {c.nome}
                  </h4>
                  <p className={`text-xs font-mono mb-4 ${subText}`}>{c.segmento}</p>
                </div>

                <div className={`grid grid-cols-2 gap-2 pt-3 border-t text-xs ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                  <div>
                    <span className={`block text-[10px] uppercase font-mono ${subText}`}>Processos</span>
                    <span className={`font-bold ${mainTitle}`}>{c.totalProcessos} causas</span>
                  </div>
                  <div>
                    <span className={`block text-[10px] uppercase font-mono ${subText}`}>Volume em Causa</span>
                    <span className="font-mono font-bold text-amber-500 tabular-nums">{formatarMoeda(c.valorTotalCarteira)}</span>
                  </div>
                </div>

                <div className="pt-2 mt-2 text-right">
                  <span className={`text-[10px] font-mono uppercase tracking-wider group-hover:underline ${isDark ? 'text-amber-400' : 'text-slate-800'}`}>
                    Inspecionar Ficha &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`overflow-x-auto rounded-lg border ${cardBg}`}>
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider font-semibold border-b font-mono text-[10px] ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Titular / Razão Social</th>
                  <th className="p-3.5">Comarca / Região</th>
                  <th className="p-3.5">Segmento</th>
                  <th className="p-3.5 text-center">Processos</th>
                  <th className="p-3.5 text-right">Volume em Causa</th>
                  <th className="p-3.5 text-right">Faturamento</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {clientesPaginados.map(c => (
                  <tr
                    key={c.cliente_id}
                    onClick={() => setClienteSelecionadoId(c.cliente_id)}
                    className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                  >
                    <td className="p-3.5 font-mono text-amber-500 font-bold">#{c.cliente_id}</td>
                    <td className={`p-3.5 font-bold uppercase tracking-wider ${mainTitle}`}>{c.nome}</td>
                    <td className={`p-3.5 font-mono ${subText}`}>{c.cidade} • {c.uf}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {c.segmento}
                      </span>
                    </td>
                    <td className={`p-3.5 text-center font-bold font-mono tabular-nums ${mainTitle}`}>
                      {c.totalProcessos}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-500 tabular-nums">
                      {formatarMoeda(c.valorTotalCarteira)}
                    </td>
                    <td className={`p-3.5 text-right font-mono tabular-nums ${mainTitle}`}>
                      {formatarMoeda(c.totalFaturado)}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => abrirModalEdicao(c, e)}
                          title="Editar"
                          className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors cursor-pointer ${
                            isDark ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          EDIT
                        </button>
                        <span className="text-[10px] font-mono text-amber-500 hover:underline uppercase">
                          Ficha &rarr;
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação Inferior */}
      <div className={`p-4 rounded-lg border flex flex-wrap justify-between items-center gap-4 text-xs mt-2 ${cardBg}`}>
        <span className={`font-mono text-[11px] ${subText}`}>
          Exibindo <strong className={mainTitle}>{clientesFiltrados.length > 0 ? indexInicio + 1 : 0}</strong> a{' '}
          <strong className={mainTitle}>{Math.min(indexFim, clientesFiltrados.length)}</strong> de{' '}
          <strong className={mainTitle}>{clientesFiltrados.length}</strong> contas registradas
        </span>

        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
            className={`px-3 py-1.5 rounded border text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            &larr; Anterior
          </button>

          <span className={`px-3 py-1 rounded border text-xs font-bold ${
            isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {paginaAtual} / {totalPaginas}
          </span>

          <button
            type="button"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
            className={`px-3 py-1.5 rounded border text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            Próxima &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}