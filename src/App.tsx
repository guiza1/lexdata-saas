import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LoginView } from './components/LoginView';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { ClientesView } from './components/ClientesView';
import { DataGovernance } from './components/DataGovernance';
import { 
  IconScale, 
  IconDashboard, 
  IconKanban, 
  IconUsers, 
  IconBook, 
  IconSun, 
  IconMoon, 
  IconLogOut 
} from './components/Icons';

function LayoutApp() {
  const { usuario, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'kanban' | 'clientes' | 'governanca'>('dashboard');

  if (!usuario) {
    return <LoginView />;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`h-screen w-screen flex overflow-hidden font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#090D16] text-slate-200' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      
      {/* Sidebar Nobre Institucional */}
      <aside className={`w-64 flex-shrink-0 border-r flex flex-col p-4 h-full select-none justify-between transition-colors duration-200 ${
        isDark ? 'bg-[#0E1424] border-slate-800/80' : 'bg-[#FFFFFF] border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className={`px-2 py-3 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
                isDark ? 'bg-[#151D33] border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-amber-400'
              }`}>
                <IconScale className="w-4 h-4" />
              </div>
              <div>
                <h1 className={`font-serif text-sm tracking-wider font-semibold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  LexData SaaS
                </h1>
                <span className="text-[10px] font-mono text-amber-500/90 uppercase tracking-widest block font-medium">
                  Legal Intelligence
                </span>
              </div>
            </div>
          </div>

          {/* Navegação Corporativa */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Painel Executivo', icon: IconDashboard },
              { id: 'kanban', label: 'Pipeline Processual', icon: IconKanban },
              { id: 'clientes', label: 'Carteira & CRM', icon: IconUsers },
              { id: 'governanca', label: 'Auditoria de Dados', icon: IconBook },
            ].map(item => {
              const ativo = abaAtiva === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setAbaAtiva(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium tracking-wide transition-all ${
                    ativo
                      ? isDark
                        ? 'bg-[#18223B] text-amber-300 font-semibold border-l-2 border-amber-400 shadow-sm'
                        : 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${ativo ? (isDark ? 'text-amber-400' : 'text-slate-900') : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé: Perfil + Seletor de Tema + Logout */}
        <div className={`pt-4 border-t space-y-3 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
          {/* Card do Usuário */}
          <div className="flex items-center gap-3 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              {usuario.iniciais}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {usuario.nome}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{usuario.cargo}</p>
            </div>
          </div>

          {/* Botões de Ação do Rodapé */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Alternar Tema Claro/Escuro"
            >
              {isDark ? <IconSun className="w-3.5 h-3.5 text-amber-400" /> : <IconMoon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
              onClick={logout}
              className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600'
              }`}
            >
              <IconLogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Header Superior Fixo */}
        <header className={`px-8 py-4 border-b flex-shrink-0 flex justify-between items-center z-10 transition-colors duration-200 ${
          isDark ? 'bg-[#0E1424]/80 border-slate-800/80 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md shadow-sm'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className={`text-base font-serif font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {abaAtiva === 'dashboard' && (usuario.perfil === 'admin' ? 'Controladoria Executiva & Desempenho' : `Painel de Operações: ${usuario.nome}`)}
                {abaAtiva === 'kanban' && 'Pipeline de Andamentos Judiciais'}
                {abaAtiva === 'clientes' && 'Carteira de Clientes & Relacionamento'}
                {abaAtiva === 'governanca' && 'Catálogo de Governança & Auditoria'}
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${
                usuario.perfil === 'admin'
                  ? isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                  : isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {usuario.perfil === 'admin' ? 'DIRETORIA' : 'OPERACIONAL'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {usuario.perfil === 'admin'
                ? 'Base de dados consolidada com auditoria relacional em tempo real'
                : `Exibindo causas e honorários sob responsabilidade direta de ${usuario.nome}`}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded border ${
              isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PostgreSQL Conectado</span>
            </div>
          </div>
        </header>

        {/* Área de Visualização com Scroll Dedicado */}
        <main className="flex-1 p-8 overflow-y-auto">
          {abaAtiva === 'dashboard' && <Dashboard />}
          {abaAtiva === 'kanban' && <KanbanBoard />}
          {abaAtiva === 'clientes' && <ClientesView />}
          {abaAtiva === 'governanca' && <DataGovernance />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutApp />
      </AuthProvider>
    </ThemeProvider>
  );
}