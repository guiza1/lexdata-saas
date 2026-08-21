import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { LoginView } from './components/LoginView';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { ClientesView } from './components/ClientesView';
import { DataGovernance } from './components/DataGovernance';
import {
  IconScale,
  IconBarChart,
  IconColumns,
  IconUsers,
  IconBook,
  IconSun,
  IconMoon,
} from './components/Icons';

export default function App() {
  const { usuario, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'kanban' | 'clientes' | 'governanca'>('dashboard');

  if (!usuario) {
    return <LoginView />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconBarChart },
    { id: 'kanban', label: 'Pipeline', icon: IconColumns },
    { id: 'clientes', label: 'Carteira', icon: IconUsers },
    { id: 'governanca', label: 'Auditoria', icon: IconBook },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#090D16] text-slate-200' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      
      {/* 1. Header Mobile (Apenas em ecrãs pequenos) */}
      <header className={`md:hidden sticky top-0 z-40 p-3 border-b flex items-center justify-between backdrop-blur-md ${
        isDark ? 'bg-[#0E1424]/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <IconScale className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs uppercase tracking-wider block">LexData SaaS</span>
            <span className="text-[9px] font-mono text-amber-500 uppercase">{usuario.nome.split(' ')[0]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded border text-xs cursor-pointer ${
              isDark ? 'border-slate-800 bg-slate-900 text-amber-400' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            {isDark ? <IconSun className="w-3.5 h-3.5" /> : <IconMoon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={logout}
            className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-red-950/40 border border-red-800/60 text-red-400 cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      {/* 2. Sidebar Desktop (Fixa à altura da tela com sticky) */}
      <aside className={`hidden md:flex flex-col justify-between w-64 p-5 border-r flex-shrink-0 md:sticky md:top-0 md:h-screen ${
        isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-sm ${
              isDark ? 'bg-[#151D33] border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-amber-400'
            }`}>
              <IconScale className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-sm font-bold uppercase tracking-wider block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                LexData SaaS
              </span>
              <span className="text-[10px] font-mono text-amber-500 tracking-widest block font-medium">
                Legal Intelligence
              </span>
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const ativo = abaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAbaAtiva(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                    ativo
                      ? isDark
                        ? 'bg-[#18223B] border-amber-500/80 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : isDark
                      ? 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Perfil & Tema Desktop (Travado no rodapé) */}
        <div className={`pt-4 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold border ${
              isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}>
              {usuario.iniciais}
            </span>
            <div className="min-w-0 flex-1">
              <span className={`text-xs font-bold truncate block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {usuario.nome}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate block">
                {usuario.cargo}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {isDark ? <IconSun className="w-3.5 h-3.5 text-amber-400" /> : <IconMoon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isDark ? 'Claro' : 'Escuro'}</span>
            </button>

            <button
              onClick={logout}
              className={`px-3 py-1.5 rounded text-xs font-semibold font-mono border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-red-950/30 border-red-900/50 hover:bg-red-900/50 text-red-300'
                  : 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700'
              }`}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Área de Conteúdo Principal */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto">
          {abaAtiva === 'dashboard' && <Dashboard />}
          {abaAtiva === 'kanban' && <KanbanBoard />}
          {abaAtiva === 'clientes' && <ClientesView />}
          {abaAtiva === 'governanca' && <DataGovernance />}
        </div>
      </main>

      {/* 4. Bottom Navigation Bar Mobile */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex justify-around p-2 backdrop-blur-md ${
        isDark ? 'bg-[#0E1424]/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        {navItems.map(item => {
          const Icon = item.icon;
          const ativo = abaAtiva === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id as any)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md transition-colors cursor-pointer ${
                ativo
                  ? isDark ? 'text-amber-400' : 'text-slate-900 font-bold'
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}