import { Database, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TopBar({
  databases,
  selectedDatabase,
  onSelectDatabase,
  onDisconnect,
  connectionUrl,
}) {
  return (
    <div className="h-14 border-b border-slate-200 flex items-center px-4 bg-white z-10 flex-shrink-0" data-testid="topbar">
      <div className="flex items-center gap-2 mr-4">
        <Database className="w-5 h-5 text-orange-600" />
        <span className="text-sm font-semibold text-slate-900 font-heading">CouchDB Client</span>
      </div>

      <div className="flex-1 flex items-center gap-3">
        <Select value={selectedDatabase} onValueChange={onSelectDatabase}>
          <SelectTrigger className="w-64 h-9 border-slate-200" data-testid="database-selector">
            <SelectValue placeholder="Select database" />
          </SelectTrigger>
          <SelectContent>
            {databases.map((db) => (
              <SelectItem key={db} value={db} data-testid={`database-option-${db}`}>
                {db}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="text-xs text-slate-500 font-mono">{connectionUrl}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDisconnect}
        className="h-9 text-slate-600 hover:text-slate-900"
        data-testid="disconnect-btn"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Disconnect
      </Button>
    </div>
  );
}
