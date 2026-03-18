import { useState } from 'react';
import { Database, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function TopBar({
  databases,
  selectedDatabase,
  onSelectDatabase,
  onDisconnect,
  connectionUrl,
  connectionMode,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSelect = (db) => {
    onSelectDatabase(db);
    setInputValue('');
    setOpen(false);
  };

  const handleClear = () => {
    onSelectDatabase('');
    setInputValue('');
  };

  const filteredDatabases = databases.filter(db =>
    db.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="h-14 border-b border-slate-200 flex items-center px-4 bg-white z-20 flex-shrink-0" data-testid="topbar">
      <div className="flex items-center gap-2 mr-4">
        <Database className="w-5 h-5 text-orange-600" />
        <span className="text-sm font-semibold text-slate-900 font-heading">CouchDB Client</span>
        {connectionMode && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {connectionMode}
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative w-64">
              <Input
                value={selectedDatabase || inputValue}
                onChange={(e) => {
                  if (!selectedDatabase) {
                    setInputValue(e.target.value);
                    setOpen(true);
                  }
                }}
                onFocus={() => setOpen(true)}
                placeholder="Type database name..."
                className="h-9 pr-8"
                data-testid="database-selector"
              />
              {selectedDatabase && (
                <button
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  data-testid="clear-database-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>No database found.</CommandEmpty>
                <CommandGroup>
                  {filteredDatabases.map((db) => (
                    <CommandItem
                      key={db}
                      value={db}
                      onSelect={() => handleSelect(db)}
                      data-testid={`database-option-${db}`}
                    >
                      {db}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
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
