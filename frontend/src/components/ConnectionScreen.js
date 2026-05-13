import { useRef, useState, useEffect } from 'react';
import { Database, FileKey, Plug, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import ProductActions from '@/components/ProductActions';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { apiUrl, getApiBase, shouldUseDirectCouchConnection } from '@/lib/api';
import { 
  getSavedConnections, 
  saveConnection as saveConnectionToDB, 
  deleteSavedConnection,
  getRecentConnections,
  addRecentConnection 
} from '@/lib/localDB';

export default function ConnectionScreen({ onConnect }) {
  const [url, setUrl] = useState('http://localhost:6003');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [connectionType, setConnectionType] = useState('direct');
  const [sshHost, setSshHost] = useState('');
  const [sshPort, setSshPort] = useState('22');
  const [sshUsername, setSshUsername] = useState('');
  const [sshPassword, setSshPassword] = useState('');
  const [sshPrivateKey, setSshPrivateKey] = useState('');
  const [sshPrivateKeyFileName, setSshPrivateKeyFileName] = useState('');
  const [sshPassphrase, setSshPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedConnections, setSavedConnections] = useState([]);
  const [recentConnections, setRecentConnections] = useState([]);
  const privateKeyFileInputRef = useRef(null);

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
      const useDirect = shouldUseDirectCouchConnection(url);
      const connectionMode = connectionType === 'ssh' ? 'ssh' : (useDirect ? 'direct' : 'proxy');

      await trackAnalyticsEvent('connection_attempted', {
        connectionMode,
        hasUsername: Boolean(username),
      }, {
        entrypoint: 'connection-screen',
      });

      const normalizedUrl = url.trim().replace(/\/+$/, '');
      
      if (connectionType === 'ssh') {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local SSH tunnel support is only available in the desktop app.');
        }

        const response = await axios.post(apiUrl('/ssh/tunnels'), {
          couchdbUrl: normalizedUrl,
          username: username || undefined,
          password: password || undefined,
          ssh: {
            host: sshHost.trim(),
            port: sshPort || 22,
            username: sshUsername.trim(),
            password: sshPassword || undefined,
            privateKey: sshPrivateKey.trim() || undefined,
            passphrase: sshPassphrase || undefined,
            useAgent: true,
          },
        });

        if (response.data.success) {
          const tabName = name || `${sshHost.trim()} -> ${normalizedUrl}`;
          toast.success('Connected through SSH tunnel!');
          await trackAnalyticsEvent('connection_succeeded', {
            connectionMode,
          }, {
            entrypoint: 'connection-screen',
          });
          onConnect({
            url: response.data.url,
            targetUrl: normalizedUrl,
            connectionType: 'ssh',
            tunnelId: response.data.tunnelId,
            username,
            password,
            name: tabName,
          });
          await addRecentConnection({
            url: normalizedUrl,
            username,
            password,
            name: tabName,
            connectionType: 'ssh',
            sshHost: sshHost.trim(),
            sshPort,
            sshUsername: sshUsername.trim(),
            sshPassword,
            sshPrivateKey,
            sshPrivateKeyFileName,
            sshPassphrase,
          });
        }
      } else if (useDirect) {
        const headers = {};
        if (username && password) {
          const credentials = `${username}:${password}`;
          const encoded = btoa(credentials);
          headers['Authorization'] = `Basic ${encoded}`;
        }
        
        const response = await axios.get(normalizedUrl, { headers });
        if (response.data.couchdb) {
          await axios.get(`${normalizedUrl}/_all_dbs`, { headers });
          toast.success(`Connected to CouchDB ${response.data.version}!`);
          await trackAnalyticsEvent('connection_succeeded', {
            connectionMode,
            couchdbVersion: response.data.version,
          }, {
            entrypoint: 'connection-screen',
          });
          onConnect({ url: normalizedUrl, targetUrl: normalizedUrl, connectionType: 'direct', username, password, name: name || normalizedUrl });
          await addRecentConnection({ url: normalizedUrl, username, password, name: name || normalizedUrl, connectionType: 'direct' });
        }
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available. Restart the desktop app and try again.');
        }

        const response = await axios.post(apiUrl('/couchdb/test-connection'), {
          url: normalizedUrl,
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
          onConnect({ url: normalizedUrl, targetUrl: normalizedUrl, connectionType: 'direct', username, password, name: name || normalizedUrl });
          await addRecentConnection({ url: normalizedUrl, username, password, name: name || normalizedUrl, connectionType: 'direct' });
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.reason || 
                       error.message || 
                       'Failed to connect to CouchDB. Make sure CouchDB is running and accessible.';
      await trackAnalyticsEvent('connection_failed', {
        connectionMode: connectionType === 'ssh' ? 'ssh' : (shouldUseDirectCouchConnection(url) ? 'direct' : 'proxy'),
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
      const normalizedUrl = url.trim().replace(/\/+$/, '');
      await saveConnectionToDB({
        id: Date.now().toString(),
        name,
        url: normalizedUrl,
        username,
        password,
        connectionType,
        sshHost: sshHost.trim(),
        sshPort,
        sshUsername: sshUsername.trim(),
        sshPassword,
        sshPrivateKey,
        sshPrivateKeyFileName,
        sshPassphrase,
      });
      await loadConnections();
      toast.success('Connection saved!');
    } catch (error) {
      toast.error('Failed to save connection');
    }
  };

  const handleLoadConnection = (conn) => {
    setUrl(conn.url);
    setUsername(conn.username || '');
    setPassword(conn.password || '');
    setName(conn.name || '');
    setConnectionType(conn.connectionType || 'direct');
    setSshHost(conn.sshHost || '');
    setSshPort(conn.sshPort || '22');
    setSshUsername(conn.sshUsername || '');
    setSshPassword(conn.sshPassword || '');
    setSshPrivateKey(conn.sshPrivateKey || '');
    setSshPrivateKeyFileName(conn.sshPrivateKeyFileName || '');
    setSshPassphrase(conn.sshPassphrase || '');
  };

  const handlePrivateKeyFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setSshPrivateKey(text);
      setSshPrivateKeyFileName(file.name);
      toast.success('Private key loaded');
    } catch (error) {
      console.error('Failed to read private key file:', error);
      toast.error('Failed to read private key file');
    } finally {
      event.target.value = '';
    }
  };

  const handleClearPrivateKey = () => {
    setSshPrivateKey('');
    setSshPrivateKeyFileName('');
    if (privateKeyFileInputRef.current) {
      privateKeyFileInputRef.current.value = '';
    }
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
	              <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1 text-sm">
	                <button
	                  type="button"
	                  onClick={() => setConnectionType('direct')}
	                  className={`rounded px-3 py-2 font-medium transition-colors ${
	                    connectionType === 'direct'
	                      ? 'bg-white text-slate-900 shadow-sm'
	                      : 'text-slate-600 hover:text-slate-900'
	                  }`}
	                  data-testid="connection-type-direct"
	                >
	                  Direct / Public
	                </button>
	                <button
	                  type="button"
	                  onClick={() => setConnectionType('ssh')}
	                  className={`rounded px-3 py-2 font-medium transition-colors ${
	                    connectionType === 'ssh'
	                      ? 'bg-white text-slate-900 shadow-sm'
	                      : 'text-slate-600 hover:text-slate-900'
	                  }`}
	                  data-testid="connection-type-ssh"
	                >
	                  SSH Tunnel
	                </button>
	              </div>

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
	                <Label htmlFor="url" className="text-sm font-medium text-slate-700">
	                  {connectionType === 'ssh' ? 'CouchDB URL from SSH server' : 'Host URL'}
	                </Label>
	                <Input
	                  id="url"
	                  type="text"
	                  placeholder={connectionType === 'ssh' ? 'http://localhost:5984' : 'http://localhost:6003'}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  data-testid="connection-url-input"
                  className="h-9"
                />
	              </div>

	              {connectionType === 'ssh' && (
	                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
	                  <div className="grid grid-cols-3 gap-3">
	                    <div className="col-span-2 space-y-2">
	                      <Label htmlFor="ssh-host" className="text-sm font-medium text-slate-700">SSH Host</Label>
	                      <Input
	                        id="ssh-host"
	                        type="text"
	                        placeholder="server.example.com"
	                        value={sshHost}
	                        onChange={(e) => setSshHost(e.target.value)}
	                        required={connectionType === 'ssh'}
	                        data-testid="ssh-host-input"
	                        className="h-9"
	                      />
	                    </div>
	                    <div className="space-y-2">
	                      <Label htmlFor="ssh-port" className="text-sm font-medium text-slate-700">Port</Label>
	                      <Input
	                        id="ssh-port"
	                        type="number"
	                        min="1"
	                        max="65535"
	                        value={sshPort}
	                        onChange={(e) => setSshPort(e.target.value)}
	                        data-testid="ssh-port-input"
	                        className="h-9"
	                      />
	                    </div>
	                  </div>

	                  <div className="grid grid-cols-2 gap-3">
	                    <div className="space-y-2">
	                      <Label htmlFor="ssh-username" className="text-sm font-medium text-slate-700">SSH Username</Label>
	                      <Input
	                        id="ssh-username"
	                        type="text"
	                        value={sshUsername}
	                        onChange={(e) => setSshUsername(e.target.value)}
	                        required={connectionType === 'ssh'}
	                        data-testid="ssh-username-input"
	                        className="h-9"
	                      />
	                    </div>
	                    <div className="space-y-2">
	                      <Label htmlFor="ssh-password" className="text-sm font-medium text-slate-700">SSH Password (optional)</Label>
	                      <Input
	                        id="ssh-password"
	                        type="password"
	                        value={sshPassword}
	                        onChange={(e) => setSshPassword(e.target.value)}
	                        data-testid="ssh-password-input"
	                        className="h-9"
	                      />
	                    </div>
	                  </div>

	                  <div className="space-y-2">
	                    <div className="flex items-center justify-between gap-3">
	                      <Label htmlFor="ssh-private-key" className="text-sm font-medium text-slate-700">Private Key (optional)</Label>
	                      <div className="flex items-center gap-2">
	                        {sshPrivateKey && (
	                          <Button
	                            type="button"
	                            variant="ghost"
	                            size="sm"
	                            onClick={handleClearPrivateKey}
	                            className="h-7 px-2 text-slate-600"
	                            data-testid="ssh-clear-private-key-btn"
	                          >
	                            <X className="w-4 h-4" />
	                            Clear
	                          </Button>
	                        )}
	                        <Button
	                          type="button"
	                          variant="outline"
	                          size="sm"
	                          onClick={() => privateKeyFileInputRef.current?.click()}
	                          className="h-7 px-2"
	                          data-testid="ssh-private-key-file-btn"
	                        >
	                          <FileKey className="w-4 h-4" />
	                          Choose Key
	                        </Button>
	                      </div>
	                    </div>
	                    <input
	                      ref={privateKeyFileInputRef}
	                      type="file"
	                      className="hidden"
	                      onChange={handlePrivateKeyFileChange}
	                      data-testid="ssh-private-key-file-input"
	                    />
	                    {sshPrivateKeyFileName && (
	                      <div className="truncate rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
	                        {sshPrivateKeyFileName}
	                      </div>
	                    )}
	                    <Textarea
	                      id="ssh-private-key"
	                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
	                      value={sshPrivateKey}
	                      onChange={(e) => {
	                        setSshPrivateKey(e.target.value);
	                        setSshPrivateKeyFileName('');
	                      }}
	                      data-testid="ssh-private-key-input"
	                      className="min-h-28 font-mono text-xs"
	                    />
	                  </div>

	                  <div className="space-y-2">
	                    <Label htmlFor="ssh-passphrase" className="text-sm font-medium text-slate-700">Private Key Passphrase (if needed)</Label>
	                    <Input
	                      id="ssh-passphrase"
	                      type="password"
	                      value={sshPassphrase}
	                      onChange={(e) => setSshPassphrase(e.target.value)}
	                      data-testid="ssh-passphrase-input"
	                      className="h-9"
	                    />
	                  </div>
	                </div>
	              )}

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
	                        {conn.connectionType === 'ssh' && (
	                          <div className="text-xs text-orange-600 mt-1">
	                            SSH: {conn.sshUsername}@{conn.sshHost}:{conn.sshPort || 22}
	                          </div>
	                        )}
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
	                      {conn.connectionType === 'ssh' && (
	                        <div className="text-xs text-orange-600 mt-1">
	                          SSH: {conn.sshUsername}@{conn.sshHost}:{conn.sshPort || 22}
	                        </div>
	                      )}
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
