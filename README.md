# CouchDB Client

A minimal, developer-focused CouchDB client for managing databases and documents. Available as a web app and standalone desktop application for Windows and Mac.

## Features

- Connect to any CouchDB instance (local or remote)
- Direct connection mode for localhost/tunnels (no proxy needed)
- Multiple database connections via tabs
- Database search and selection with recent history
- Document search (prefix-based, server-side filtering)
- JSON editor with syntax highlighting and collapsible view
- Create, read, update, and delete documents
- Download and copy document JSON
- Persistent storage of connections and recent items (IndexedDB)
- Connection status indicator

## Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express (optional proxy for remote connections)
- **Desktop**: Electron
- **Storage**: IndexedDB (client-side, no external database needed)

**No Python dependencies. No external services required.**

---

## Quick Start (Web App)

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Install Dependencies

```bash
# Frontend
cd frontend
yarn install

# Backend (optional - only needed for non-localhost connections)
cd ../backend
yarn install
```

### 2. Run the App

```bash
# Terminal 1: Start backend (optional)
cd backend
yarn start

# Terminal 2: Start frontend
cd frontend
yarn start
```

Open `http://localhost:3000` in your browser.

### Connection Modes

- **Direct Mode**: For `localhost` or `127.0.0.1` URLs - connects directly from browser to CouchDB
- **Proxy Mode**: For remote URLs - routes through the Node.js backend

---

## Desktop App Build Instructions

### Prerequisites
- Node.js 18+
- yarn
- macOS for `.dmg` builds
- Windows build can be produced from macOS using Wine (supported in this repo), but native Windows CI is recommended for release confidence

### Step 1: Build the Frontend

```bash
cd frontend

# Build the React app
yarn build
```

This creates optimized static files in `frontend/build/`.

### Step 2: Setup Electron

```bash
cd electron
yarn install
```

### Step 3: Build Desktop App

#### macOS Apple Silicon (arm64)
```bash
cd electron
yarn build:mac:arm64
```

Output:
- `electron/dist/CouchDB Client-1.0.0-arm64.dmg`
- `electron/dist/CouchDB Client-1.0.0-arm64-mac.zip`

#### macOS Intel (x64)
```bash
cd electron
yarn build:mac:x64
```

Output:
- `electron/dist/CouchDB Client-1.0.0-x64.dmg`
- `electron/dist/CouchDB Client-1.0.0-x64-mac.zip`

#### Windows x64 (installer + portable)
```bash
cd electron
yarn build:win:x64
```

Output:
- `electron/dist/CouchDB Client Setup 1.0.0.exe`
- `electron/dist/CouchDB Client 1.0.0.exe`

#### Build all release artifacts + checksums
```bash
cd electron
yarn build:release
```

This generates all required artifacts above and writes `electron/dist/CHECKSUMS.txt`.

### Step 4: Run Desktop App (Development)

```bash
# First, start the frontend dev server
cd frontend
yarn start

# In another terminal, run Electron in dev mode
cd electron
NODE_ENV=development yarn electron
```

For the full release runbook and GitHub Release checklist, see `RELEASE.md`.

---

## Project Structure

```
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── ConnectionScreen.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Editor.js
│   │   │   ├── Sidebar.js
│   │   │   ├── TabManager.js
│   │   │   └── TopBar.js
│   │   ├── lib/
│   │   │   └── localDB.js    # IndexedDB wrapper
│   │   └── App.js
│   └── package.json
│
├── backend/                  # Node.js backend (optional proxy)
│   ├── server.js
│   └── package.json
│
├── electron/                 # Electron desktop wrapper
│   ├── main.js
│   ├── scripts/
│   └── package.json
│
└── README.md
```

---

## Configuration

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API URL | (empty for standalone) |

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8001 |

---

## Desktop App Notes

### Standalone Mode
The desktop app works **completely standalone** when connecting to `localhost` CouchDB instances. No backend server is needed.

### Remote Connections
For connecting to remote CouchDB servers (not localhost), you'll need to either:
1. Run the backend proxy alongside the app
2. Ensure your CouchDB server has proper CORS headers configured

### Code Signing
Current release builds are unsigned. macOS Gatekeeper and Windows SmartScreen warnings are expected until signing/notarization is added.

### Adding an App Icon
Place an `icon.png` (512x512 recommended) in the `electron/` directory before building.

---

## Troubleshooting

### "CORS error" when connecting
- For localhost: Make sure you're using `http://localhost:PORT` (not `127.0.0.1`)
- For remote: Run the backend proxy or configure CORS on your CouchDB server

### Desktop app shows blank screen
- Ensure you ran `yarn build` in `frontend`
- Ensure Electron build scripts are used (`yarn build:mac:*` / `yarn build:win:x64`) so `electron/frontend-build` is prepared automatically

### Build fails on Windows
- Install Visual Studio Build Tools
- Run `npm install --global windows-build-tools` (as Administrator)

---

## License

MIT
