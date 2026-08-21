import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'advogado';
  advogadoResponsavel?: string;
  iniciais: string;
  cargo: string;
}

export const USUARIOS_MOCK: { [email: string]: { senha: string; usuario: Usuario } } = {
  'admin@lexdata.com': {
    senha: 'admin',
    usuario: {
      id: 'usr_admin',
      nome: 'Diretoria Executiva',
      email: 'admin@lexdata.com',
      perfil: 'admin',
      iniciais: 'DE',
      cargo: 'Conselho Diretivo'
    }
  },
  'bruno@lexdata.com': {
    senha: '123',
    usuario: {
      id: 'usr_bruno',
      nome: 'Dr. Bruno Azevedo',
      email: 'bruno@lexdata.com',
      perfil: 'advogado',
      advogadoResponsavel: 'Dr. Bruno Azevedo',
      iniciais: 'BA',
      cargo: 'Advogado Associado'
    }
  },
  'diego@lexdata.com': {
    senha: '123',
    usuario: {
      id: 'usr_diego',
      nome: 'Dr. Diego Castro',
      email: 'diego@lexdata.com',
      perfil: 'advogado',
      advogadoResponsavel: 'Dr. Diego Castro',
      iniciais: 'DC',
      cargo: 'Advogado Associado'
    }
  },
  'felipe@lexdata.com': {
    senha: '123',
    usuario: {
      id: 'usr_felipe',
      nome: 'Dr. Felipe Mendes',
      email: 'felipe@lexdata.com',
      perfil: 'advogado',
      advogadoResponsavel: 'Dr. Felipe Mendes',
      iniciais: 'FM',
      cargo: 'Advogado Sênior'
    }
  },
  'ana@lexdata.com': {
    senha: '123',
    usuario: {
      id: 'usr_ana',
      nome: 'Dra. Ana Nogueira',
      email: 'ana@lexdata.com',
      perfil: 'advogado',
      advogadoResponsavel: 'Dra. Ana Nogueira',
      iniciais: 'AN',
      cargo: 'Advogada Associada'
    }
  },
  'carla@lexdata.com': {
    senha: '123',
    usuario: {
      id: 'usr_carla',
      nome: 'Dra. Carla Farias',
      email: 'carla@lexdata.com',
      perfil: 'advogado',
      advogadoResponsavel: 'Dra. Carla Farias',
      iniciais: 'CF',
      cargo: 'Advogada Associada'
    }
  },
  'eduarda@lexdata.com': {
    senha: '123',
    usuario: {
      id: 'usr_eduarda',
      nome: 'Dra. Eduarda Pinto',
      email: 'eduarda@lexdata.com',
      perfil: 'advogado',
      advogadoResponsavel: 'Dra. Eduarda Pinto',
      iniciais: 'EP',
      cargo: 'Advogada Associada'
    }
  }
};

interface AuthContextType {
  usuario: Usuario | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem('lexdata_user');
    return salvo ? JSON.parse(salvo) : null;
  });

  const login = (email: string, pass: string): boolean => {
    const conta = USUARIOS_MOCK[email.trim().toLowerCase()];
    if (conta && conta.senha === pass) {
      setUsuario(conta.usuario);
      localStorage.setItem('lexdata_user', JSON.stringify(conta.usuario));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('lexdata_user');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}