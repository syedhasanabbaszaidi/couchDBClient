# CouchDB Client MVP

A minimal, developer-focused CouchDB client for managing databases and documents. Built with React, FastAPI, and available as both a web app and desktop application.

## Features

- 🔌 **Connect to CouchDB** - Easy connection with URL and credentials (default: localhost:9004)
- 💾 **Saved Connections** - Save and manage multiple CouchDB connections
- 📑 **Multi-Tab Support** - Open multiple connections side by side in tabs
- 📚 **Database Management** - Browse and switch between databases with searchable dropdown
- 📄 **Document Operations** - View, edit, create, and delete documents
- 🔍 **Smart Search** - Autocomplete search with recently opened documents
- ⏱️ **Recent Documents** - Quick access to previously opened files
- 🆕 **Auto UUID** - New documents auto-populated with `_id` UUID
- 📥 **Download Documents** - Save documents locally as JSON files
- 💾 **JSON Editor** - Formatted JSON editing with real-time validation
- 🎨 **Minimal UI** - Clean, developer-focused interface
- 💻 **Desktop Apps** - Package as Windows/Mac applications
- 🌐 **Web App** - Use directly in browser

## Documentation

- 📖 **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 60 seconds
- 🔌 **[Connection Modes](./CONNECTION_MODES.md)** - Direct vs Proxy (localhost tunnels explained)
- 📚 **[Features Guide](./FEATURES_GUIDE.md)** - Complete feature documentation
- 💻 **[Electron Setup](./ELECTRON_SETUP.md)** - Build desktop installers
- 📋 **[README](./README.md)** - This file (overview & installation)

## Quick Start (Web App)

### Prerequisites

- Python 3.11+
- Node.js 16+
- CouchDB server running (local or remote)
- For tunnel setup: CouchDB accessible at `localhost:9004`

### Installation

1. **Install Backend Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

2. **Install Frontend Dependencies**

```bash
cd frontend
yarn install
```

3. **Start Backend Server**

```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

4. **Start Frontend**

```bash
cd frontend
yarn start
```

5. **Open Browser**

Navigate to `http://localhost:3000`

## Usage

### Connecting to CouchDB

1. **Direct Connection**
   - Enter your CouchDB server URL: `http://localhost:9004`
   - Enter username and password (if authentication enabled)
   - Click **Connect** or **Save** to store connection

2. **Using Saved Connections**
   - Previously saved connections appear on the right
   - Click any saved connection to load details
   - Enter password and connect

3. **Multi-Tab Support**
   - Click **+** in tab bar to add new connection
   - Switch between multiple databases
   - Each tab maintains its own state

For detailed usage instructions, see [Quick Start Guide](./QUICK_START.md).

### Managing Documents

### Managing Documents

- **Select Database**: Use the searchable dropdown in the top bar (type to filter)
- **Browse Documents**: Listed in left sidebar
- **Quick Access**: Recently opened documents appear at the top
- **Search**: Type document ID in search box (autocomplete suggestions)
- **Create New**: Click "New Document" (auto-generates `_id` with UUID)
- **Edit**: Select document, modify JSON, click "Save"
- **Download**: Click download icon to save as JSON file
- **Copy ID**: Click copy icon to copy document ID to clipboard
- **Delete**: Click trash icon when viewing a document

### JSON Editor

- Automatically formats JSON with proper indentation
- Validates JSON in real-time (red border indicates errors)
- Shows document revision number
- Revert button to undo unsaved changes

## Desktop App Setup

See [ELECTRON_SETUP.md](./ELECTRON_SETUP.md) for detailed instructions on:

- Building desktop installers for Windows and Mac
- Testing the desktop app locally
- Customizing app name, icon, and settings
- Distribution options

**Quick Build**:

```bash
# Build frontend
cd frontend && yarn build

# Install Electron dependencies
cd ../electron && yarn install

# Build for your platform
yarn build:mac   # or build:win
```

Installers will be in `/electron/dist/`

## Architecture

### Backend (FastAPI)

