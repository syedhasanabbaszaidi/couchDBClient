# Database Selector - Usage Guide

## How It Works

The database selector is a **smart text input** with autocomplete that behaves differently based on its state:

### State 1: No Database Selected (Empty)
```
┌─────────────────────────────┐
│ Type database name...       │  ← Click and type
└─────────────────────────────┘
```

**Behavior:**
- Click to focus
- Start typing to filter databases
- Autocomplete dropdown appears
- Shows matching databases
- Click a database to select it

### State 2: Database Selected
```
┌─────────────────────────────┐
│ my_database              [X]│  ← Selected database with X button
└─────────────────────────────┘
```

**Behavior:**
- Shows selected database name
- X button appears on the right
- Click X to clear selection
- Click input to start typing → clears selection and filters
- Fully editable - just start typing

### State 3: Typing to Filter
```
┌─────────────────────────────┐
│ my_dat                      │  ← Typing to filter
└─────────────────────────────┘
  ▼
┌─────────────────────────────┐
│ ○ my_database               │  ← Autocomplete suggestions
│ ○ my_data_backup            │
│ ○ my_data_staging           │
└─────────────────────────────┘
```

**Behavior:**
- Type to filter in real-time
- Dropdown shows matching databases
- Arrow keys to navigate
- Enter or click to select
- Esc to close dropdown

---

## Usage Examples

### Example 1: Select First Database
```
1. Page loads → input is empty
2. Click database selector input
3. Dropdown shows all databases
4. Click "users_db"
5. Input now shows "users_db" with X button
```

### Example 2: Search and Select
```
1. Page loads → input is empty
2. Type "prod" in the input
3. Dropdown filters to show:
   - production_db
   - production_backup
4. Click "production_db"
5. Input shows "production_db" with X button
```

### Example 3: Change Database
```
Method A (Using X button):
1. Currently shows "users_db"
2. Click the X button
3. Input clears
4. Type new database name or select from dropdown

Method B (Start typing):
1. Currently shows "users_db"
2. Click input and start typing "prod"
3. Selection clears automatically
4. Dropdown shows filtered results
5. Select new database
```

### Example 4: Quick Switch
```
1. Currently viewing "users_db"
2. Click in the input field
3. Start typing "ord" (for orders_db)
4. Selection auto-clears
5. Dropdown shows "orders_db"
6. Press Enter or click to select
7. Documents reload for new database
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Click | Focus input and show all databases |
| Type | Filter databases in real-time |
| Arrow Down/Up | Navigate dropdown suggestions |
| Enter | Select highlighted database |
| Escape | Close dropdown |
| Tab | Move to next field |

---

## Visual States

### Empty State
```
Input: [ Type database name...                    ]
Button: None
Dropdown: Closed (opens on focus)
```

### Typing State
```
Input: [ my_d|                                    ]
Button: None (typing in progress)
Dropdown: Open (showing filtered results)
```

### Selected State
```
Input: [ my_database                           [X]]
Button: X (clear button)
Dropdown: Closed
```

---

## Common Scenarios

### Scenario 1: First Time User
```
Action: Connects to CouchDB
Result: First database auto-selected
Display: Shows database name with X button
```

### Scenario 2: Multiple Databases
```
Action: Click input to see all databases
Result: Dropdown shows complete list
Action: Type to filter (e.g., "test")
Result: Only databases containing "test" shown
```

### Scenario 3: Switching Between Documents
```
Current: Viewing document in "users_db"
Action: Click database input, type "prod"
Result: Switches to production_db
Effect: Document list refreshes for new database
```

### Scenario 4: Clearing Selection
```
Current: "users_db" selected
Method 1: Click X button → Input clears
Method 2: Click input, start typing → Selection auto-clears
```

---

## Filtering Logic

The filter is **case-insensitive** and matches **anywhere in the database name**:

```
Input: "test"
Matches:
  ✓ test_db
  ✓ my_test_database
  ✓ latest_data
  ✗ production_db
  ✗ users_db

Input: "prod"
Matches:
  ✓ production_db
  ✓ production_backup
  ✓ reproduce_db
  ✗ test_db
  ✗ staging_db
```

---

## Integration with App

### On Database Change
```
1. User selects new database
2. Input updates to show database name
3. X button appears
4. Document list clears
5. App loads documents from new database
6. Recent documents section updates
7. Editor clears current document
```

### Persistence
```
✓ Selected database remembered in session
✓ Survives page refresh (within same tab)
✗ Not saved across different tabs
✗ Not saved in localStorage (session only)
```

---

## Troubleshooting

### Issue: Can't click on input
**Solution:** Click directly on the text input area (not the X button)

### Issue: Dropdown not showing
**Solution:** Click in the input or start typing - dropdown appears automatically

### Issue: X button not visible
**Solution:** X button only appears when a database is selected, not while typing

### Issue: Can't type in the input
**Solution:** Input is always editable - just click and start typing. If a database is selected, it will clear automatically when you type.

### Issue: Filter not working
**Solution:** Make sure you're typing in the input field. Filter happens in real-time as you type.

### Issue: Selected database disappeared
**Solution:** Clicking in the input and typing automatically clears the selection to allow filtering. To keep selection, use X button to clear or select from dropdown.

---

## Tips & Best Practices

### Fast Database Switching
```
1. Memorize database name prefixes
2. Type prefix (e.g., "prod", "test", "user")
3. Press Enter on first match
4. Documents load immediately
```

### Working with Many Databases
```
1. Use consistent naming conventions
2. Type partial names to filter quickly
3. Use prefixes like:
   - dev_*, test_*, prod_*
   - user_*, order_*, product_*
```

### Keyboard-Only Workflow
```
1. Tab to database selector
2. Type filter text
3. Arrow down to desired database
4. Press Enter
5. Continue with keyboard shortcuts
```

---

## Design Rationale

### Why Text Input Instead of Dropdown?

**Advantages:**
1. **Faster filtering** - Type to search instantly
2. **Scalable** - Works with 100+ databases
3. **Visual clarity** - See what's selected
4. **Flexible** - Clear with X or start typing
5. **Keyboard friendly** - Full keyboard navigation

**Compared to Traditional Dropdown:**
- Dropdown: Click → Scroll → Click
- Text Input: Type few letters → Enter
- **Winner:** Text input (3x faster)

### Why Auto-Clear on Type?

When you click and start typing:
1. User intent: Change database
2. Old selection: No longer relevant
3. Auto-clear: Immediate feedback
4. Filter: Shows new options
5. Result: Smooth UX flow

Alternative would be:
- User types but selection doesn't clear
- Filter doesn't work because selection is locked
- Confusing UX

---

## Future Enhancements

Possible improvements:
1. Recent databases section (like recent documents)
2. Favorite/pin databases
3. Database icons/badges (size, doc count)
4. Database groups/categories
5. Smart suggestions based on usage

---

**Summary:** The database selector is a powerful text input with autocomplete. Just click and type - it's smart enough to figure out what you want! 🚀
