# CouchDB Client - Complete Deployment Guide

## Overview

This is a **standalone CouchDB client** with:
- **Frontend**: React (browser-based UI)
- **Backend**: Node.js Express (API proxy for CouchDB)
- **Desktop**: Electron (Windows & Mac executables)
- **No external dependencies** - fully self-contained

---

## Part 1: Deploy to Your Server

### Prerequisites
- Node.js 16+ installed
- Your server (Linux/Windows)
- CouchDB instance (local or remote)

### Step 1: Prepare Files

Copy these directories to your server:
```
couchdb-client/
├── backend/
├── frontend/
└── electron/ (optional, for desktop builds)
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Configure backend (edit `.env`):
```env
PORT=8001
CORS_ORIGINS=*
```

Start backend:
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev

# With PM2 (recommended for production)
pm2 start server.js --name couchdb-api
pm2 save
pm2 startup
```

Backend will run on: `http://localhost:8001`

### Step 3: Frontend Setup

```bash
cd frontend
npm install  # or yarn install
```

Configure frontend (edit `.env`):
```env
# For local development
REACT_APP_BACKEND_URL=http://localhost:8001

# For production (your server URL)
REACT_APP_BACKEND_URL=https://your-domain.com
```

**Development mode:**
```bash
npm start
```
Opens on: `http://localhost:3000`

**Production build:**
```bash
npm run build
```
Creates optimized build in `frontend/build/`

### Step 4: Serve Frontend (Production)

**Option A: Using serve (simple)**
```bash
npm install -g serve
serve -s build -l 3000
```

**Option B: Using Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option C: Using Apache**

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/frontend/build
    
    <Directory /path/to/frontend/build>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    ProxyPass /api http://localhost:8001/api
    ProxyPassReverse /api http://localhost:8001/api
</VirtualHost>
```

### Step 5: Configure Firewall

```bash
# Allow backend port
sudo ufw allow 8001

# Allow web ports (if using Nginx/Apache)
sudo ufw allow 80
sudo ufw allow 443
```

### Step 6: SSL Certificate (Optional but Recommended)

Using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Part 2: Build Desktop Applications

### Prerequisites
- Node.js 16+
- For Mac: macOS with Xcode Command Line Tools
- For Windows: Windows 10+ OR Mac with Wine

### Step 1: Build Frontend

```bash
cd frontend
npm install
npm run build
```

This creates `frontend/build/` folder with optimized files.

### Step 2: Setup Electron

```bash
cd electron
npm install
```

### Step 3: Build for Mac

**On macOS:**
```bash
cd electron
npm run build:mac
```

**Output:**
- `electron/dist/CouchDB Client-1.0.0.dmg` - Installer
- `electron/dist/CouchDB Client-1.0.0-mac.zip` - Portable app

**Installation:**
1. Double-click `.dmg` file
2. Drag app to Applications folder
3. Done!

### Step 4: Build for Windows

**On Windows:**
```bash
cd electron
npm run build:win
```

**On Mac (cross-compile):**
```bash
# Install Wine first
brew install --cask wine-stable

# Build
cd electron
npm run build:win
```

**Output:**
- `electron/dist/CouchDB Client Setup 1.0.0.exe` - Installer
- `electron/dist/CouchDB Client 1.0.0.exe` - Portable app

**Installation:**
1. Run installer `.exe`
2. Follow setup wizard
3. Done!

### Step 5: Code Signing (Optional)

**For Mac:**
```bash
# Get Apple Developer certificate
# Update electron/package.json:
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name"
    }
  }
}
```

**For Windows:**
```bash
# Get code signing certificate
# Update electron/package.json:
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your-password"
    }
  }
}
```

---

## Part 3: Standalone Desktop App (No Backend Needed)

The desktop app can work **completely offline** by connecting directly to CouchDB.

### How it Works

When you enter `localhost:9004` (or any localhost URL):
- App uses **Direct Mode**
- Connects straight to CouchDB from browser
- No backend server needed
- Perfect for SSH tunnels and local instances

### Use Cases

1. **SSH Tunnel to Remote CouchDB:**
```bash
# On your computer
ssh -L 9004:localhost:5984 user@remote-server

# In CouchDB Client app
URL: http://localhost:9004
```

2. **Local CouchDB:**
```bash
# In CouchDB Client app
URL: http://localhost:5984
```

3. **Docker CouchDB:**
```bash
docker run -p 9004:5984 couchdb

# In CouchDB Client app
URL: http://localhost:9004
```

---

## Part 4: Configuration

### Customization

**App Name & Version** (electron/package.json):
```json
{
  "name": "couchdb-client",
  "productName": "CouchDB Client",
  "version": "1.0.0",
  "description": "Your custom description"
}
```

**App Icon:**
- Replace `electron/icon.png` with your 1024x1024 PNG
- macOS: Also provide `icon.icns`
- Windows: Also provide `icon.ico`

**Backend Port** (backend/.env):
```env
PORT=8001
```

**Frontend URL** (frontend/.env):
```env
REACT_APP_BACKEND_URL=http://your-server:8001
```

---

## Part 5: Troubleshooting

### Backend Won't Start

**Check Node version:**
```bash
node --version  # Should be 16+
```

**Check port availability:**
```bash
lsof -i :8001
# or
netstat -ano | findstr :8001
```

**Check logs:**
```bash
# If using PM2
pm2 logs couchdb-api

# If running directly
npm start
```

### Frontend Build Fails

**Clear cache:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

**Check memory:**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Desktop Build Fails

**Mac: Install Xcode tools:**
```bash
xcode-select --install
```

**Windows: Install build tools:**
```bash
npm install --global windows-build-tools
```

**Clear Electron cache:**
```bash
rm -rf ~/Library/Caches/electron
rm -rf ~/.electron
```

### Connection Issues

**Enable CouchDB CORS:**
```bash
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/origins -d '"*"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/credentials -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer"'
```

---

## Part 6: Distribution

### Hosting Web App

**Free Options:**
- Netlify (frontend)
- Vercel (frontend)
- Railway (backend)
- Heroku (backend)
- GitHub Pages (frontend only)

**Self-Hosted:**
- Your own server (see Part 1)
- Docker container
- Kubernetes cluster

### Distributing Desktop Apps

**Mac:**
1. Upload `.dmg` to website
2. Or: Mac App Store (requires $99/year)
3. Or: GitHub Releases

**Windows:**
1. Upload `.exe` to website
2. Or: Microsoft Store (requires account)
3. Or: GitHub Releases

**Auto-Updates:**
Add electron-updater to check for updates automatically.

---

## Part 7: Docker Deployment (Bonus)

### Create Dockerfile (backend)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8001
CMD ["npm", "start"]
```

### Create Dockerfile (frontend)

```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - PORT=8001
      - CORS_ORIGINS=*
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**Run:**
```bash
docker-compose up -d
```

---

## Summary

### Web Deployment
1. Backend: `npm install && npm start` on port 8001
2. Frontend: `npm install && npm run build` → Serve with Nginx
3. Access: `http://your-domain.com`

### Desktop Build
1. Frontend: `npm run build`
2. Electron: `cd electron && npm run build:mac` or `build:win`
3. Distribute: `.dmg` for Mac, `.exe` for Windows

### Standalone Mode
- No backend needed for localhost connections
- Direct browser → CouchDB connection
- Perfect for SSH tunnels and local development

**All files are self-contained with no external dependencies!** 🎉
