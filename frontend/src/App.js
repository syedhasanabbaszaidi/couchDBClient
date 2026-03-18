import { useState, useEffect } from 'react';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import ConnectionScreen from '@/components/ConnectionScreen';
import TabManager from '@/components/TabManager';

function App() {
  const [connections, setConnections] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  
  useEffect(() => {
    const savedTabs = localStorage.getItem('couchdb_tabs');
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (parsed.length > 0) {
          setConnections(parsed);
          setActiveTabId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved tabs', e);
      }
    }
  }, []);

  const handleConnect = (connectionData) => {
    const newConnection = {
      id: Date.now().toString(),
      name: connectionData.name || connectionData.url,
      url: connectionData.url,
      username: connectionData.username,
      password: connectionData.password,
    };
    
    const updated = [...connections, newConnection];
    setConnections(updated);
    setActiveTabId(newConnection.id);
    
    // Save tabs (without passwords for security)
    const toSave = updated.map(c => ({
      id: c.id,
      name: c.name,
      url: c.url,
      username: c.username,
    }));
    localStorage.setItem('couchdb_tabs', JSON.stringify(toSave));
    
    // Save full connection with password temporarily
    localStorage.setItem(`connection_${newConnection.id}`, JSON.stringify(newConnection));
  };

  const handleCloseTab = (tabId) => {
    const filtered = connections.filter(c => c.id !== tabId);
    setConnections(filtered);
    
    if (activeTabId === tabId && filtered.length > 0) {
      setActiveTabId(filtered[0].id);
    } else if (filtered.length === 0) {
      setActiveTabId(null);
    }
    
    const toSave = filtered.map(c => ({
      id: c.id,
      name: c.name,
      url: c.url,
      username: c.username,
    }));
    localStorage.setItem('couchdb_tabs', JSON.stringify(toSave));
    localStorage.removeItem(`connection_${tabId}`);
  };

  const handleSwitchTab = (tabId) => {
    setActiveTabId(tabId);
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
        />
      )}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
