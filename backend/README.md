# TCG Collection Management - Backend API

API RESTful para gerenciamento de coleções de Trading Card Games (TCG), com foco inicial em Magic: The Gathering.

## 🎯 Características

- ✅ Autenticação JWT
- ✅ Gerenciamento de coleções por usuário
- ✅ Integração com Scryfall API
- ✅ Rastreamento de propriedade física de cartas
- ✅ Status de empréstimo de cartas
- ✅ Associação de cartas a decks
- ✅ Arquitetura modular para expansão futura
- ✅ TypeScript com tipagem estrita
- ✅ Validação de dados com express-validator
- ✅ Tratamento global de erros

## 🛠️ Stack Tecnológica

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **Database**: PostgreSQL 14+
- **Autenticação**: JWT (jsonwebtoken)
- **Hash de Senhas**: bcryptjs
- **Validação**: express-validator
- **API Externa**: Scryfall API

## 📋 Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- npm ou yarn

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd tcg-collection-backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_collection
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# JWT
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Configure o banco de dados

Crie o banco de dados PostgreSQL:

```sql
CREATE DATABASE tcg_collection;
```

Execute as migrações:

```bash
npm run migrate
```

Para resetar o banco (cuidado - deleta todos os dados):

```bash
npm run migrate -- --reset
```

### 5. Inicie o servidor

**Desenvolvimento** (com hot-reload):
```bash
npm run dev
```

**Produção**:
```bash
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📚 Documentação da API

### Base URL
```
http://localhost:3000/api
```

### Autenticação

Todas as rotas protegidas requerem um token JWT no header:
```
Authorization: Bearer <token>
```

---

### 🔐 Auth Endpoints

#### Registrar Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta (201)**:
```json
{
  "message": "Usuário registrado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta (200)**:
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com"
  }
}
```

#### Obter Usuário Atual
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 📚 Collections Endpoints

#### Criar Coleção
```http
POST /api/collections
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Minha Coleção de Commander",
  "tcg_type": "mtg"
}
```

**Resposta (201)**:
```json
{
  "message": "Coleção criada com sucesso",
  "collection": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Minha Coleção de Commander",
    "tcg_type": "mtg",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Listar Coleções
```http
GET /api/collections
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "collections": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Minha Coleção de Commander",
      "tcg_type": "mtg",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Obter Coleção
```http
GET /api/collections/:id
Authorization: Bearer <token>
```

#### Atualizar Coleção
```http
PATCH /api/collections/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Novo Nome da Coleção"
}
```

#### Deletar Coleção
```http
DELETE /api/collections/:id
Authorization: Bearer <token>
```

#### Obter Estatísticas da Coleção
```http
GET /api/collections/:id/stats
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "stats": {
    "total_cards": "150",
    "unique_cards": "120",
    "borrowed_cards": "5"
  }
}
```

---

### 🃏 Cards Endpoints

#### Adicionar Carta à Coleção
```http
POST /api/collections/:collectionId/cards
Authorization: Bearer <token>
Content-Type: application/json

