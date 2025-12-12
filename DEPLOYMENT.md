# Production Deployment Guide

## 🚀 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)
### Option 2: Platform as a Service (Heroku, Railway, Render)
### Option 3: Containerized (Docker + Kubernetes)

---

## 🔧 Option 1: VPS Deployment (Ubuntu 22.04)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install nginx -y
```

### Step 2: PostgreSQL Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE tcg_collection;
CREATE USER tcg_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE tcg_collection TO tcg_user;
\q

# Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment and set: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Application Setup

```bash
# Create app user
sudo adduser tcgapp
sudo usermod -aG sudo tcgapp

# Switch to app user
su - tcgapp

# Clone repository
git clone <your-repo-url> /home/tcgapp/tcg-backend
cd /home/tcgapp/tcg-backend

# Install dependencies
npm install

# Create production .env
nano .env
```

**.env for production:**
```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_collection
DB_USER=tcg_user
DB_PASSWORD=your_strong_password

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_production_jwt_secret_64_characters_long
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SCRYFALL_API_BASE=https://api.scryfall.com
```

```bash
# Build application
npm run build

# Run migrations
npm run migrate

# Test application
npm start
# Press Ctrl+C to stop

# Start with PM2
pm2 start dist/index.js --name tcg-api
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

### Step 4: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/tcg-api
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tcg-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
```

### Step 6: Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

---

## 🐳 Option 2: Docker Deployment

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: tcg_collection
      POSTGRES_USER: tcg_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tcg_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: tcg_collection
      DB_USER: tcg_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### .dockerignore

```
node_modules
dist
.env
.git
.gitignore
README.md
*.log
```

### Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## ☁️ Option 3: Platform as a Service

### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create tcg-collection-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set ALLOWED_ORIGINS=https://yourfrontend.com

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# View logs
heroku logs --tail
```

### Railway Deployment

1. Push code to GitHub
2. Go to railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Select repository
5. Add PostgreSQL plugin
6. Set environment variables
7. Deploy automatically

### Render Deployment

1. Push code to GitHub
2. Go to render.com
3. Click "New" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add PostgreSQL database
7. Set environment variables
8. Deploy

---

## 🔒 Security Checklist

### Before Going Live

- [ ] **Strong JWT_SECRET**: Use 64+ character random string
- [ ] **Environment Variables**: Never commit .env to git
- [ ] **HTTPS Only**: Force SSL/TLS encryption
- [ ] **Database Password**: Use strong, unique password
- [ ] **CORS Configuration**: Whitelist only your frontend domain
- [ ] **Rate Limiting**: Implement to prevent abuse
- [ ] **Input Validation**: Already implemented ✅
- [ ] **SQL Injection Protection**: Already using parameterized queries ✅
- [ ] **Error Messages**: Don't expose sensitive info
- [ ] **Logging**: Set up proper log management
- [ ] **Backups**: Configure automated database backups
- [ ] **Monitoring**: Set up uptime monitoring
- [ ] **Updates**: Keep dependencies updated

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# View all processes
pm2 list

# View logs
pm2 logs tcg-api

# Monitor resources
pm2 monit

# View metrics
pm2 describe tcg-api
```

### Log Management

**Option 1: PM2 Logs**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

**Option 2: Winston (Add to application)**
```bash
npm install winston
```

**Option 3: External Service**
- LogDNA
- Papertrail
- Datadog
- New Relic

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /home/tcgapp/tcg-backend
          git pull
          npm install
          npm run build
          npm run migrate
          pm2 restart tcg-api
```

---

## 🩺 Health Checks

### Application Health Endpoint

Already implemented at `/health`

### Database Health Check

```bash
# Test database connection
psql -h localhost -U tcg_user -d tcg_collection -c "SELECT 1"
```

### Automated Monitoring

**UptimeRobot** (Free tier available)
1. Add monitor for `https://api.yourdomain.com/health`
2. Set check interval (1-5 minutes)
3. Configure alerts (email, SMS, Slack)

---

## 📈 Performance Optimization

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_cards_collection_scryfall ON cards(collection_id, scryfall_id);
CREATE INDEX idx_collections_user_tcg ON collections(user_id, tcg_type);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM cards WHERE collection_id = 'uuid';
```

### Application

```bash
# Enable compression
npm install compression
```

Add to `app.ts`:
```typescript
import compression from 'compression';
app.use(compression());
```

### Caching

```bash
# Install Redis for caching Scryfall responses
npm install redis
```

---

## 🔄 Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump -U tcg_user tcg_collection > backup_$(date +%Y%m%d).sql

# Automated daily backups (crontab)
0 2 * * * pg_dump -U tcg_user tcg_collection > /backups/db_$(date +\%Y\%m\%d).sql
```

### Application Backups

```bash
# Backup .env and important files
tar -czf backup_$(date +%Y%m%d).tar.gz /home/tcgapp/tcg-backend/.env
```

---

## 🆘 Troubleshooting Production Issues

### Check Logs
```bash
pm2 logs tcg-api --lines 100
```

### Check Process Status
```bash
pm2 status
```

### Restart Application
```bash
pm2 restart tcg-api
```

### Check Database Connections
```bash
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='tcg_collection';"
```

### Check Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Weekly**
- Review logs for errors
- Check disk space
- Monitor response times

**Monthly**
- Update dependencies: `npm outdated` → `npm update`
- Review security advisories: `npm audit`
- Test backup restoration

**Quarterly**
- Security audit
- Performance review
- Database optimization

---

**Ready to deploy?** Follow the checklist for your chosen deployment option!
