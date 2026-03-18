import { useState, useEffect, useRef } from 'react';
import { Database, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { getRecentDatabases, addRecentDatabase } from '@/lib/localDB';

export default function TopBar({
  selectedDatabase,
  onSelectDatabase,
  onSearchDatabases,
  onDisconnect,
  connectionUrl,
  connectionMode,
  connectionStatus,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentDatabases, setRecentDatabases] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadRecentDatabases();
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadRecentDatabases = async () => {
    try {
      const recent = await getRecentDatabases();
      setRecentDatabases(recent.map(r => r.name));
    } catch (error) {
      console.error('Failed to load recent databases:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // If user is typing/deleting and database is selected, clear it
    if (selectedDatabase) {
      onSelectDatabase('');
    }
    
    setInputValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setOpen(true); // Show recents even when empty
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await onSearchDatabases(value);
      setSearchResults(results || []);
      setIsSearching(false);
      setOpen(true);
    }, 3000);
  };

  const handleSelect = async (db) => {
    onSelectDatabase(db);
    await addRecentDatabase(db);
    await loadRecentDatabases();
    setInputValue('');
    setSearchResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onSelectDatabase('');
    setInputValue('');
    setSearchResults([]);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFocus = () => {
    // Always show recents on focus
    setOpen(true);
  };

  const handleClick = () => {
    // Immediately focus and show recents
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      );
    }
    setOpen(true);
  };

  const handleKeyDown = (e) => {
    // Allow backspace to work properly
    if (e.key === 'Backspace' && selectedDatabase) {
      e.preventDefault();
      onSelectDatabase('');
      setInputValue('');
    }
  };

  const displayValue = selectedDatabase || inputValue;

  const getStatusColor = () => {
    if (connectionStatus === 'connected') return 'bg-green-500';
    if (connectionStatus === 'error') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getStatusTitle = () => {
    if (connectionStatus === 'connected') return 'Connected';
    if (connectionStatus === 'error') return 'Disconnected';
    return 'Checking connection...';
  };

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
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-64">
                <Input
                  ref={inputRef}
                  value={displayValue}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                  onMouseDown={(e) => {
                    if (inputRef.current !== document.activeElement) {
                      e.preventDefault();
                      inputRef.current?.focus();
                    }
                  }}
                  placeholder="Type database name..."
                  className="h-9 pr-8"
                  data-testid="database-selector"
                  autoComplete="off"
                />
                {selectedDatabase && (
                  <button
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                    data-testid="clear-database-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isSearching && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandList>
                  {searchResults.length > 0 ? (
                    <>
                      <CommandGroup heading="Search Results">
                        {searchResults.map((db) => (
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
                      {recentDatabases.length > 0 && <CommandSeparator />}
                    </>
                  ) : (
                    inputValue && <CommandEmpty>No database found. Keep typing...</CommandEmpty>
                  )}
                  
                  {recentDatabases.length > 0 && !inputValue && (
                    <CommandGroup heading={<span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Recently Opened</span>}>
                      {recentDatabases.map((db) => (
                        <CommandItem
                          key={db}
                          value={db}
                          onSelect={() => handleSelect(db)}
                          data-testid={`recent-database-${db}`}
                          className="font-mono text-xs"
                        >
                          {db}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div 
            className={`w-3 h-3 rounded-full ${getStatusColor()} shadow-sm`}
            title={getStatusTitle()}
            data-testid="connection-status-indicator"
          />
        </div>
        
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
