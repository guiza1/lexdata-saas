import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { IconScale, IconSun, IconMoon } from './Icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen w-screen flex flex-col justify-between p-6 sm:p-10 font-sans bg-background text-foreground transition-colors duration-200">

      {/* Top Header com Seletor de Tema */}
      <header className="flex justify-between items-center max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-accent/30 bg-surface text-accent-foreground shadow-sm">
            <IconScale className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif text-sm tracking-wider font-semibold uppercase">
              LexData SaaS
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest block font-medium text-accent-foreground/90">
              Legal Intelligence
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          className="gap-2 text-xs"
        >
          {isDark ? <IconSun className="w-3.5 h-3.5 text-accent" /> : <IconMoon className="w-3.5 h-3.5" />}
          <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </Button>
      </header>

      {/* Card Central de Autenticação */}
      <main className="flex items-center justify-center my-6">
        <Card className="max-w-2xl w-full p-8 sm:p-10 shadow-2xl">

          {/* Cabeçalho do Card */}
          <div className="border-b border-border pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-serif font-bold uppercase tracking-wider">
                  Terminal de Acesso Seguro
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Controladoria Jurídica, Pipeline e Governança de Dados Relacionais
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest">
                RBAC v2.4
              </Badge>
            </div>
          </div>

          {/* Alerta de Erro */}
          {erro && (
            <div role="alert" className="p-3.5 mb-5 bg-red-950/40 border border-red-900/60 rounded-md text-red-300 text-xs flex items-center justify-between">
              <span>Credenciais não reconhecidas. Por favor, verifique os dados informados.</span>
              <span className="text-[10px] font-mono text-red-400">[AUTH_401]</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="email" className="block text-muted-foreground font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                E-mail Institucional
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@lexdata.com"
                className="font-mono text-xs h-11"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-muted-foreground font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                Chave de Acesso / Senha
              </label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className="font-mono text-xs h-11"
                required
              />
            </div>

            <Button type="submit" className="w-full h-11 uppercase tracking-wider text-xs font-semibold">
              Autenticar e Acessar Painel
            </Button>
          </form>

          {/* Sessão Rápida para Avaliação da Banca / Apresentação do TCC */}
          <div className="mt-8 pt-6 border-t border-border space-y-3.5">
            <div className="flex justify-between items-center text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
              <span>Sessão de Demonstração (Atalhos por Perfil)</span>
              <span>PostgreSQL Sync</span>
            </div>

            {/* Acesso Diretoria */}
            <button
              type="button"
              onClick={() => preencherAcessoRapido('admin@lexdata.com', 'admin')}
              className="w-full min-h-11 p-3.5 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/60 text-left transition-all flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div>
                <div className="font-serif text-xs font-bold uppercase tracking-wider text-accent-foreground">
                  Conselho Diretivo — Visão Consolidada 360°
                </div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  admin@lexdata.com • Acesso irrestrito a todos os dados e advogados
                </div>
              </div>
              <Badge className="text-[10px] font-mono font-bold bg-accent/20 border-accent/40 text-accent-foreground">
                DIRETORIA
              </Badge>
            </button>

            {/* Grid dos Advogados Cadastrados no Banco */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {advogadosCorpo.map(adv => (
                <button
                  type="button"
                  key={adv.email}
                  onClick={() => preencherAcessoRapido(adv.email, '123')}
                  aria-label={`Entrar como ${adv.nome}`}
                  className="min-h-11 p-2.5 rounded-md border border-border bg-surface-sunken hover:bg-border/40 text-left transition-all flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold border border-border bg-surface text-accent-foreground flex-shrink-0">
                    {adv.init}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium truncate group-hover:text-foreground">
                      {adv.nome}
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground truncate">
                      {adv.cargo}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </main>

      {/* Rodapé Corporativo */}
      <footer className="text-center text-[11px] font-mono text-muted-foreground max-w-5xl w-full mx-auto">
        LexData Intelligence &copy; {new Date().getFullYear()} — Controladoria de Dados Relacionais &amp; Governança Jurídica
      </footer>
    </div>
  );
}