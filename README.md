# ⚖️ LexData SaaS - Legal Intelligence & Business Analytics

![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwind-css&logoColor=white&style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white&style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white&style=for-the-badge)

O **LexData SaaS** é uma plataforma moderna de gestão jurídica e governança de dados criada para modernizar a operação de escritórios de advocacia. A solução centraliza processos, faturamentos e carteira de clientes sob uma arquitetura relacional em nuvem, garantindo segurança, controle de acessos (RBAC) e qualidade de dados em tempo real.

## 🚀 Acesso ao Ambiente de Produção

O projeto conta com CI/CD configurado e está disponível publicamente via Vercel.

🔗 **Live Demo:** [https://lexdata-saas.vercel.app](https://lexdata-saas.vercel.app) *(Nota: ajuste para o seu link real da Vercel se necessário)*

### 🔑 Credenciais de Acesso Rápido (Demonstração)

A plataforma possui controle de acesso baseado em papéis (RBAC). Para avaliar as diferentes visões e privilégios de dados, utilize as contas abaixo:

| Perfil | E-mail | Palavra-passe | Escopo de Visão |
| :--- | :--- | :--- | :--- |
| **Diretoria (Admin)** | `admin@lexdata.com` | `admin` | Visão 360° global, indicadores financeiros totais e acesso à auditoria. |
| **Advogado (Associado)** | `bruno@lexdata.com` | `123` | Visão isolada (apenas seus processos e clientes vinculados). |

---

## 🎯 Entregáveis do Projeto (Checklist Acadêmico)

Este repositório cumpre os requisitos propostos para a entrega final:

- [x] **1. Base Centralizada:** Banco de dados PostgreSQL (Supabase) operando na 3ª Forma Normal (3FN).
- [x] **2. Painel Executivo:** Dashboard com KPIs financeiros, gráficos de performance e pipeline em Kanban.
- [x] **3. Dicionário de Dados:** Documentação técnica padrão ISO/IEC 11179 nativa no sistema (Aba Auditoria).
- [x] **4. Guia de Processo e Governança:** Módulo de auditoria em tempo real avaliando Completude e Integridade Referencial (FKs).
- [x] **5. Exportação de Dados:** Geração de relatórios operacionais consolidados em `.CSV`.

---

## 🏗️ Arquitetura e Modelo de Dados (DER)

A base de dados foi projetada visando integridade referencial estrita e ausência de redundâncias anômalas, respeitando o modelo relacional:

```text
[ clientes ] 1 ─── N [ processos ]
[ clientes ] 1 ─── N [ faturas ]
[ faturas ]  1 ─── N [ pagamentos ]

- Clientes: Entidade mestre (cliente_id PK). Minimiza duplicação de dados cadastrais.

- Processos: Armazena autos e metadados (processo_id PK, cliente_id FK). Define a responsabilidade do advogado e probabilidade de êxito.

- Faturas & Pagamentos: Separação contábil entre a emissão da cobrança e as liquidações parciais/totais em fluxo de caixa.

Governança e Segurança de Dados

1 - Minimização de Privilégios (RBAC): Os advogados associados não possuem acesso ao faturamento global do escritório, nem aos processos/clientes conduzidos exclusivamente por outros colegas. Isso evita conflito de interesses e vazamento de carteira.

2 - Conformidade LGPD/GDPR: O sistema minimiza a exposição de dados pessoais. O cliente_id anonimiza as chaves relacionais, limitando o acesso da camada de visualização apenas ao que é estritamente necessário para o perfil logado.

3 - Auditoria Contínua: A plataforma possui um scanner que avalia o schema e calcula a taxa de completude dos autos judiciais e averigua vínculos órfãos de relacionamentos.


Como Rodar o Projeto Localmente

Pré-requisitos
- Node.js v18+

- Gestor de pacotes (npm, pnpm ou yarn)

- Conta no Supabase (para as chaves de API)

Clonar o repositório

git clone [https://github.com/seu-usuario/lexdata-saas.git](https://github.com/seu-usuario/lexdata-saas.git)
cd lexdata-saas

Instalar dependências

npm install

Variáveis de Ambiente
Crie um ficheiro .env na raiz do projeto e adicione as suas credenciais do Supabase:

VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase_aqui

Executar o servidor de desenvolvimento

npm run dev
A aplicação estará disponível em http://localhost:5173


Stack Tecnológica
- Frontend: React 19, TypeScript, Vite

- Estilização: Tailwind CSS v4

- Backend as a Service (BaaS): Supabase (PostgreSQL, Auth, PostgREST API)

- Deploy e CI/CD: Vercel

- Ícones: SVG customizados (Lucide-inspired)

- Desenvolvido com rigor técnico e foco em governança de dados corporativos. 📊