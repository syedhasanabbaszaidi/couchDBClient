import { useState, useEffect } from 'react';
import { Database, Plug, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConnectionScreen({ onConnect }) {
  const [url, setUrl] = useState('http://localhost:9004');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedConnections, setSavedConnections] = useState([]);
  const [recentConnections, setRecentConnections] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saved_connections') || '[]');
    setSavedConnections(saved);
    
    const recent = JSON.parse(localStorage.getItem('recent_connections') || '[]');
    setRecentConnections(recent);
  }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/couchdb/test-connection`, {
        url,
        username: username || undefined,
        password: password || undefined,
      });

      if (response.data.success) {
        toast.success('Connected to CouchDB successfully!');
        onConnect({ url, username, password, name: name || url });
        
        // Add to recent connections
        const recentConnections = JSON.parse(localStorage.getItem('recent_connections') || '[]');
        const newConnection = { url, username, name: name || url };
        const filtered = recentConnections.filter(c => c.url !== newConnection.url);
        filtered.unshift(newConnection);
        localStorage.setItem('recent_connections', JSON.stringify(filtered.slice(0, 5)));
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(error.response?.data?.detail || 'Failed to connect to CouchDB');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConnection = () => {
    if (!name.trim()) {
      toast.error('Please enter a connection name');
      return;
    }
    
    const saved = JSON.parse(localStorage.getItem('saved_connections') || '[]');
    const newConn = { id: Date.now().toString(), name, url, username };
    saved.push(newConn);
    localStorage.setItem('saved_connections', JSON.stringify(saved));
    setSavedConnections(saved);
    toast.success('Connection saved!');
  };

  const handleLoadConnection = (conn) => {
    setUrl(conn.url);
    setUsername(conn.username || '');
    setName(conn.name || '');
  };

  const handleDeleteSaved = (id) => {
    const filtered = savedConnections.filter(c => c.id !== id);
    localStorage.setItem('saved_connections', JSON.stringify(filtered));
    setSavedConnections(filtered);
    toast.success('Connection deleted');
  };

  return (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 rounded-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-900 rounded-md">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">CouchDB Client</h1>
            <p className="text-sm text-slate-500 font-body">Connect to your database</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Connection Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My CouchDB Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="connection-name-input"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium text-slate-700">Host URL</Label>
                <Input
                  id="url"
                  type="text"
                  placeholder="http://localhost:9004"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  data-testid="connection-url-input"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="connection-username-input"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="connection-password-input"
                  className="h-9"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
                  disabled={loading}
                  data-testid="connect-btn"
                >
                  {loading ? (
                    <span>Connecting...</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Plug className="w-4 h-4" />
                      Connect
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveConnection}
                  variant="outline"
                  className="h-9 px-4"
                  data-testid="save-connection-btn"
                >
                  Save
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {savedConnections.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Saved Connections</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-slate-200 hover:bg-slate-50"
                    >
                      <button
                        onClick={() => handleLoadConnection(conn)}
                        className="flex-1 text-left"
                        data-testid={`saved-connection-${conn.id}`}
                      >
                        <div className="font-medium text-slate-900">{conn.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{conn.url}</div>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSaved(conn.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-saved-${conn.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentConnections.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Recent Connections</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentConnections.map((conn, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadConnection(conn)}
                      className="w-full text-left px-3 py-2 text-sm rounded-md border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      data-testid={`recent-connection-${idx}`}
                    >
                      <div className="font-mono text-slate-900">{conn.url}</div>
                      {conn.username && <div className="text-xs text-slate-500 mt-1">{conn.username}</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
