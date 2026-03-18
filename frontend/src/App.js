import { useState, useEffect } from 'react';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import ConnectionScreen from '@/components/ConnectionScreen';
import Dashboard from '@/components/Dashboard';

function App() {
  const [connection, setConnection] = useState(null);
  
  useEffect(() => {
    const savedConnection = localStorage.getItem('couchdb_connection');
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setConnection(parsed);
      } catch (e) {
        console.error('Failed to parse saved connection', e);
      }
    }
  }, []);

  const handleConnect = (connectionData) => {
    setConnection(connectionData);
    const toSave = {
      url: connectionData.url,
      username: connectionData.username,
    };
    localStorage.setItem('couchdb_connection', JSON.stringify(toSave));
    
    const recentConnections = JSON.parse(localStorage.getItem('recent_connections') || '[]');
    const newConnection = { url: connectionData.url, username: connectionData.username };
    const filtered = recentConnections.filter(c => c.url !== newConnection.url);
    filtered.unshift(newConnection);
    localStorage.setItem('recent_connections', JSON.stringify(filtered.slice(0, 5)));
  };

  const handleDisconnect = () => {
    setConnection(null);
    localStorage.removeItem('couchdb_connection');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      {!connection ? (
        <ConnectionScreen onConnect={handleConnect} />
      ) : (
        <Dashboard connection={connection} onDisconnect={handleDisconnect} />
      )}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
