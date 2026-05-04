import { useEffect, useState } from 'react';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import ConnectionScreen from '@/components/ConnectionScreen';
import TabManager from '@/components/TabManager';
import { ensureSessionStarted, trackAnalyticsEvent } from '@/lib/analytics';
import { apiUrl } from '@/lib/api';
import { isDesktopRuntime } from '@/lib/runtime';
import axios from 'axios';

function App() {
  const [connections, setConnections] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  
  // Always start with connection screen - don't auto-restore tabs
  // This ensures fresh connections with passwords

  useEffect(() => {
    if (isDesktopRuntime()) {
      return;
    }

    void ensureSessionStarted('connection-screen');
  }, []);

  useEffect(() => {
    if (isDesktopRuntime()) {
      return;
    }

    const page = connections.length === 0 ? 'connection-screen' : 'session-dashboard';
    void trackAnalyticsEvent('page_view', {
      page,
      activeConnections: connections.length,
    }, {
      entrypoint: page,
    });
  }, [connections.length]);

  const handleConnect = (connectionData) => {
    const newConnection = {
      id: Date.now().toString(),
      name: connectionData.name || connectionData.url,
      url: connectionData.url,
      targetUrl: connectionData.targetUrl || connectionData.url,
      connectionType: connectionData.connectionType || 'direct',
      tunnelId: connectionData.tunnelId || null,
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
    const connection = connections.find(c => c.id === tabId);
    if (connection?.tunnelId) {
      axios.delete(apiUrl(`/ssh/tunnels/${encodeURIComponent(connection.tunnelId)}`)).catch(() => {
        // Tunnel cleanup is best-effort when the tab is closed.
      });
    }

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
    <div className="h-screen w-screen overflow-hidden bg-white flex flex-col">
      <div className="flex-1 overflow-hidden">
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
      </div>
      <footer className="h-8 flex items-center justify-center bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        CouchDB Client by{' '}
        <a
          href="https://hasanabbas.in"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
        >
          https://hasanabbas.in
        </a>
      </footer>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
