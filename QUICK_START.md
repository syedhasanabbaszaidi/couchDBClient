# CouchDB Client - Quick Start Guide

## 🚀 Getting Started in 60 Seconds

### Step 1: Connect to Your Database
```
1. Open the app
2. Enter Host URL: http://localhost:9004
3. Enter Username: admin
4. Enter Password: ********
5. Click "Connect"
```

### Step 2: Select a Database
```
1. Click the database dropdown (top bar)
2. Type to search or scroll
3. Click to select
```

### Step 3: Work with Documents
```
📄 View: Click any document in the sidebar
✏️  Edit: Modify JSON, click "Save"
➕ Create: Click "New Document"
🗑️  Delete: Click trash icon
📥 Download: Click download icon
📋 Copy ID: Click copy icon
```

---

## 🎯 Key Features at a Glance

### Connection Screen
```
┌─────────────────────────────────────┐
│  🔌 CouchDB Client                  │
├─────────────────────────────────────┤
│  Connection Name: [My Server____]   │
│  Host URL:       [localhost:9004]   │
│  Username:       [admin________]    │
│  Password:       [••••••••••••]     │
│                                     │
│  [Connect]  [Save]                  │
├─────────────────────────────────────┤
│  💾 Saved Connections:              │
│    • Production DB  [🗑️]            │
│    • Dev Server     [🗑️]            │
│                                     │
│  🕐 Recent Connections:             │
│    • http://localhost:5984          │
└─────────────────────────────────────┘
```

### Main Dashboard (Multi-Tab)
```
┌─────────────────────────────────────────────────────┐
│ [Dev Server] [Production] [Local] [+]               │ ← Tabs
├─────────────────────────────────────────────────────┤
│ 🔍 [Database Selector ▼]  localhost:9004  [Logout] │ ← Top Bar
├──────────────┬──────────────────────────────────────┤
│ 🔍 Search    │  📂 mydb / doc-123                   │ ← Breadcrumb
│              │                                      │
│ [+ New Doc]  │  [📥] [📋] [↻ Revert] [💾 Save] [🗑️] │ ← Actions
│              │                                      │
│ 🕐 Recent    │  ┌──────────────────────────────┐   │
│  • doc-123   │  │ {                            │   │
│  • doc-456   │  │   "_id": "doc-123",          │   │ ← JSON Editor
│              │  │   "_rev": "1-abc",           │   │
│ 📋 All Docs  │  │   "name": "Example"          │   │
│  • doc-001   │  │ }                            │   │
│  • doc-002   │  └──────────────────────────────┘   │
│  • doc-003   │                                      │
│  • ...       │  Rev: 1-abc123...                    │ ← Status
└──────────────┴──────────────────────────────────────┘
   Sidebar            Editor Area
```

---

## 💡 Common Tasks

### Task: Connect to Multiple Databases
```
1. Connect to first database → Tab created
2. Click [+] in tab bar
3. Enter second database credentials
4. Click "Connect" → New tab created
5. Switch between tabs by clicking
```

### Task: Save a Connection for Later
```
1. Enter connection details
2. Give it a name: "Production DB"
3. Click "Save" button
4. Next time: Click saved connection to load
5. Just enter password and connect
```

### Task: Find a Document Quickly
```
Method 1: Search with Autocomplete
  1. Click search box
  2. Type document ID: "user-"
  3. Dropdown shows matches
  4. Click to open

Method 2: Use Recent Documents
  1. Look at "Recently Opened" section
  2. Click any recent document
  3. Opens instantly

Method 3: Browse All
  1. Scroll through "All Documents"
  2. Click to open
```

### Task: Create a New Document
```
1. Click "New Document" button
2. Editor opens with:
   {
     "_id": "auto-generated-uuid"
   }
3. Add your fields:
   {
     "_id": "user-123",
     "name": "John",
     "email": "john@example.com"
   }
4. Click "Save"
```

### Task: Download a Document
```
1. Open any document
2. Click download icon (📥)
3. File saves as: {document-id}.json
4. Use for backup or offline editing
```

### Task: Compare Documents Across Databases
```
1. Open first database in tab 1
2. Open document A
3. Click [+] to add new tab
4. Connect to second database
5. Open document B
6. Switch between tabs to compare
```

---

