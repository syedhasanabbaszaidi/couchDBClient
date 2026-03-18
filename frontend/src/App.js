import { useState } from 'react';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import ConnectionScreen from '@/components/ConnectionScreen';
import TabManager from '@/components/TabManager';

function App() {
  const [connections, setConnections] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  
  // Always start with connection screen - don't auto-restore tabs
  // This ensures fresh connections with passwords

  const handleConnect = (connectionData) => {
    const newConnection = {
      id: Date.now().toString(),
      name: connectionData.name || connectionData.url,
      url: connectionData.url,
      username: connectionData.username,
      password: connectionData.password,
      connectedAt: new Date().toISOString(),
      isActive: true,
    };
    
    const updated = [...connections, newConnection];
    setConnections(updated);
    setActiveTabId(newConnection.id);
  };

  const handleCloseTab = (tabId) => {
    const filtered = connections.filter(c => c.id !== tabId);
    setConnections(filtered);
    
    if (activeTabId === tabId && filtered.length > 0) {
      setActiveTabId(filtered[0].id);
    } else if (filtered.length === 0) {
      setActiveTabId(null);
    }
  };

  const handleSwitchTab = (tabId) => {
    setActiveTabId(tabId);
  };

  const handleConnectionError = (tabId) => {
    // Mark connection as inactive when error occurs
    setConnections(prev => prev.map(conn => 
      conn.id === tabId ? { ...conn, isActive: false } : conn
    ));
  };

  const handleConnectionSuccess = (tabId) => {
    // Mark connection as active when successful
    setConnections(prev => prev.map(conn => 
      conn.id === tabId ? { ...conn, isActive: true } : conn
    ));
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      {connections.length === 0 ? (
        <ConnectionScreen onConnect={handleConnect} />
      ) : (
        <TabManager
          connections={connections}
          activeTabId={activeTabId}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onNewConnection={handleConnect}
          onConnectionError={handleConnectionError}
          onConnectionSuccess={handleConnectionSuccess}
        />
      )}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
