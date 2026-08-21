import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { LoginView } from './components/LoginView';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { ClientesView } from './components/ClientesView';
import { DataGovernance } from './components/DataGovernance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-background text-foreground transition-colors duration-200">

      {/* 1. Header Mobile */}
      <header className="md:hidden sticky top-0 z-40 p-3 border-b border-border flex items-center justify-between backdrop-blur-md bg-surface/90">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center text-accent-foreground">
            <IconScale className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs uppercase tracking-wider block">LexData SaaS</span>
            <span className="text-[9px] font-mono text-accent uppercase">{usuario.nome.split(' ')[0]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
            className="h-9 w-9"
          >
            {isDark ? <IconSun className="w-3.5 h-3.5" /> : <IconMoon className="w-3.5 h-3.5" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-[10px] font-mono font-bold text-red-400 border-red-800/60 bg-red-950/40 hover:bg-red-900/40 h-9"
          >
            Sair
          </Button>
        </div>
      </header>

      {/* 2. Sidebar Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 p-5 border-r border-border flex-shrink-0 md:sticky md:top-0 md:h-screen bg-surface">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-accent/30 bg-surface-sunken text-accent-foreground shadow-sm">
              <IconScale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-wider block">
                LexData SaaS
              </span>
              <span className="text-[10px] font-mono text-accent tracking-widest block font-medium">
                Legal Intelligence
              </span>
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="space-y-1.5" aria-label="Navegação principal">
            {navItems.map(item => {
              const Icon = item.icon;
              const ativo = abaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={ativo ? 'page' : undefined}
                  onClick={() => setAbaAtiva(item.id as any)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-accent',
                    ativo
                      ? 'bg-surface-sunken border-accent/60 text-accent-foreground shadow-sm'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-sunken/60'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Perfil & Tema Desktop */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold border border-border bg-surface-sunken text-accent-foreground">
              {usuario.iniciais}
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold truncate block">
                {usuario.nome}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground truncate block">
                {usuario.cargo}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleTheme}
              className="flex-1 gap-1.5 text-xs font-medium h-9"
            >
              {isDark ? <IconSun className="w-3.5 h-3.5 text-accent" /> : <IconMoon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Claro' : 'Escuro'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={logout}
              className="px-3 text-xs font-semibold font-mono h-9 text-red-400 border-red-900/50 bg-red-950/30 hover:bg-red-900/40"
            >
              Sair
            </Button>
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
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border flex justify-around p-2 backdrop-blur-md bg-surface/95"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const ativo = abaAtiva === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={ativo ? 'page' : undefined}
              onClick={() => setAbaAtiva(item.id as any)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-h-11 min-w-11 px-3 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent',
                ativo ? 'text-accent font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
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