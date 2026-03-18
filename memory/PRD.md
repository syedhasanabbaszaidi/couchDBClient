# CouchDB Client Tool - Product Requirements Document

## Original Problem Statement
Build a Minimum Viable Product (MVP) of a CouchDB client tool that allows users to:
- Connect to a CouchDB server via URL and credentials
- Manage databases and perform CRUD operations on documents
- Available as a web app and standalone desktop application for Windows and Mac

## Core Requirements

### Connection
- Connect to any CouchDB instance
- Save and manage multiple connections (IndexedDB)
- Support local tunnels (e.g., `localhost:9004`)
- Dual mode: Proxy (via Node.js backend) and Direct (frontend-to-CouchDB)

### UI Theme
- Minimal, light, developer-focused design
- Tabbed interface for multiple connections

### Layout
- **Connection Screen**: Main connection management
- **Top Bar**: Database selector with autocomplete, connection status indicator
- **Left Sidebar**: Recent documents list, document search bar
- **Main View**: Collapsible, syntax-highlighted JSON editor

### Functionality
- **Database Management**: Select, search, switch databases
- **Document Management**: Search (contains match), list recent, create/edit/save/revert/download/delete documents
- **Persistence**: IndexedDB for connections, recent documents, recent databases

## Technical Architecture

### Stack
- **Frontend**: React.js, Tailwind CSS, axios, lucide-react, react-json-view-lite
- **Backend**: Node.js, Express.js (optional proxy for non-localhost connections)
- **Storage**: IndexedDB (Dexie.js) for client-side persistence
- **Desktop**: Electron for standalone builds

### Key Files
- `/app/frontend/src/components/TopBar.js` - Database selector
- `/app/frontend/src/components/Sidebar.js` - Recent documents, document search
- `/app/frontend/src/components/Dashboard.js` - Main connection tab state
- `/app/frontend/src/components/Editor.js` - JSON document editor
- `/app/frontend/src/lib/localDB.js` - IndexedDB wrapper
- `/app/backend/server.js` - Node.js backend proxy
- `/app/electron/` - Electron configuration

## Completed Features (as of March 18, 2026)

### MVP Complete
- ✅ Connection management with IndexedDB persistence
- ✅ Tabbed interface for multiple connections
- ✅ Direct connection mode for localhost/tunnels
- ✅ Database selector with search and recent databases
- ✅ Document search (contains matching)
- ✅ Recent documents list with cross-database navigation
- ✅ JSON editor with syntax highlighting and collapsible view
- ✅ Document CRUD operations (create, read, update, delete)
- ✅ Connection status indicator
- ✅ Electron setup for desktop builds

### Bug Fixes (March 18, 2026)
- ✅ Fixed: After switching DB, first recent doc now shows database name
- ✅ Fixed: Database selection works on first click (no second click needed)
- ✅ Fixed: Document search correctly scoped to current database
- ✅ Fixed: Search uses "contains" matching (not "starts with")
- ✅ Improved: Debounce reduced to 500ms for faster UI response
- ✅ Improved: Search state clears when database changes

## Backlog / Future Enhancements
- Document preview on hover in search results
- Keyboard shortcuts for common actions
- JSON path breadcrumbs in editor
- Periodic connection health checks

## Build Instructions
See `/app/DEPLOYMENT_GUIDE.md` for detailed instructions on building standalone desktop applications for Windows and Mac.

## Testing
- Backend: pytest tests in `/app/backend/tests/`
- Frontend: Playwright tests in `/app/tests/e2e/`
- Test reports: `/app/test_reports/iteration_*.json`
