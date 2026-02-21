# Guia de Instalacao

## Pre-requisitos

Antes de comecar, voce precisa ter instalado na sua maquina:

- **Node.js** (versao 18 ou superior) — [https://nodejs.org](https://nodejs.org)
- **PostgreSQL** (versao 14 ou superior) — [https://www.postgresql.org/download](https://www.postgresql.org/download)
- **Git** — [https://git-scm.com](https://git-scm.com)

## 1. Clonar o repositorio

```bash
git clone https://github.com/alvesdmateus/tcg-collection-manager.git
cd tcg-collection-manager
```

## 2. Configurar o banco de dados

Abra o terminal do PostgreSQL (psql) e crie o banco:

```sql
CREATE DATABASE tcg_collection;
```

> Se voce usa pgAdmin, basta clicar com o botao direito em "Databases" e criar um novo banco com o nome `tcg_collection`.

## 3. Configurar o backend

```bash
cd backend
npm install
```

Crie o arquivo de configuracao copiando o modelo:

```bash
cp .env.example .env
```

> Se o arquivo `.env.example` nao existir, crie um arquivo `.env` na pasta `backend/` com o seguinte conteudo:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_collection
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_DO_POSTGRES

JWT_SECRET=chave_secreta_qualquer_mude_em_producao
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

> **Importante:** Substitua `SUA_SENHA_DO_POSTGRES` pela senha que voce definiu ao instalar o PostgreSQL. Se a porta do seu PostgreSQL for diferente de 5432, altere `DB_PORT` tambem.

Execute as migracoes para criar as tabelas:

```bash
npm run migrate
```

Inicie o servidor backend:

```bash
npm run dev
```

Voce deve ver a mensagem indicando que o servidor esta rodando na porta 3000. Para verificar, acesse no navegador: [http://localhost:3000/health](http://localhost:3000/health)

## 4. Configurar o frontend

Abra **outro terminal** (mantenha o backend rodando) e execute:

```bash
cd frontend
npm install
npm run dev
```

O frontend vai iniciar em [http://localhost:5173](http://localhost:5173). Abra esse endereco no navegador.

## 5. Usar a aplicacao

1. Acesse [http://localhost:5173](http://localhost:5173)
2. Clique em **Register** para criar uma conta
3. Faca login com o email e senha cadastrados
4. Crie uma colecao (Magic, Pokemon ou Yu-Gi-Oh)
5. Adicione cartas pesquisando pelo nome

## Solucao de problemas

### "Connection refused" ao iniciar o backend

O PostgreSQL nao esta rodando. Inicie o servico:

- **Windows:** Abra "Servicos" (services.msc) e inicie o servico "postgresql"
- **Linux:** `sudo systemctl start postgresql`
- **Mac:** `brew services start postgresql`

### "Password authentication failed"

A senha no arquivo `.env` nao corresponde a senha do PostgreSQL. Verifique o campo `DB_PASSWORD`.

### "EADDRINUSE: port 3000 already in use"

A porta 3000 ja esta em uso. Mude `PORT` no `.env` para outra porta (ex: `PORT=3001`) e atualize `CORS_ORIGIN` no frontend se necessario.

### O frontend nao conecta ao backend

Verifique se o backend esta rodando (terminal separado) e se a porta esta correta. O frontend espera o backend em `http://localhost:3000`.
