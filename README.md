# Pizzaria Sabor & Arte

Sistema completo para gestão de clientes, cardápio e pedidos de uma pizzaria artesanal. O projeto reúne uma API Express integrada ao PostgreSQL e um painel web em TypeScript que gera comprovantes fiscais em PDF com a identidade visual da marca.

## Principais recursos
- CRUD completo de clientes, produtos e pedidos com validações no backend.
- Base PostgreSQL provisionada via Docker Compose com seed automático.
- Painel web responsivo em TypeScript/Vanilla JS servindo relatórios e histórico por cliente.
- Geração de comprovante fiscal em PDF via jsPDF com layout idêntico ao modelo fornecido.
- Relatórios agregados por dia e mês e timeline de compras por cliente.
- Ferramentas de manutenção rápida (resetar dados locais, limpar cache do navegador).

## Arquitetura
```
pizzaria/
├─ docker-compose.yml        # Orquestra PostgreSQL e pgAdmin
├─ sql/init.sql              # Schema e dados de exemplo
├─ server/                   # API REST Express + pg
│  └─ index.js
├─ public/                   # Aplicação front-end e assets
│  ├─ index.html             # Layout, fontes e bundle jsPDF
│  ├─ styles.css             # Design com tema da pizzaria
│  └─ main.ts                # Lógica da UI (compilada para main.js)
├─ docs/                     # Materiais auxiliares (wireframes, etc.)
├─ .env                      # Variáveis de ambiente locais
├─ tsconfig*.json            # Configuração TypeScript
└─ package.json              # Dependências e scripts npm
```

## Stack técnica
- **Backend:** Node.js 20+, Express 5, pg, cors, dotenv.
- **Banco:** PostgreSQL 16 (Docker), pgAdmin 4 para inspeção visual.
- **Frontend:** TypeScript, DOM API, http-server para desenvolvimento, jsPDF para PDF.
- **Infra:** Docker Compose, scripts npm para build/serve.

## Pré-requisitos
- Node.js 20 ou superior e npm.
- Docker Desktop (ou engine compatível) para subir PostgreSQL/pgAdmin.
- PowerShell, CMD ou outro shell compatível com os scripts fornecidos.

## Configuração rápida
1. Instale as dependências Node:
   ```bash
   npm install
   ```
2. Suba o banco e o pgAdmin (opcional, mas recomendado):
   ```bash
   docker compose up -d
   ```
   O script `sql/init.sql` cria as tabelas `clientes`, `produtos`, `pedidos`, `itens_pedido` e popula dados de exemplo.
3. Configure as variáveis `.env` (copie do exemplo abaixo se necessário).
4. Inicie a API Express:
   ```bash
   npm run api
   ```
   A API expõe os endpoints em `http://localhost:3001/api`.
5. Em outro terminal, compile e sirva o front-end:
   ```bash
   npm run web:build   # compila main.ts -> main.js
   npm run web         # http-server public/ (porta padrão 8080)
   ```
6. Acesse `http://localhost:8080` para usar o painel. Gere PDFs a partir da lista de pedidos.

## Variáveis de ambiente
O arquivo `.env` na raiz é carregado pelo backend. Campos esperados:

| Variável      | Padrão             | Descrição                                   |
|---------------|--------------------|---------------------------------------------|
| `PORT`        | `3001`             | Porta da API Express.                       |
| `PGHOST`      | `127.0.0.1`        | Host do PostgreSQL.                         |
| `PGPORT`      | `5432`             | Porta do PostgreSQL.                        |
| `PGDATABASE`  | `pizzaria`         | Nome do banco.                              |
| `PGUSER`      | `postgres`         | Usuário do banco.                           |
| `PGPASSWORD`  | `postgres`         | Senha do banco.                             |
| `PGSSLMODE`   | *(vazio)*          | Use `require` para habilitar SSL em nuvem.  |

Para usar outra instância de banco (local ou gerenciada), ajuste os campos acima e reinicie a API.

## Endpoints principais
| Método | Caminho                | Descrição                                          |
|--------|------------------------|----------------------------------------------------|
| GET    | `/api/health`          | Verifica conectividade com o banco.                |
| GET    | `/api/clientes`        | Lista clientes ordenados por nome.                 |
| POST   | `/api/clientes`        | Cria cliente (`nome` obrigatório).                 |
| PUT    | `/api/clientes/:id`    | Atualiza cliente existente.                        |
| DELETE | `/api/clientes/:id`    | Exclui cliente (cascade remove pedidos).           |
| GET    | `/api/produtos`        | Lista produtos com status ativo/inativo.           |
| POST   | `/api/produtos`        | Cria produto (valida preço numérico).              |
| PUT    | `/api/produtos/:id`    | Atualiza produto.                                  |
| DELETE | `/api/produtos/:id`    | Remove produto.                                    |
| GET    | `/api/pedidos`         | Lista pedidos com itens agregados em JSON.         |
| POST   | `/api/pedidos`         | Cria pedido, gera `codigo_fiscal` e itens filhos.  |
| DELETE | `/api/pedidos/:id`     | Apaga pedido e itens associados.                   |

> Todos os endpoints retornam JSON. Em errors de validação, a resposta inclui `mensagem` e status HTTP adequado.

## Fluxo do painel web
1. **Clientes e produtos**: formulários criam/atualizam registros via API. A lista inclui ações de edição/exclusão.
2. **Pedidos**: usuário monta itens, escolhe pagamento e confirma. A UI calcula totais e exibe observações (p.ex. desconto automático acima de R$200).
3. **Comprovante fiscal**: botão "Gerar PDF" usa jsPDF para renderizar um comprovante estilizado (mesmas cores e layout do mockup fornecido).
4. **Relatórios**: realizando `GET /api/pedidos`, a camada front gera agregações por dia/mês e um timeline por cliente usando dados já carregados.
5. **Configurações locais**: botões resetam dados armazenados em `localStorage` para facilitar demonstrações.

## Desenvolvimento
- Execute `npm run web:build` sempre que alterar `public/main.ts` manualmente.
- O front é servido por `http-server`; para hot reload considere usar uma toolchain como Vite em evoluções futuras.
- Logs da API aparecem no terminal; habilite `PGSSLMODE=require` ao conectar em bancos remotos com SSL.
- O diretório `docker/postgres/data` é persistente. Para reset total, pare os contêineres e remova essa pasta.

## Próximos passos sugeridos
- Implementar testes automatizados (API e UI).
- Adicionar autenticação para proteger a API em produção.
- Publicar imagens Docker dedicadas para a API e o front-end.

## Licença
Distribuído sob a licença ISC (veja `package.json`).
