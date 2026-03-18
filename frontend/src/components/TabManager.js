import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import ConnectionScreen from '@/components/ConnectionScreen';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function TabManager({ connections, activeTabId, onSwitchTab, onCloseTab, onNewConnection }) {
  const [showNewConnection, setShowNewConnection] = useState(false);

  const activeConnection = connections.find(c => c.id === activeTabId);

  const handleNewConnection = (data) => {
    onNewConnection(data);
    setShowNewConnection(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="h-10 bg-slate-900 flex items-center px-2 gap-1 flex-shrink-0">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className={`group flex items-center gap-2 px-3 h-8 rounded-t-md cursor-pointer transition-colors ${
              activeTabId === conn.id
                ? 'bg-white text-slate-900'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            data-testid={`tab-${conn.id}`}
          >
            <button
              onClick={() => onSwitchTab(conn.id)}
              className="text-xs font-medium truncate max-w-32"
            >
              {conn.name}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(conn.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
              data-testid={`close-tab-${conn.id}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <Dialog open={showNewConnection} onOpenChange={setShowNewConnection}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700"
              data-testid="new-connection-tab-btn"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <ConnectionScreen onConnect={handleNewConnection} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeConnection && (
          <Dashboard
            key={activeConnection.id}
            connection={activeConnection}
            onDisconnect={() => onCloseTab(activeConnection.id)}
          />
        )}
      </div>
    </div>
  );
}