- Acts as a proxy to CouchDB REST API
- Handles CORS issues
- Manages authentication headers
- Located in `/backend/`

**Endpoints**:
- `POST /api/couchdb/test-connection` - Test connection
- `GET /api/couchdb/databases` - List databases
- `GET /api/couchdb/documents` - List documents in database
- `GET /api/couchdb/document` - Get specific document
- `PUT /api/couchdb/document` - Save/update document
- `POST /api/couchdb/document` - Create new document
- `DELETE /api/couchdb/document` - Delete document

### Frontend (React)

- Clean, minimal UI with developer-focused design
- Uses Shadcn UI components
- Tailwind CSS for styling
- Located in `/frontend/`

**Components**:
- `ConnectionScreen` - Initial connection form
- `Dashboard` - Main application container
- `TopBar` - Database selector and connection info
- `Sidebar` - Document list and search
- `Editor` - JSON document editor

### Desktop (Electron)

- Packages web app as native desktop application
- Electron main process in `/electron/main.js`
- Build configuration in `/electron/package.json`

## Configuration

### Backend Environment Variables

Edit `/backend/.env`:

```env
CORS_ORIGINS="*"  # Allowed CORS origins
```

### Frontend Environment Variables

Edit `/frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001  # Backend API URL
```

## Development

### Tech Stack

- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Lucide Icons
- **Backend**: FastAPI, httpx
- **Desktop**: Electron, electron-builder
- **Fonts**: Manrope (headings), Inter (body), JetBrains Mono (code)

### Design System

- **Theme**: Minimal light theme, "Swiss Laboratory" aesthetic
- **Colors**: Slate-900 (primary), Orange-600 (accent), White background
- **Typography**: Clear hierarchy with proper spacing
- **Layout**: Fixed top bar, sidebar, and main editor area

### Adding Features

Some ideas for extensions:

- **Bulk operations** - Delete/export multiple documents
- **Database creation** - Create new databases
- **View support** - Browse CouchDB views
- **Attachments** - Upload/download file attachments
- **Replication** - Configure database replication
- **Design documents** - Edit design documents and views
- **Query builder** - Visual Mango query builder

## CouchDB Setup

If you don't have CouchDB installed:

### Using Docker

```bash
docker run -d --name couchdb -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  couchdb:latest
```

### Local Installation

- **Mac**: `brew install couchdb`
- **Ubuntu**: `sudo apt-get install couchdb`
- **Windows**: Download from [couchdb.apache.org](https://couchdb.apache.org/)

### Enable CORS (for direct frontend access)

```bash
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/origins -d '"*"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/credentials -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer"'
```

## Deployment

### Web App Deployment

**Backend**:
- Deploy to Heroku, AWS, Railway, or any Python host
- Ensure backend URL is accessible to frontend

**Frontend**:
- Build: `cd frontend && yarn build`
- Deploy `build/` folder to Netlify, Vercel, GitHub Pages, etc.
- Update `REACT_APP_BACKEND_URL` to production backend URL

### Desktop App Distribution

1. Build installers: `cd electron && yarn build:all`
2. Test on target platforms
3. Optionally sign apps for better user trust
4. Upload to GitHub Releases or your website
5. Provide download links for Windows (.exe) and Mac (.dmg)

## Troubleshooting

**Can't connect to CouchDB**:
- Ensure CouchDB is running: `curl http://localhost:5984`
- Check credentials are correct
- Verify URL format (include http:// or https://)

**CORS errors in browser**:
- Enable CORS on CouchDB (see above)
- Or use the backend proxy (default setup)

**Backend not starting**:
- Check Python version: `python --version` (needs 3.11+)
- Install dependencies: `pip install -r requirements.txt`
- Check port 8001 is not in use

**Frontend build errors**:
- Clear cache: `yarn cache clean`
- Delete node_modules: `rm -rf node_modules && yarn install`
- Check Node version: `node --version` (needs 16+)

## License

MIT

## Contributing

Contributions welcome! Please open issues or submit pull requests.

## Support

For issues or questions, please open a GitHub issue.
