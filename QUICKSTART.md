# Quick Start Guide - TCG Collection Backend

Este guia irá ajudá-lo a configurar o ambiente de desenvolvimento em 5 minutos.

## Pré-requisitos Instalados

- ✅ Node.js 18+ → [Download](https://nodejs.org/)
- ✅ PostgreSQL 14+ → [Download](https://www.postgresql.org/download/)
- ✅ Editor de código (VS Code recomendado)

## Passo a Passo

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar PostgreSQL

#### Opção A: Usando psql (CLI)

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE tcg_collection;

# Criar usuário (opcional)
CREATE USER tcg_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE tcg_collection TO tcg_user;

# Sair
\q
```

#### Opção B: Usando pgAdmin (GUI)

1. Abra pgAdmin
2. Clique com botão direito em "Databases"
3. Selecione "Create" → "Database"
4. Nome: `tcg_collection`
5. Clique em "Save"

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=3000
NODE_ENV=development

# ⚠️ ALTERE ESTAS CONFIGURAÇÕES
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_collection
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres

# ⚠️ GERE UMA CHAVE SECRETA FORTE
JWT_SECRET=sua_chave_secreta_aqui_use_um_gerador
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:5173
SCRYFALL_API_BASE=https://api.scryfall.com
```

**💡 Dica**: Para gerar um JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4️⃣ Executar Migrações do Banco

```bash
npm run migrate
```

Você deve ver:
```
✓ Database connection established
Running database migrations...
✓ All migrations completed successfully
```

### 5️⃣ Iniciar o Servidor

```bash
npm run dev
```

Você deve ver:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on port 3000
📍 Environment: development
🔗 API: http://localhost:3000
💚 Health: http://localhost:3000/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6️⃣ Testar a API

#### Opção A: Usando cURL

```bash
# Health check
curl http://localhost:3000/health

# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'
```

#### Opção B: Usando REST Client (VS Code)

1. Instale a extensão "REST Client" no VS Code
2. Abra o arquivo `api-tests.http`
3. Clique em "Send Request" acima de cada requisição

#### Opção C: Usando Postman/Insomnia

Importe a collection ou crie requisições manualmente seguindo o README.md

## 🎯 Próximos Passos

### Teste o Fluxo Completo:

1. **Registrar usuário**
   ```http
   POST /api/auth/register
   { "email": "seu@email.com", "password": "senha123" }
   ```

2. **Fazer login e copiar o token**
   ```http
   POST /api/auth/login
   { "email": "seu@email.com", "password": "senha123" }
   ```

3. **Criar uma coleção** (use o token no header)
   ```http
   POST /api/collections
   Authorization: Bearer SEU_TOKEN_AQUI
   { "name": "Minha Primeira Coleção", "tcg_type": "mtg" }
   ```

4. **Buscar uma carta no Scryfall**
   ```http
   GET /api/cards/search?q=lightning+bolt
   Authorization: Bearer SEU_TOKEN_AQUI
   ```

5. **Adicionar carta à coleção** (copie o scryfall_id do resultado anterior)
   ```http
   POST /api/collections/{COLLECTION_ID}/cards
   Authorization: Bearer SEU_TOKEN_AQUI
   {
     "scryfall_id": "f2b9983e-20d4-4d12-9e2c-ec6d9a345787",
     "owner_name": "Meu Nome"
   }
   ```

## ⚠️ Troubleshooting

### Erro: "Database connection failed"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste conexão: `psql -U postgres -d tcg_collection`

### Erro: "Port 3000 already in use"
- Mude a porta no `.env`: `PORT=3001`
- Ou mate o processo: `lsof -ti:3000 | xargs kill -9` (Mac/Linux)

### Erro: "JWT_SECRET is not defined"
- Verifique se o arquivo `.env` existe
- Confirme que `JWT_SECRET` está definido

### Erro de Migração
```bash
# Reset completo do banco (apaga todos os dados)
npm run migrate -- --reset
```

## 🔧 Comandos Úteis

```bash
# Ver logs do PostgreSQL
tail -f /usr/local/var/log/postgres.log  # Mac
sudo tail -f /var/log/postgresql/postgresql-14-main.log  # Linux

# Conectar ao banco
psql -U postgres -d tcg_collection

# Ver todas as tabelas
\dt

# Ver estrutura de uma tabela
\d users

# Limpar terminal
clear  # ou Ctrl+L
```

## 📚 Recursos Adicionais

- [Documentação Completa](./README.md)
- [Scryfall API Docs](https://scryfall.com/docs/api)
- [Express.js Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 🎉 Pronto!

Seu backend está rodando! Agora você pode:
- Desenvolver o frontend React
- Testar todos os endpoints
- Adicionar novas features

**Need help?** Abra uma issue no repositório.
