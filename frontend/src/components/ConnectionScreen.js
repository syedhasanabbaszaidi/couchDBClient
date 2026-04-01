import { useState, useEffect } from 'react';
import { Database, Plug, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import ProductActions from '@/components/ProductActions';
import DesktopDownloadCallout from '@/components/DesktopDownloadCallout';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { 
  getSavedConnections, 
  saveConnection as saveConnectionToDB, 
  deleteSavedConnection,
  getRecentConnections,
  addRecentConnection 
} from '@/lib/localDB';

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
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const saved = await getSavedConnections();
      setSavedConnections(saved || []);
      
      const recent = await getRecentConnections();
      setRecentConnections(recent || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
      const connectionMode = isLocalhost ? 'direct' : 'proxy';

      await trackAnalyticsEvent('connection_attempted', {
        connectionMode,
        hasUsername: Boolean(username),
      }, {
        entrypoint: 'connection-screen',
      });
      
      if (isLocalhost) {
        const headers = {};
        if (username && password) {
          const credentials = `${username}:${password}`;
          const encoded = btoa(credentials);
          headers['Authorization'] = `Basic ${encoded}`;
        }
        
        const response = await axios.get(url, { headers });
        if (response.data.couchdb) {
          toast.success(`Connected to CouchDB ${response.data.version}!`);
          await trackAnalyticsEvent('connection_succeeded', {
            connectionMode,
            couchdbVersion: response.data.version,
          }, {
            entrypoint: 'connection-screen',
          });
          onConnect({ url, username, password, name: name || url });
          await addRecentConnection({ url, username, name: name || url });
        }
      } else {
        const response = await axios.post(`${API}/couchdb/test-connection`, {
          url,
          username: username || undefined,
          password: password || undefined,
        });

        if (response.data.success) {
          toast.success('Connected to CouchDB successfully!');
          await trackAnalyticsEvent('connection_succeeded', {
            connectionMode,
          }, {
            entrypoint: 'connection-screen',
          });
          onConnect({ url, username, password, name: name || url });
          await addRecentConnection({ url, username, name: name || url });
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.reason || 
                       error.message || 
                       'Failed to connect to CouchDB. Make sure CouchDB is running and accessible.';
      await trackAnalyticsEvent('connection_failed', {
        connectionMode: url.includes('localhost') || url.includes('127.0.0.1') ? 'direct' : 'proxy',
        errorType: error.response?.status ? 'http_error' : 'network_error',
      }, {
        entrypoint: 'connection-screen',
      });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!name.trim()) {
      toast.error('Please enter a connection name');
      return;
    }
    
    try {
      await saveConnectionToDB({ id: Date.now().toString(), name, url, username });
      await loadConnections();
      toast.success('Connection saved!');
    } catch (error) {
      toast.error('Failed to save connection');
    }
  };

  const handleLoadConnection = (conn) => {
    setUrl(conn.url);
    setUsername(conn.username || '');
    setName(conn.name || '');
  };

  const handleDeleteSaved = async (id) => {
    try {
      await deleteSavedConnection(id);
      await loadConnections();
      toast.success('Connection deleted');
    } catch (error) {
      toast.error('Failed to delete connection');
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-sm font-semibold text-slate-900 font-heading">CouchDB Client</p>
            <p className="text-xs text-slate-500">Browser workspace and desktop companion by Hasan Abbas</p>
          </div>
          <div className="flex items-center gap-2">
            <ProductActions entrypointPrefix="connection-header" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 rounded-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-900 rounded-md">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">CouchDB Client</h1>
            <p className="text-sm text-slate-500 font-body">Connect to your database and keep desktop access close by</p>
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
            <DesktopDownloadCallout entrypointPrefix="connection-screen" />

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
                      key={conn.id || idx}
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
    </div>
  );
}
