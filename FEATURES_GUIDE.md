# CouchDB Client - Feature Guide

## Table of Contents
1. [Connection Management](#connection-management)
2. [Multi-Tab Support](#multi-tab-support)
3. [Database Browser](#database-browser)
4. [Document Operations](#document-operations)
5. [Search & Navigation](#search--navigation)
6. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Connection Management

### Connecting to CouchDB

1. **Enter Connection Details**
   - **Connection Name** (optional): Give your connection a friendly name
   - **Host URL**: Default is `http://localhost:9004` (your tunnel endpoint)
   - **Username**: CouchDB admin username
   - **Password**: CouchDB password

2. **Quick Connect**
   - Click **Connect** to immediately connect to the database
   - Connection details are temporarily stored for the session

3. **Save Connection**
   - Click **Save** button to permanently save the connection
   - Saved connections appear in the right panel
   - Passwords are NOT saved for security reasons

### Saved Connections

- **View Saved**: All saved connections appear in the "Saved Connections" section
- **Load Connection**: Click on any saved connection to auto-fill the form
- **Delete Saved**: Click the trash icon to remove a saved connection
- **Edit Name**: Delete and re-save with a new name

### Recent Connections

- Last 5 connections are automatically saved (without passwords)
- Click any recent connection to quickly load its details
- Recent connections are session-based

---

## Multi-Tab Support

### Opening Multiple Connections

1. **First Connection**: Connect from the main screen
2. **Add New Tab**: Click the **+** button in the tab bar
3. **Switch Tabs**: Click on any tab to switch between connections
4. **Close Tab**: Hover over a tab and click the **X** icon

### Tab Features

- Each tab maintains its own:
  - Database selection
  - Open documents
  - Editor state
- Tabs persist across page refreshes (without passwords)
- Tab names show connection names or URLs

---

## Database Browser

### Searchable Database Selector

1. **Access**: Click the database dropdown in the top bar
2. **Search**: Start typing to filter databases
3. **Select**: Click or press Enter to select a database
4. **Keyboard Navigation**: Use arrow keys to navigate options

### Database Features

- Only user databases shown (system databases starting with `_` are hidden)
- First available database auto-selected on connection
- Switch databases instantly without reconnecting

---

## Document Operations

### Creating New Documents

1. **Click**: "New Document" button in the sidebar
2. **Auto-Generated**: Document opens with pre-filled `_id` field (UUID)
3. **Edit**: Modify the JSON as needed
4. **Save**: Click "Save" to create the document

**Example Auto-Generated Document:**
```json
{
  "_id": "a1b2c3d4-e5f6-4789-y0x1-w2v3u4t5s6r7"
}
```

### Editing Documents

1. **Select**: Click a document from the sidebar
2. **Edit**: Modify JSON in the editor
3. **Validation**: Real-time JSON syntax checking (red background = invalid)
4. **Save**: Click "Save" when done (disabled if invalid JSON)
5. **Revert**: Click "Revert" to undo unsaved changes

### Downloading Documents

1. **Open**: Select any document
2. **Download**: Click the download icon (📥) in the toolbar
3. **File**: Downloads as `{document-id}.json` to your computer
4. **Use Case**: Backup, version control, or offline editing

### Copying Document IDs

1. **Open**: Select any document
2. **Copy**: Click the copy icon (📋) in the toolbar
3. **Copied**: Document ID is copied to clipboard
4. **Feedback**: Checkmark appears briefly to confirm

### Deleting Documents

1. **Open**: Select the document to delete
2. **Delete**: Click the trash icon (🗑️)
3. **Confirm**: Confirm deletion in the dialog
4. **Permanent**: This action cannot be undone

---

## Search & Navigation

### Document Search with Autocomplete

1. **Search Bar**: Located at the top of the sidebar
2. **Type**: Start typing a document ID
3. **Autocomplete**: Dropdown shows matching documents
4. **Select**: Click or use keyboard to select
5. **Instant Filter**: List below also filters in real-time

### Recently Opened Documents

- **Location**: Top section of sidebar (when available)
- **Auto-Save**: Last 10 opened documents per database
- **Quick Access**: Click to instantly open
- **Per Database**: Each database maintains its own recent list
- **Persistent**: Saved across sessions

### Document List

- **All Documents**: Full list shown below recent documents
- **Scroll**: Scrollable list with custom styled scrollbar
- **Active Highlight**: Currently open document is highlighted
- **Click**: Select any document to open in editor

---

## Keyboard Shortcuts

### Global
- `Ctrl/Cmd + S`: Save current document
- `Ctrl/Cmd + C`: Copy document ID (when editor is focused)
- `Escape`: Close dialogs/popovers

### Navigation
- `Tab`: Move between form fields
- `Arrow Keys`: Navigate dropdown options
- `Enter`: Select highlighted option
- `Escape`: Close dropdowns

### Editor
- `Tab`: Insert spaces (not actual tab character)
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo
- `Ctrl/Cmd + A`: Select all

---

## Tips & Best Practices

### Connection Tips
1. Use meaningful connection names for saved connections
2. Save frequently-used connections for quick access
3. Keep tunnel endpoints in URL format (http://localhost:9004)

### Document Management
1. Always check JSON validity before saving (no red background)
2. Use Download feature before making risky changes
3. Review revision number (`_rev`) to track document versions
4. Document IDs are immutable - plan naming carefully

### Performance
1. Databases with 1000+ documents may load slowly
2. Use search to quickly find documents in large databases
3. Close unused tabs to free up memory

### Multi-Tab Workflow
1. Keep production and development databases in separate tabs
2. Use tabs to compare documents across databases
3. Name your connections clearly to avoid confusion

### Search Optimization
1. Recently opened documents appear first for quick access
2. Search is case-insensitive
3. Partial matches work (e.g., "user" finds "user-123")

---

## Troubleshooting

### Can't Connect
- Verify CouchDB is running at specified URL
- Check tunnel is active (for localhost:9004)
- Verify username/password are correct
- Check browser console for CORS errors

### Document Won't Save
- Check for red background (invalid JSON)
- Ensure `_rev` field matches current revision
- Verify you have write permissions

### Tab Not Loading
- Refresh the page
- Check connection is still active
- Re-enter password if session expired

### Search Not Working
- Clear browser cache
- Check if database has documents
- Try refreshing document list

---

## Advanced Usage

### Bulk Operations
- Open multiple tabs to compare documents
- Download multiple documents for batch processing
- Use recently opened list to revisit modified documents

### Version Control Integration
- Download documents before making changes
- Use git/svn to track JSON file versions
- Import modified JSON files back to CouchDB

### Collaborative Editing
- Multiple users can connect to same database
- Document revisions prevent conflicts
- Use meaningful `_id` values for team coordination

---

## Security Notes

- Passwords are stored in browser session storage only
- Passwords are NOT included in saved connections
- Clear browser data to remove all stored credentials
- Use HTTPS URLs for production databases
- Never share screenshots with visible credentials

---

## Feature Checklist

- ✅ Multi-tab connections
- ✅ Saved connection management
- ✅ Searchable database selector
- ✅ Auto-complete document search
- ✅ Recently opened documents
- ✅ Auto-generated UUIDs for new docs
- ✅ Download documents as JSON
- ✅ Copy document IDs
- ✅ Real-time JSON validation
- ✅ Minimal, developer-focused UI
- ✅ Desktop app packaging support

---

For more information, see the main [README.md](./README.md) or [ELECTRON_SETUP.md](./ELECTRON_SETUP.md).
