# CouchDB Client

A minimal, developer-focused CouchDB client for managing databases and documents. Available as a web app and standalone desktop application for Windows and Mac.
Built by Hasan Abbas.

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
- Desktop download prompts inside the web app
- Gated desktop downloads with name and email capture
- Minimal product analytics for web usage and download interest

## Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express (optional proxy for remote connections)
- **Desktop**: Electron
- **Storage**: IndexedDB (client-side, no external database needed)
- **Product Data**: Postgres for leads and usage records
- **Analytics**: Self-hosted PostHog
- **Binary Hosting**: GitHub Releases

Core CouchDB browsing works without external services. For the hosted web-product rollout, Postgres, PostHog, and GitHub Releases are used.

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

# Backend (recommended for remote connections, downloads, and analytics)
cd ../backend
yarn install
```

### 2. Run the App

```bash
# Terminal 1: Start backend
cd backend
yarn start

# Terminal 2: Start frontend
cd frontend
yarn start
```

Open `http://localhost:3000` in your browser.

### One-command local web testing

If you want to test the web app locally before rebuilding desktop binaries:

```bash
cd /Users/hasan/development/client
yarn install
yarn dev:web
```

This starts:

- frontend at `http://localhost:3000`
- backend at `http://localhost:8001`

The repo now includes a development-only frontend config in [frontend/.env.development](/Users/hasan/development/client/frontend/.env.development), so the browser app automatically talks to the local backend during `yarn start`.

### Connection Modes

- **Direct Mode**: For `localhost` or `127.0.0.1` URLs - connects directly from browser to CouchDB
- **Proxy Mode**: For remote URLs - routes through the Node.js backend

For the hosted web product, the backend also powers:
- gated DMG/EXE downloads
- GitHub Release asset redirects
- Postgres-backed lead capture
- minimal analytics forwarding to PostHog

---

## Desktop App Build Instructions

### Prerequisites
- Node.js 18+
- yarn
- macOS for `.dmg` builds
- Windows build can be produced from macOS using Wine (supported in this repo), but native Windows CI is recommended for release confidence

### Local macOS installer build

Use this path when you want a local Mac installer that does not depend on Emergent, hosted analytics, Postgres, or GitHub release redirects at runtime:

```bash
cd /Users/hasan/development/client
yarn build:mac:local:arm64
```

For Intel Macs:

```bash
yarn build:mac:local:x64
```

The local build script does not install packages from the internet. It expects the existing `node_modules` folders to be present, builds the frontend with `REACT_APP_BACKEND_URL` empty, bundles a local Electron CouchDB proxy, and writes Mac-only checksums.

Output:

- `electron/dist/CouchDB Client-1.0.0-arm64.dmg`
- `electron/dist/CouchDB Client-1.0.0-arm64-mac.zip`
- `electron/dist/CHECKSUMS.txt`

Inside the desktop app, CouchDB API calls go through an embedded localhost proxy owned by the Electron process. Product analytics and download-gating endpoints are disabled in the local desktop build.

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
├── backend/                  # Node.js backend for proxy, downloads, and analytics
│   ├── db.js
│   ├── posthog.js
│   ├── releases.js
│   ├── server.js
│   └── package.json
│
├── electron/                 # Electron desktop wrapper
│   ├── local-api.js           # Embedded desktop CouchDB proxy
│   ├── main.js
│   ├── preload.js             # Runtime config bridge for desktop frontend
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
| `REACT_APP_BACKEND_URL` | Hosted web backend API URL | (empty for standalone/local desktop builds) |

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8001 |
| `DATABASE_URL` | Hosted Postgres connection string for leads and usage records | unset |
| `PGSSL` | Set to `true` when your Postgres host requires SSL | `false` |
| `POSTHOG_HOST` | Self-hosted PostHog base URL | unset |
| `POSTHOG_PROJECT_API_KEY` | PostHog project API key for event capture | unset |
| `RELEASE_TAG` | GitHub Release tag used for desktop redirects | `v1.0.0` |
| `GITHUB_REPOSITORY` | `owner/repo` used to build release download URLs | `syedhasanabbaszaidi/client` |

---

## Web Product Rollout

The web app remains the main product surface. It now includes:

- a top-right menu with `About` and `Settings`
- desktop download prompts on the connection screen and in active sessions
- a gated download form that asks for name and email before redirecting to DMG or EXE assets
- credit placement for Hasan Abbas across the connection page, About dialog, download surfaces, and footer

### Rollout Dependencies

Before deploying the hosted web product, make sure these are ready:

1. A hosted Postgres database for leads, download events, web sessions, and usage events.
2. A self-hosted PostHog instance for analytics dashboards.
3. Published GitHub Release assets for the current desktop version.
4. Environment variables set in the backend host for Postgres, PostHog, and release metadata.

### What Gets Tracked

The hosted web product records minimal adoption data:

- page visits
- session starts
- connection attempts and outcomes
- download form submissions
- download redirects
- basic platform and location headers when available

It does not store CouchDB URLs, usernames, or passwords in backend analytics tables.

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
