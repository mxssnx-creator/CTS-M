# CTS v3 Deployment Configuration

## Quick Start Deployment

### 1. Vercel (Recommended)
```bash
# Clone and deploy
vercel --prod

# Or connect existing repo
vercel link
vercel env add NEXT_PUBLIC_APP_URL
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add JWT_SECRET
vercel deploy --prod
```

### 2. Docker
```bash
# Build and run
docker build -t cts-v3 .
docker run -p 3001:3001 --env-file .env.local cts-v3

# Or with Docker Compose
docker-compose up --build
```

## Environment Variables Required

### Required Variables
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-deployment-url.com

# Redis Database (Required for production)
KV_REST_API_URL=https://your-redis-endpoint.upstash.io
KV_REST_API_TOKEN=your-redis-token

# Authentication (Required)
JWT_SECRET=your-very-secure-random-jwt-secret-at-least-32-characters
```

### Optional Variables
```bash
# Exchange API Keys (for live trading)
BYBIT_API_KEY=your-bybit-api-key
BYBIT_API_SECRET=your-bybit-api-secret
BINGX_API_KEY=your-bingx-api-key
BINGX_API_SECRET=your-bingx-api-secret
OKX_API_KEY=your-okx-api-key
OKX_API_SECRET=your-okx-api-secret
OKX_API_PASSPHRASE=your-okx-passphrase
```

## Deployment Platforms

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel --prod
   # Or connect via web interface
   ```

2. **Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_APP_URL
   vercel env add KV_REST_API_URL
   vercel env add KV_REST_API_TOKEN
   vercel env add JWT_SECRET
   ```

3. **Redis Setup**
   - Go to Vercel Storage → Create KV Database
   - Copy environment variables automatically set by Vercel

4. **Deploy**
   ```bash
   vercel deploy --prod
   ```

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  cts-app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_APP_URL=http://localhost:3001
      - KV_REST_API_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret-here
    depends_on:
      - redis
    volumes:
      - ./data:/app/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Railway Deployment

1. **Connect Repository**
   - Import your GitHub repository
   - Railway auto-detects Next.js

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_APP_URL=${{ RAILWAY_STATIC_URL }}
   KV_REST_API_URL=redis://your-redis-url
   JWT_SECRET=your-jwt-secret
   ```

3. **Database**
   - Add Redis database service
   - Connect to application

### Render Deployment

1. **Create Web Service**
   ```bash
   # Build Command
   npm run build

   # Start Command
   npm start
   ```

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
   KV_REST_API_URL=redis://your-redis-url
   JWT_SECRET=your-jwt-secret
   ```

## Deployment Scripts

### deploy.sh - Automated Deployment
```bash
#!/bin/bash
set -e

echo "🚀 Deploying CTS v3..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found. Copy .env.example to .env.local and configure${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run checks
echo -e "${YELLOW}🔍 Running type check...${NC}"
npm run typecheck

echo -e "${YELLOW}🧹 Running linter...${NC}"
npm run lint

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Run health check if in development
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}🏥 Running health check...${NC}"
    timeout 30 npm start &
    SERVER_PID=$!
    sleep 5

    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi

    kill $SERVER_PID 2>/dev/null || true
fi

echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo -e "${GREEN}🌐 Ready for production deployment${NC}"
```

### vercel-deploy.sh - Vercel Specific
```bash
#!/bin/bash
set -e

echo "🚀 Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Login to Vercel (if not already logged in)
vercel login

# Link project (if not already linked)
if [ ! -f .vercel/project.json ]; then
    vercel link
fi

# Add environment variables
echo "Setting up environment variables..."
vercel env add NEXT_PUBLIC_APP_URL
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add JWT_SECRET

# Deploy
echo "Deploying to production..."
vercel --prod

echo "✅ Deployment to Vercel complete!"
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Redis database connected and accessible
- [ ] JWT secret set (32+ characters)
- [ ] Exchange API keys configured (for live trading)
- [ ] Build completes without errors
- [ ] Application starts successfully
- [ ] Health endpoints respond
- [ ] Database connections work
- [ ] API endpoints functional

## Monitoring & Maintenance

### Health Checks
```bash
# Application health
curl https://your-app.com/health

# Database health
curl https://your-app.com/api/health/database

# System verification
curl https://your-app.com/api/system/verify-complete
```

### Logs
- **Vercel**: Check Vercel dashboard logs
- **Docker**: `docker logs cts-app`
- **Railway/Render**: Check platform dashboard

### Backups
```bash
# Export settings
curl https://your-app.com/api/settings/export

# Database backup (if using managed Redis)
# Configure automatic backups in Redis provider
```

## Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Runtime Issues
```bash
# Check environment variables
echo $NEXT_PUBLIC_APP_URL
echo $KV_REST_API_URL

# Test Redis connection
curl https://your-app.com/api/health/database

# Check application logs
# (Platform-specific)
```

### Database Issues
```bash
# Reset database (CAUTION: destroys all data)
curl -X POST https://your-app.com/api/install/database/reset

# Reinitialize
curl -X POST https://your-app.com/api/install/initialize
```

## Security Considerations

- Use HTTPS in production
- Set secure JWT secrets
- Configure CORS properly
- Enable rate limiting
- Monitor for security vulnerabilities
- Regular dependency updates

#### Admin Access
```bash
ADMIN_SECRET=secure-admin-password-for-system-operations
```

## Deployment Steps

### Vercel Deployment

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Vercel will automatically detect Next.js

2. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - For `NEXT_PUBLIC_APP_URL`, use your Vercel domain

3. **Redis Setup (Vercel KV)**
   - In Vercel dashboard, go to Storage → Create Database → KV
   - Copy the environment variables provided by Vercel
   - Add them to your project environment variables

4. **Deploy**
   - Push to main branch or trigger manual deployment
   - Vercel will build and deploy automatically

### Troubleshooting Deployment Issues

#### Build Fails
- Check that all dependencies are installed: `bun install`
- Verify TypeScript compilation: `bun run typecheck`
- Check for linting errors: `bun run lint`

#### Runtime Errors
- **Missing NEXT_PUBLIC_APP_URL**: Set to your deployment domain
- **Redis Connection Failed**: Ensure Redis environment variables are correctly set
- **API Route Errors**: Check that environment variables are accessible in server-side code

#### Common Issues
- Environment variables are case-sensitive
- Some platforms require variable names to be uppercase
- Restart deployment after adding new environment variables

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in the required values
3. Run `bun run dev`

## Production Checklist

- [ ] NEXT_PUBLIC_APP_URL set correctly
- [ ] Redis database configured and accessible
- [ ] JWT_SECRET set to secure random value
- [ ] Exchange API keys added (if using live trading)
- [ ] Build completes successfully
- [ ] Application loads without runtime errors