## ⚡ Power User Tips

### Workflow: Database Migration
```
1. Open source DB in tab 1
2. Open target DB in tab 2
3. In tab 1: Open document → Download
4. Switch to tab 2: Create new document
5. Paste downloaded JSON → Save
```

### Workflow: Batch Backup
```
1. Select database
2. Open each document you want to backup
3. Click download icon for each
4. All files saved to Downloads folder
5. Store in version control
```

### Workflow: Quick Edits
```
1. Use search autocomplete to find document
2. Make quick edit
3. Ctrl/Cmd + S to save
4. Document appears in "Recently Opened"
5. Easy to revisit later
```

### Workflow: Multi-Environment Testing
```
Tab 1: Production (read-only review)
Tab 2: Staging (testing changes)  
Tab 3: Development (active editing)

Switch tabs to verify data across environments
```

---

## 🎨 UI Elements Explained

### Status Indicators
- ✅ **White background** = Valid JSON
- ❌ **Red background** = Invalid JSON (won't save)
- 💾 **Save button disabled** = No changes or invalid
- 💾 **Save button enabled** = Ready to save
- ✓ **Checkmark** = Copy successful

### Document List Colors
- **White background + shadow** = Currently open
- **Gray background** = Available documents
- **Orange accent** = CouchDB brand color

### Tab States
- **White tab** = Active connection
- **Dark tab** = Inactive connection
- **X appears on hover** = Close tab option

---

## 🔧 Troubleshooting Quick Fixes

### Issue: Can't see databases
```
Fix: Check username/password are correct
     Verify CouchDB is running
     Look for error message in bottom-right toast
```

### Issue: Document won't save
```
Fix: Check for red background (invalid JSON)
     Add missing commas in JSON
     Ensure _rev field is correct
     Copy error message and fix syntax
```

### Issue: Search not finding documents
```
Fix: Click refresh button (↻) in sidebar
     Check you're in the right database
     Verify document actually exists
```

### Issue: Tab disappeared
```
Fix: Click [+] to reconnect
     Or refresh page (tabs persist)
     Re-enter password if needed
```

---

## 📊 Feature Comparison

| Feature | Old Version | New Version |
|---------|-------------|-------------|
| Connections | Single | Multiple (Tabs) |
| Database Selector | Dropdown | Searchable |
| Document Search | Filter | Autocomplete |
| Recent Docs | ❌ | ✅ (Last 10) |
| New Doc ID | Manual | Auto UUID |
| Download | ❌ | ✅ JSON File |
| Save Connections | Session Only | Permanent |
| Default URL | 127.0.0.1:5984 | localhost:9004 |

---

## 🎓 Learning Path

### Beginner (Day 1)
- [ ] Connect to database
- [ ] Browse documents
- [ ] Edit and save a document
- [ ] Create a new document

### Intermediate (Week 1)
- [ ] Save multiple connections
- [ ] Use search autocomplete
- [ ] Download documents
- [ ] Work with recent documents

### Advanced (Month 1)
- [ ] Manage multiple connections in tabs
- [ ] Use keyboard shortcuts efficiently
- [ ] Implement backup workflows
- [ ] Set up for team collaboration

---

## 🚨 Important Reminders

1. **Save Connection ≠ Auto-Connect**
   - Saved connections store URL + username
   - Password must be re-entered for security
   
2. **Tabs Persist Page Refresh**
   - Connection details saved
   - Passwords NOT saved
   - Re-enter password on refresh

3. **JSON Must Be Valid**
   - No trailing commas
   - Proper quotes around keys
   - Correct nesting brackets

4. **Document IDs Are Permanent**
   - Can't change `_id` after creation
   - Plan your ID structure
   - Use meaningful names

5. **Revisions Prevent Conflicts**
   - `_rev` field tracks versions
   - CouchDB won't save if `_rev` is old
   - Reload document if save fails

---

## 📞 Need More Help?

- **Detailed Guide**: See [FEATURES_GUIDE.md](./FEATURES_GUIDE.md)
- **Setup**: See [README.md](./README.md)
- **Desktop App**: See [ELECTRON_SETUP.md](./ELECTRON_SETUP.md)
- **CouchDB Docs**: https://docs.couchdb.org/

---

**Happy Database Managing! 🚀**
