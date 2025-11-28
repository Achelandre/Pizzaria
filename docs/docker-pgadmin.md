# PostgreSQL + pgAdmin com Docker Compose

## 1. Pré-requisitos
- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose v2 (já incluso no Docker Desktop)
- PowerShell ou outro terminal

## 2. Subir os contêineres
```powershell
cd "C:\Users\jprov\OneDrive\Área de Trabalho\Estudos\Ts\Trabalho\Pizzaria"
docker compose up -d
```
- PostgreSQL: porta `5432`
- pgAdmin: http://localhost:5050 (login: `admin@local.test` / senha: `admin123`)

## 3. Confirmar status
```powershell
docker compose ps
docker compose logs -f postgres
```

## 4. Primeiro acesso ao pgAdmin
1. Abra http://localhost:5050 e faça login.
2. Clique com o botão direito em **Servers > Register > Server**.
3. Aba **General**: nome à sua escolha (ex.: `Pizzaria`).
4. Aba **Connection**:
   - Host: `postgres` (ou `host.docker.internal` no Windows)
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`
   - Save password: habilitado
5. Salve.

## 5. Criar banco (primeira vez)
1. Em **Databases**, clique com o botão direito em `postgres > Create > Database...` e crie `pizzaria`.
2. Abra a nova base: **pizzaria > Schemas > public**.
3. Menu **Tools > Query Tool** e execute `sql/init.sql` para criar tabelas/dados iniciais.

> O arquivo `sql/init.sql` já é executado automaticamente ao subir o contêiner pela primeira vez. Rode manualmente apenas se quiser recriar a estrutura.

## 6. Usar o banco no app
- Host: `localhost`
- Porta: `5432`
- Database: `pizzaria`
- Usuário: `postgres`
- Senha: `postgres`

## 7. Parar e remover
```powershell
docker compose stop            # pausa os contêineres
docker compose down            # remove contêineres (mantém dados)
docker compose down -v         # remove contêineres + volume (reseta tudo)
```

## 8. Backup rápido
```powershell
# dump (backup)
docker exec -it pizzaria-postgres pg_dump -U postgres -d pizzaria > backup-pizzaria.sql

# restore
docker exec -i pizzaria-postgres psql -U postgres -d pizzaria < backup-pizzaria.sql
```

Pronto! Database e pgAdmin prontos para uso com o projeto. Ajuste usuário/senha conforme necessidade e comite apenas arquivos seguros (`docker-compose.yml`, `sql/init.sql`, etc.).
