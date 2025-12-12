# 🚀 Quick Reference Card - TCG Collection API

## 📦 Installation & Setup

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run migrate

# Start development
npm run dev
```

---

## 🔧 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run migrate` | Run database migrations |
| `npm run migrate -- --reset` | Reset database (⚠️ deletes all data) |

---

## 🌐 API Endpoints Quick Reference

### Base URL: `http://localhost:3000/api`

### 🔐 Auth (Public)
```http
POST   /auth/register    # Create account
POST   /auth/login       # Get JWT token
GET    /auth/me          # Get current user (protected)
```

### 📚 Collections (Protected)
```http
POST   /collections           # Create collection
GET    /collections           # List all collections
GET    /collections/:id       # Get specific collection
PATCH  /collections/:id       # Update collection
DELETE /collections/:id       # Delete collection
GET    /collections/:id/stats # Get statistics
```

### 🃏 Cards (Protected)
```http
POST   /collections/:id/cards # Add card
GET    /collections/:id/cards # List cards
GET    /cards/:id             # Get card
PATCH  /cards/:id             # Update card
DELETE /cards/:id             # Delete card
GET    /cards/search?q=name   # Search Scryfall
GET    /cards/autocomplete?q  # Autocomplete
```

---

## 🔑 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_collection
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_64_chars
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 Common cURL Commands

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'
```

### Create Collection (Protected)
```bash
curl -X POST http://localhost:3000/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"My Collection","tcg_type":"mtg"}'
```

### Search Cards
```bash
curl -X GET "http://localhost:3000/api/cards/search?q=lightning+bolt" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗄️ Database Schema

```sql
-- Users
users (id, email, password_hash, created_at)

-- Collections (FK: user_id)
collections (id, user_id, name, tcg_type, created_at)

-- Cards (FK: collection_id)
cards (id, collection_id, scryfall_id, owner_name, 
       current_deck, is_borrowed, added_at)
```

---

## 🔍 Debugging Commands

### Check PostgreSQL Connection
```bash
psql -U postgres -d tcg_collection -c "SELECT 1"
```

### View Database Tables
```bash
psql -U postgres -d tcg_collection
\dt                    # List tables
\d users               # Describe users table
SELECT * FROM users;   # Query users
\q                     # Quit
```

### Check Server Logs
```bash
# View last 50 lines
tail -f -n 50 server.log

# Search for errors
grep "error" server.log
```

---

## 🐛 Common Issues & Solutions

### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill process (Mac/Linux)
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # Mac

# Restart PostgreSQL
sudo systemctl restart postgresql # Linux
brew services restart postgresql  # Mac
```

### Migration Failed
```bash
# Drop all tables and recreate
npm run migrate -- --reset

# Or manually
psql -U postgres -d tcg_collection
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
\q

# Then run migrations
npm run migrate
```

---

## 📊 Testing Workflow

1. **Start Server**
   ```bash
   npm run dev
   ```

2. **Register User**
   ```http
   POST /api/auth/register
   ```

3. **Login & Copy Token**
   ```http
   POST /api/auth/login
   ```

4. **Create Collection**
   ```http
   POST /api/collections
   Authorization: Bearer <TOKEN>
   ```

5. **Search Cards**
   ```http
   GET /api/cards/search?q=lightning
   Authorization: Bearer <TOKEN>
   ```

6. **Add Card**
   ```http
   POST /api/collections/:id/cards
   Authorization: Bearer <TOKEN>
   ```

---

## 🔐 Request Headers

### All Protected Routes Need:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 📱 Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed information (dev only)"
}
```

### Collection Response
```json
{
  "collection": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Collection",
    "tcg_type": "mtg",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Card Response (with Scryfall data)
```json
{
  "card": {
    "id": "uuid",
    "collection_id": "uuid",
    "scryfall_id": "scryfall-uuid",
    "owner_name": "John Doe",
    "current_deck": "Red Deck Wins",
    "is_borrowed": false,
    "added_at": "2024-01-01T00:00:00.000Z",
    "scryfall_data": {
      "name": "Lightning Bolt",
      "colors": ["R"],
      "prices": { "usd": "0.50" },
      "legalities": { "modern": "legal" }
    }
  }
}
```

---

## 🎯 Scryfall Card IDs (Testing)

```
Lightning Bolt:  f2b9983e-20d4-4d12-9e2c-ec6d9a345787
Black Lotus:     bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd
Sol Ring:        269cdbd8-3522-4d40-9eed-1e6fc3f40b40
Counterspell:    1b73a7b6-6851-4c1f-8f8e-3f12f3c0d01c
```

---

## 🔄 Git Workflow

```bash
# Initial setup
git init
git add .
git commit -m "Initial commit: Backend API setup"

# Feature branch
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

---

## 📚 File Locations

| File | Location |
|------|----------|
| **Main Entry** | `src/index.ts` |
| **Express App** | `src/app.ts` |
| **Types** | `src/types/index.ts` |
| **Database Config** | `src/config/database.ts` |
| **Migrations** | `src/config/migrations.ts` |
| **Auth Module** | `src/modules/auth/` |
| **Collections** | `src/modules/collections/` |
| **Cards** | `src/modules/cards/` |
| **Environment** | `.env` (not in git) |

---

## ⚡ Performance Tips

1. **Use includeScryfall=false** when you don't need full card data
   ```http
   GET /collections/:id/cards?includeScryfall=false
   ```

2. **Database indexes** are already optimized for:
   - Foreign key lookups
   - User-specific queries
   - Collection filtering

3. **Connection pooling** is configured for 20 concurrent connections

---

## 🎨 VS Code Extensions (Recommended)

- **REST Client** - Test API directly in VS Code
- **PostgreSQL** - Database management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Thunder Client** - Alternative to REST Client

---

## 📞 Quick Help

**Problem?** Check these files in order:
1. `QUICKSTART.md` - Setup issues
2. `README.md` - API documentation
3. `ARCHITECTURE.md` - How it works
4. Code comments - Implementation details

**Error?** Check:
- Server logs
- PostgreSQL logs
- Environment variables
- Database connection

**Need Examples?** 
- Check `api-tests.http`
- Review controller files
- Read service layer code

---

## 🚀 Production Deployment

```bash
# Build
npm run build

# Set production env
NODE_ENV=production

# Run migrations
npm run migrate

# Start with PM2
pm2 start dist/index.js --name tcg-api
```

See `DEPLOYMENT.md` for complete guide.

---

**Tip**: Keep this file open in a tab while developing! 🎯
