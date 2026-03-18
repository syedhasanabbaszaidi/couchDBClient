# Electron Desktop App Setup

This guide will help you package the CouchDB Client as a desktop application for Windows and Mac.

## Prerequisites

- Node.js 16+ installed
- Yarn package manager
- For Mac builds: macOS with Xcode Command Line Tools
- For Windows builds: Windows or Mac (with Wine for cross-compilation)

## Setup Instructions

### 1. Build the React Frontend

First, build the production version of the React app:

```bash
cd /app/frontend
yarn build
```

This creates an optimized production build in `/app/frontend/build/`.

### 2. Install Electron Dependencies

Navigate to the electron directory and install dependencies:

```bash
cd /app/electron
yarn install
```

### 3. Test Electron App Locally

Before building, you can test the Electron app:

**Development mode** (connects to local React dev server):
```bash
cd /app/electron
yarn electron:dev
```

**Production mode** (uses built React app):
```bash
cd /app/electron
yarn electron
```

### 4. Build Desktop Installers

**For Mac (.dmg and .zip)**:
```bash
cd /app/electron
yarn build:mac
```

**For Windows (.exe installer and portable)**:
```bash
cd /app/electron
yarn build:win
```

**For both platforms**:
```bash
cd /app/electron
yarn build:all
```

### 5. Find Your Installers

Built applications will be in `/app/electron/dist/`:

- **Mac**: `CouchDB Client-1.0.0.dmg` and `CouchDB Client-1.0.0-mac.zip`
- **Windows**: `CouchDB Client Setup 1.0.0.exe` and `CouchDB Client 1.0.0.exe` (portable)

## Important Notes

### Backend Server Requirement

The desktop app still requires the backend server to be running for proxying CouchDB requests. You have two options:

**Option 1: Run Local Backend**
- Keep the FastAPI backend running locally
- The app will connect to `http://localhost:8001/api`

**Option 2: Direct CouchDB Connection**
- Modify the frontend to connect directly to CouchDB (requires CORS enabled on CouchDB)
- Remove backend proxy dependency

### Direct CouchDB Connection (No Backend)

If you want the desktop app to work standalone without the backend:

1. Enable CORS on your CouchDB server:
```bash
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/origins -d '"*"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/credentials -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer"'
```

2. Modify frontend to make direct requests to CouchDB instead of through the backend proxy

### Customization

**App Icon**: Replace `/app/electron/icon.png` with your custom icon (1024x1024 PNG recommended)

**App Name/Version**: Edit `/app/electron/package.json`:
- `name`: Internal identifier
- `productName`: Display name
- `version`: App version number
- `description`: App description
- `author`: Your name/company

**Window Size**: Edit `/app/electron/main.js` `createWindow()` function

## Distribution

After building:

1. Test the installer on a clean machine
2. For Mac: You may need to sign the app with an Apple Developer certificate for distribution
3. For Windows: Consider code signing for better user trust
4. Upload installers to your distribution platform (GitHub Releases, website, etc.)

## Troubleshooting

**Build fails on Mac**:
- Ensure Xcode Command Line Tools are installed: `xcode-select --install`

**Build fails on Windows**:
- Install Visual Studio Build Tools
- Or use a Mac with Wine installed for cross-compilation

**App opens but shows blank screen**:
- Ensure frontend was built: `cd /app/frontend && yarn build`
- Check console for errors in Electron DevTools

**Can't connect to backend**:
- Ensure backend server is running
- Or implement direct CouchDB connection as described above

## Web App Alternative

The application also works perfectly as a web app! Simply:

1. Deploy the backend to a server (Heroku, AWS, etc.)
2. Deploy the frontend to a static host (Netlify, Vercel, etc.)
3. Update `REACT_APP_BACKEND_URL` in frontend `.env` to point to your backend
4. Users can access via browser, or "Install" as PWA on supported browsers

## Progressive Web App (PWA)

To enable PWA installation from the browser, add a `manifest.json` and service worker to the frontend. This allows users to "install" the web app on their desktop/mobile without Electron.
