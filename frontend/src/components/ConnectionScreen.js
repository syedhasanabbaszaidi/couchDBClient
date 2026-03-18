import { useState, useEffect } from 'react';
import { Database, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConnectionScreen({ onConnect }) {
  const [url, setUrl] = useState('http://127.0.0.1:5984');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentConnections, setRecentConnections] = useState([]);

  useEffect(() => {
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
        onConnect({ url, username, password });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(error.response?.data?.detail || 'Failed to connect to CouchDB');
    } finally {
      setLoading(false);
    }
  };

  const handleRecentClick = (connection) => {
    setUrl(connection.url);
    setUsername(connection.username || '');
  };

  return (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 rounded-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-900 rounded-md">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">CouchDB Client</h1>
            <p className="text-sm text-slate-500 font-body">Connect to your database</p>
          </div>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium text-slate-700">Host URL</Label>
            <Input
              id="url"
              type="text"
              placeholder="http://127.0.0.1:5984"
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

          <Button
            type="submit"
            className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
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
        </form>

        {recentConnections.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Recent Connections</p>
            <div className="space-y-2">
              {recentConnections.map((conn, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentClick(conn)}
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
  );
}
