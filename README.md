<div align="center">

# ⚖️ LexData SaaS
### *Legal Intelligence, Governance & Business Analytics*

<p align="center">
  Plataforma corporativa full-stack de gestão jurídica, governança de dados relacionais e inteligência operacional para escritórios de advocacia.
</p>

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwind-css&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white&style=for-the-badge)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Production%20Ready-000000?logo=vercel&logoColor=white&style=for-the-badge)](https://vercel.com/)

---

### 🌐 [Acessar Demonstração em Produção (Live Demo)](https://lexdata-saas.vercel.app)

</div>

<br/>

> 💡 **Sobre o Projeto:** O **LexData SaaS** centraliza a gestão de autos judiciais, liquidação de faturas e relacionamento com clientes em uma arquitetura relacional em nuvem. O sistema conta com esteira automatizada de CI/CD, auditoria contínua de metadados, controle de acesso baseado em papéis (**RBAC**) e conformidade com diretrizes de privacidade de dados (**LGPD / GDPR**).

---

## 🔑 Credenciais para Avaliação Rápida (RBAC)

O sistema implementa isolamento granular de privilégios entre a governança executiva e os patronos das causas:

| Perfil | E-mail Institucional | Senha | Escopo de Visibilidade & Privilégios |
| :--- | :--- | :--- | :--- |
| **👑 Diretoria (Admin)** | `admin@lexdata.com` | `admin` | **Visão Global (100%):** Acesso a toda a carteira, fluxo de caixa unificado, métricas de honorários e auditoria de dados. |
| **⚖️ Dr. Bruno (Associado)** | `bruno@lexdata.com` | `123` | **Visão Restrita:** Acesso exclusivo aos processos e clientes sob sua responsabilidade técnica direta. |
| **⚖️ Dr. Diego (Associado)** | `diego@lexdata.com` | `123` | **Visão Restrita:** Isolamento operacional conforme esteira de atuação e co-patronato. |


---

## 🎯 Checklist dos Entregáveis

- [x] **1. Base de Dados Centralizada:** PostgreSQL estruturado via Supabase em conformidade com a **3ª Forma Normal (3FN)**.
- [x] **2. Painel Executivo:** Dashboard financeiro com KPIs dinâmicos, comparativo de competência vs. caixa e pipeline Kanban.
- [x] **3. Dicionário de Metadados:** Catálogo técnico nativo no padrão **ISO/IEC 11179** (tipos SQL, chaves PK/FK e regras de negócio).
- [x] **4. Guia de Processo e Governança:** Scanner em tempo real avaliando **Taxa de Completude** e **Integridade Referencial** ($0$ registros órfãos).
- [x] **5. Exportação Operacional:** Extração de dados consolidados em formato `.CSV` com suporte a caracteres UTF-8.

---

## 🏗️ Modelo Entidade-Relacionamento (DER)

A estrutura relacional foi modelada para assegurar integridade estrita e eliminar redundâncias anômalas:

```text
┌──────────────┐         1:N         ┌──────────────┐
│   clientes   │────────────────────<│  processos   │
└──────────────┘                     └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐         1:N         ┌──────────────┐
│   faturas    │────────────────────<│  pagamentos  │
└──────────────┘                     └──────────────┘


📋 Mapeamento das Entidades
- clientes (Entidade Mestre): Centraliza identificadores cadastrais únicos (cliente_id PK), localização regional e segmentação corporativa.

- processos (Fato Operacional): Armazena os autos (processo_id PK, cliente_id FK), vínculo do advogado líder (responsavel), área do direito, valor em litígio e score de probabilidade de êxito (prob_sucesso).

- faturas (Fato Financeiro - Competência): Emissão de honorários e cobranças vinculadas ao cliente pagador (fatura_id PK, cliente_id FK).

- pagamentos (Fato Financeiro - Caixa): Registro de quitações e liquidações parciais ou integrais (pagamento_id PK, fatura_id FK).

---

## 🛡️ Governança, Segurança e Privacidade

```text
               ┌─────────────────────────────────────────┐
               │         Camada de Autenticação          │
               └────────────────────┬────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
       [ Perfil: Diretoria ]               [ Perfil: Advogado ]
       ├── Visão 360° Consolidada          ├── Acesso Restrito aos Autos
       ├── Relatórios Financeiros Totais   ├── Faturas da Própria Carteira
       └── Auditoria do Schema             └── Bloqueio de Conflito de Interesses

1 - Controle de Acesso Baseado em Papéis (RBAC): Garante o princípio do privilégio mínimo (Need-to-Know), impedindo vazamento de estratégias e carteiras de clientes entre associados.

2 - Co-patronato & Contas Compartilhadas: Suporte a múltiplos advogados atuando para o mesmo cliente corporativo em ramos do direito distintos.

3 - Conformidade com LGPD / GDPR: Dados pessoais minimizados na camada de visualização, com chaves anônimas (cliente_id) e isolamento de permissões.

4 - Auditoria de Qualidade em Tempo Real: Verificação automatizada de integridade das chaves estrangeiras e preenchimento de campos obrigatórios.


---

## 💻 Instruções de Instalação e Execução

### 📋 Pré-requisitos
* **Node.js** `v18.0+`
* Gerenciador de pacotes (**npm**, **pnpm** ou **yarn**)
* Instância ativa no **Supabase**

### 1. Clonar o Repositório

git clone [https://github.com/guiza1/lexdata-saas.git](https://github.com/guiza1/lexdata-saas.git)
cd lexdata-saas

2. Instalar as Dependências

npm install

3. Configurar as Variáveis de Ambiente
Crie um arquivo .env na raiz do projeto:
VITE_SUPABASE_URL=[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

4. Iniciar o Ambiente de Desenvolvimento
npm run dev
O painel estará acessível em http://localhost:5173.

5. Compilação para Produção (Type-Check & Build)

npm run build

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Interface reativa orientada a componentes com tipagem estrita. |
| **Bundler & Build** | Vite | Compilação ultrarrápida e Hot Module Replacement (HMR). |
| **Estilização** | Tailwind CSS v4 | Design responsivo mobile-first com suporte nativo a Dark/Light mode. |
| **Banco de Dados** | PostgreSQL (Supabase) | Armazenamento relacional robusto com API PostgREST integrada. |
| **Deploy & CI/CD** | Vercel | Entrega contínua e publicação automática a cada commit na `main`. |
| **Ícones** | SVG Components | Pacote otimizado sem dependências pesadas de runtime. |

---



Desenvolvido sob rigor técnico de engenharia de software, modelagem relacional 3FN e governança de dados corporativos.
