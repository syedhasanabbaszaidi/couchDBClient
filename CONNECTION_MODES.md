# Connection Modes: Direct vs Proxy

## Overview

The CouchDB Client supports two connection modes automatically selected based on your CouchDB URL:

- **Direct Mode** - For localhost/tunnel connections (your computer)
- **Proxy Mode** - For remote/public servers

## How It Works

### Direct Mode (Localhost/127.0.0.1)

**When Used:**
- URL contains `localhost` (e.g., `http://localhost:9004`)
- URL contains `127.0.0.1` (e.g., `http://127.0.0.1:5984`)

**How It Works:**
- Browser connects **directly** to CouchDB
- No backend proxy involved
- Credentials sent directly from browser to CouchDB
- Perfect for local tunnels and development

**Advantages:**
- ✅ Works with SSH tunnels
- ✅ Works with local CouchDB instances
- ✅ Faster (no proxy overhead)
- ✅ Essential for desktop app usage

**Connection Flow:**
```
Browser → Direct Connection → CouchDB (localhost:9004)
```

### Proxy Mode (Remote Servers)

**When Used:**
- URL contains domain names (e.g., `http://couchdb.example.com`)
- URL contains public IPs (e.g., `http://203.0.113.10:5984`)

**How It Works:**
- Browser sends request to backend server
- Backend server proxies request to CouchDB
- Helps with CORS issues on remote servers

**Advantages:**
- ✅ Handles CORS automatically
- ✅ Can add additional security layers
- ✅ Works with firewalled servers

**Connection Flow:**
```
Browser → Backend Server → Remote CouchDB
```

## Visual Indicator

Look for the connection mode badge in the top bar:
- **Direct** badge = Direct connection (localhost)
- **Proxy** badge = Proxied connection (remote server)

## Use Cases

### Use Case 1: SSH Tunnel (Direct Mode)
```bash
# Create SSH tunnel
ssh -L 9004:localhost:5984 user@remote-server

# Connect in CouchDB Client
URL: http://localhost:9004
Username: admin
Password: ********

# Result: Direct Mode activated ✓
```

### Use Case 2: Local CouchDB (Direct Mode)
```bash
# CouchDB running on your computer
URL: http://localhost:5984
Username: admin
Password: ********

# Result: Direct Mode activated ✓
```

### Use Case 3: Remote Server (Proxy Mode)
```bash
# CouchDB on a remote server
URL: https://db.company.com
Username: admin
Password: ********

# Result: Proxy Mode activated ✓
```

### Use Case 4: Docker Container (Direct Mode)
```bash
# Docker CouchDB exposed to localhost
docker run -p 9004:5984 couchdb

# Connect in CouchDB Client
URL: http://localhost:9004
Username: admin
Password: ********

# Result: Direct Mode activated ✓
```

## Desktop App Considerations

When using the desktop app (Electron):
- **Direct Mode is essential** for localhost connections
- Desktop app can't access server-side backend proxy
- All localhost/127.0.0.1 connections use Direct Mode
- Remote connections require the backend to be deployed separately

## Troubleshooting

### Problem: Can't connect to localhost:9004

**Check:**
1. Is your tunnel active?
   ```bash
   # Test tunnel
   curl http://localhost:9004
   ```
2. Is CouchDB running?
3. Are credentials correct?
4. Check browser console for CORS errors

**Solution:**
- Direct Mode automatically handles localhost connections
- No backend configuration needed
- Just make sure tunnel/CouchDB is accessible

### Problem: CORS errors on remote server

**Solution:**
- App automatically uses Proxy Mode for remote servers
- Backend handles CORS for you
- No CouchDB CORS configuration needed

### Problem: Connection mode shows wrong badge

**Debug:**
```javascript
// Check in browser console
const url = "http://localhost:9004";
const isDirect = url.includes('localhost') || url.includes('127.0.0.1');
console.log('Direct Mode:', isDirect); // Should be true
```

## Security Considerations

### Direct Mode
- Credentials sent directly from browser to CouchDB
- Secure when using localhost (stays on your machine)
- Use HTTPS for non-localhost connections
- Consider basic auth over HTTPS only

### Proxy Mode
- Credentials sent to backend, then to CouchDB
- Backend can add additional security layers
- Useful for centralized authentication
- Can implement rate limiting, logging

## Configuration

No configuration needed! The app automatically detects and switches modes based on the URL you enter.

### Manual Override (Advanced)

If you need to force a specific mode, edit Dashboard.js:

```javascript
// Force Direct Mode
const useDirect = true;

// Force Proxy Mode
const useDirect = false;

// Auto-detect (default)
const useDirect = isLocalhost(connection.url);
```

## Performance Comparison

| Aspect | Direct Mode | Proxy Mode |
|--------|-------------|------------|
| Latency | Low (~10ms) | Medium (~50ms) |
| Bandwidth | Direct | Via Backend |
| CORS Issues | May occur | Handled |
| Setup | None | Backend required |
| Desktop App | ✅ Works | ❌ Needs separate backend |

## Best Practices

### For Development
1. Use Direct Mode with localhost:5984
2. No backend setup needed
3. Fast iteration cycles

### For Production (Web App)
1. Use Proxy Mode for remote databases
2. Deploy backend server
3. Configure CORS on backend if needed

### For Desktop App Distribution
1. Package with Direct Mode support
2. Users connect to their own localhost tunnels
3. No backend deployment needed
4. Users manage their own CouchDB connections

### For Team Use
1. Deploy both frontend and backend
2. Use Proxy Mode for centralized access
3. Implement additional auth layers in backend
4. Monitor usage via backend logs

## Common Scenarios

### Scenario: Developer using SSH tunnel
```
Setup: ssh -L 9004:localhost:5984 server
URL: http://localhost:9004
Mode: Direct ✓
Result: Works perfectly, no backend needed
```

### Scenario: Team accessing company CouchDB
```
Setup: CouchDB at https://db.company.com
URL: https://db.company.com
Mode: Proxy ✓
Result: Backend handles CORS and security
```

### Scenario: Desktop app user
```
Setup: Local CouchDB or tunnel
URL: http://localhost:5984
Mode: Direct ✓
Result: Standalone app, no server needed
```

### Scenario: Multiple environments
```
Dev: http://localhost:5984 (Direct)
Staging: https://staging-db.company.com (Proxy)
Prod: https://db.company.com (Proxy)
```

## FAQ

**Q: Why do I see "Direct" mode?**
A: You're connecting to localhost/127.0.0.1, which means Direct Mode is active.

**Q: Can I use Direct Mode with a domain name?**
A: No, Direct Mode only activates for localhost/127.0.0.1 addresses.

**Q: Do I need the backend server for Direct Mode?**
A: No! Direct Mode bypasses the backend entirely.

**Q: Will my desktop app work without internet?**
A: Yes, if CouchDB is local or tunneled, Direct Mode works offline.

**Q: Can I connect to both localhost and remote in different tabs?**
A: Yes! Each tab independently detects and uses the appropriate mode.

**Q: Is Direct Mode secure?**
A: Yes, when connecting to localhost. Use HTTPS for any non-local connections.

---

**Summary:** The app intelligently chooses the right connection mode for you. Just enter your CouchDB URL and it works! 🚀