{
  "scryfall_id": "f2b9983e-20d4-4d12-9e2c-ec6d9a345787",
  "owner_name": "João Silva",
  "current_deck": "Deck de Vampiros",
  "is_borrowed": false
}
```

**Resposta (201)**:
```json
{
  "message": "Carta adicionada com sucesso",
  "card": {
    "id": "uuid",
    "collection_id": "uuid",
    "scryfall_id": "f2b9983e-20d4-4d12-9e2c-ec6d9a345787",
    "owner_name": "João Silva",
    "current_deck": "Deck de Vampiros",
    "is_borrowed": false,
    "added_at": "2024-01-01T00:00:00.000Z",
    "scryfall_data": {
      "name": "Lightning Bolt",
      "colors": ["R"],
      "prices": { "usd": "0.50" },
      "legalities": { "commander": "legal", "modern": "legal" }
      // ... mais dados do Scryfall
    }
  }
}
```

#### Listar Cartas da Coleção
```http
GET /api/collections/:collectionId/cards?includeScryfall=true
Authorization: Bearer <token>
```

**Query Parameters**:
- `includeScryfall` (opcional): `true` | `false` - Include Scryfall data (default: true)

#### Obter Carta Específica
```http
GET /api/cards/:id?includeScryfall=true
Authorization: Bearer <token>
```

#### Atualizar Carta
```http
PATCH /api/cards/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "owner_name": "Maria Santos",
  "current_deck": "Deck de Eldrazi",
  "is_borrowed": true
}
```

#### Deletar Carta
```http
DELETE /api/cards/:id
Authorization: Bearer <token>
```

#### Buscar Cartas no Scryfall
```http
GET /api/cards/search?q=lightning+bolt&page=1
Authorization: Bearer <token>
```

**Query Parameters**:
- `q` (obrigatório): Search query
- `page` (opcional): Page number (default: 1)

**Resposta (200)**:
```json
{
  "object": "list",
  "total_cards": 150,
  "has_more": true,
  "data": [
    {
      "id": "f2b9983e-20d4-4d12-9e2c-ec6d9a345787",
      "name": "Lightning Bolt",
      "colors": ["R"],
      "prices": { "usd": "0.50" },
      // ... dados completos do Scryfall
    }
  ]
}
```

#### Autocomplete de Cartas
```http
GET /api/cards/autocomplete?q=light
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "suggestions": [
    "Lightning Bolt",
    "Light Up the Stage",
    "Lightmine Field"
  ]
}
```

---

## 🏗️ Estrutura do Projeto

```
src/
├── config/
│   ├── database.ts           # Configuração do PostgreSQL
│   ├── migrations.ts         # Schema do banco de dados
│   └── runMigrations.ts      # Script de migração
├── middleware/
│   ├── auth.ts               # JWT authentication
│   ├── errorHandler.ts       # Error handling global
│   └── validation.ts         # Request validation
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts   # Business logic
│   │   ├── auth.controller.ts # HTTP handlers
│   │   └── auth.routes.ts    # Route definitions
│   ├── collections/
│   │   ├── collections.service.ts
│   │   ├── collections.controller.ts
│   │   └── collections.routes.ts
│   └── cards/
│       ├── scryfall.service.ts  # Scryfall API integration
│       ├── cards.service.ts
│       ├── cards.controller.ts
│       └── cards.routes.ts
├── types/
│   └── index.ts              # TypeScript type definitions
├── app.ts                    # Express app configuration
└── index.ts                  # Application entry point
```

## 🔒 Segurança

- ✅ Senhas com hash bcrypt (salt rounds: 10)
- ✅ JWT com expiração configurável
- ✅ Validação de entrada com express-validator
- ✅ Queries parametrizadas (prevenção de SQL Injection)
- ✅ CORS configurável
- ✅ Rate limiting pronto para implementação
- ✅ Validação de propriedade de recursos

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm start

# Executar migrações
npm run migrate

# Resetar banco de dados
npm run migrate -- --reset
```

## 🌐 Scryfall API

Este projeto integra com a [Scryfall API](https://scryfall.com/docs/api) para dados de cartas de Magic: The Gathering.

**Rate Limit**: 10 requisições por segundo (gerenciado automaticamente pelo Scryfall)

**Endpoints utilizados**:
- `/cards/:id` - Obter carta por ID
- `/cards/search` - Buscar cartas
- `/cards/named` - Obter carta por nome exato
- `/cards/autocomplete` - Sugestões de autocomplete

## 🔄 Fluxo de Dados

1. **Usuário se registra/faz login** → Recebe JWT token
2. **Cria uma coleção** → Associada ao user_id
3. **Busca cartas no Scryfall** → Obtém scryfall_id
4. **Adiciona carta à coleção** → Salva scryfall_id + metadata local
5. **Visualiza coleção** → API enriquece dados com Scryfall API

## 📝 Próximos Passos

- [ ] Implementar rate limiting
- [ ] Adicionar testes unitários e de integração
- [ ] Implementar cache para Scryfall API (Redis)
- [ ] Adicionar logging estruturado (Winston/Pino)
- [ ] Implementar paginação para listagens grandes
- [ ] Adicionar filtros e ordenação nas listagens
- [ ] Suporte para outros TCGs (Pokemon, Yu-Gi-Oh)
- [ ] Endpoints para gestão de decks
- [ ] Export/Import de coleções (CSV, JSON)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido para gerenciamento de coleções TCG com foco em escalabilidade e boas práticas.