import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { IconScale, IconSun, IconMoon } from './Icons';

export function LoginView() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('admin@lexdata.com');
  const [senha, setSenha] = useState('admin');
  const [erro, setErro] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(false);
    const sucesso = login(email, senha);
    if (!sucesso) setErro(true);
  };

  const preencherAcessoRapido = (emailRapido: string, senhaRapida: string) => {
    setEmail(emailRapido);
    setSenha(senhaRapida);
    login(emailRapido, senhaRapida);
  };

  const advogadosCorpo = [
    { nome: 'Dr. Bruno Azevedo', email: 'bruno@lexdata.com', init: 'BA', cargo: 'Advogado Associado' },
    { nome: 'Dr. Diego Castro', email: 'diego@lexdata.com', init: 'DC', cargo: 'Advogado Associado' },
    { nome: 'Dr. Felipe Mendes', email: 'felipe@lexdata.com', init: 'FM', cargo: 'Advogado Sênior' },
    { nome: 'Dra. Ana Nogueira', email: 'ana@lexdata.com', init: 'AN', cargo: 'Advogada Associada' },
    { nome: 'Dra. Carla Farias', email: 'carla@lexdata.com', init: 'CF', cargo: 'Advogada Associada' },
    { nome: 'Dra. Eduarda Pinto', email: 'eduarda@lexdata.com', init: 'EP', cargo: 'Advogada Associada' },
  ];

  return (
    <div className={`min-h-screen w-screen flex flex-col justify-between p-6 sm:p-10 font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#090D16] text-slate-200' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      
      {/* Top Header com Seletor de Tema */}
      <header className="flex justify-between items-center max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
            isDark ? 'bg-[#151D33] border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-amber-400'
          }`}>
            <IconScale className="w-4 h-4" />
          </div>
          <div>
            <span className={`font-serif text-sm tracking-wider font-semibold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
              LexData SaaS
            </span>
            <span className="text-[10px] font-mono text-amber-500/90 uppercase tracking-widest block font-medium">
              Legal Intelligence
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium border transition-colors ${
            isDark
              ? 'bg-[#0E1424] border-slate-800 hover:bg-slate-800 text-slate-300'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
          }`}
          title="Alternar Tema Claro/Escuro"
        >
          {isDark ? <IconSun className="w-3.5 h-3.5 text-amber-400" /> : <IconMoon className="w-3.5 h-3.5 text-slate-600" />}
          <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </header>

      {/* Card Central de Autenticação */}
      <main className="flex items-center justify-center my-6">
        <div className={`max-w-2xl w-full rounded-xl border p-8 sm:p-10 shadow-2xl transition-colors duration-200 ${
          isDark ? 'bg-[#0E1424] border-slate-800/90' : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}>
          
          {/* Cabeçalho do Card */}
          <div className={`border-b pb-6 mb-6 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className={`text-xl font-serif font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Terminal de Acesso Seguro
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Controladoria Jurídica, Pipeline e Governança de Dados Relacionais
                </p>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border font-medium ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400/90' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                RBAC v2.4
              </span>
            </div>
          </div>

          {/* Alerta de Erro */}
          {erro && (
            <div className="p-3.5 mb-5 bg-red-950/40 border border-red-900/60 rounded-md text-red-300 text-xs flex items-center justify-between">
              <span>Credenciais não reconhecidas. Por favor, verifique os dados informados.</span>
              <span className="text-[10px] font-mono text-red-400">[AUTH_401]</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                E-mail Institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@lexdata.com"
                className={`w-full border rounded-md px-3.5 py-2.5 font-mono text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500/80 placeholder:text-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800 placeholder:text-slate-400'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                Chave de Acesso / Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-md px-3.5 py-2.5 font-mono text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#090D16] border-slate-800 text-white focus:border-amber-500/80 placeholder:text-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-800 placeholder:text-slate-400'
                }`}
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 font-semibold rounded-md border transition-all text-xs uppercase tracking-wider shadow-sm ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white hover:border-amber-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white'
              }`}
            >
              Autenticar e Acessar Painel
            </button>
          </form>

          {/* Sessão Rápida para Avaliação da Banca / Apresentação do TCC */}
          <div className={`mt-8 pt-6 border-t space-y-3.5 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
            <div className="flex justify-between items-center text-[10px] uppercase font-mono text-slate-400 tracking-wider">
              <span>Sessão de Demonstração (Atalhos por Perfil)</span>
              <span>PostgreSQL Sync</span>
            </div>

            {/* Acesso Diretoria */}
            <button
              onClick={() => preencherAcessoRapido('admin@lexdata.com', 'admin')}
              className={`w-full p-3.5 rounded-lg border text-left transition-all flex items-center justify-between group ${
                isDark
                  ? 'bg-[#151D33]/60 hover:bg-[#18223B] border-amber-500/30 hover:border-amber-500/60'
                  : 'bg-amber-50/50 hover:bg-amber-100/60 border-amber-200'
              }`}
            >
              <div>
                <div className={`font-serif text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  Conselho Diretivo — Visão Consolidada 360°
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  admin@lexdata.com • Acesso irrestrito a todos os dados e advogados
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-amber-200 border-amber-300 text-amber-900'
              }`}>
                DIRETORIA
              </span>
            </button>

            {/* Grid dos Advogados Cadastrados no Banco */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {advogadosCorpo.map(adv => (
                <button
                  key={adv.email}
                  onClick={() => preencherAcessoRapido(adv.email, '123')}
                  className={`p-2.5 rounded-md border text-left transition-all flex items-center gap-2.5 group ${
                    isDark
                      ? 'bg-[#090D16] hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold border flex-shrink-0 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-white border-slate-300 text-slate-800'
                  }`}>
                    {adv.init}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'}`}>
                      {adv.nome}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 truncate">
                      {adv.cargo}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Corporativo */}
      <footer className="text-center text-[11px] font-mono text-slate-400 max-w-5xl w-full mx-auto">
        LexData Intelligence &copy; {new Date().getFullYear()} — Controladoria de Dados Relacionais & Governança Jurídica
      </footer>
    </div>
  );
}