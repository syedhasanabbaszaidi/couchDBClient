import { useState, useEffect, useRef } from 'react';
import { Database, LogOut, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductActions from '@/components/ProductActions';
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
import {
  getRecentDatabases,
  addRecentDatabase,
  getFavoriteBuckets,
  isFavoriteBucket,
  toggleFavoriteBucket,
} from '@/lib/localDB';

function keepInputFocus(event) {
  event.preventDefault();
}

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
  const [favoriteBuckets, setFavoriteBuckets] = useState([]);
  const [selectedIsFavorite, setSelectedIsFavorite] = useState(false);
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

  useEffect(() => {
    if (selectedDatabase) {
      setInputValue(selectedDatabase);
    }
  }, [selectedDatabase]);

  useEffect(() => {
    loadFavoriteBuckets();
    // Refresh only when the active CouchDB connection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionUrl]);

  useEffect(() => {
    refreshSelectedFavoriteState();
    // Refresh only when the selected bucket or connection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionUrl, selectedDatabase]);

  const loadRecentDatabases = async () => {
    try {
      const recent = await getRecentDatabases();
      setRecentDatabases(recent.map(r => r.name));
    } catch (error) {
      console.error('Failed to load recent databases:', error);
    }
  };

  const loadFavoriteBuckets = async () => {
    if (!connectionUrl) {
      setFavoriteBuckets([]);
      return;
    }

    try {
      const favorites = await getFavoriteBuckets(connectionUrl);
      setFavoriteBuckets(favorites || []);
    } catch (error) {
      console.error('Failed to load favourite buckets:', error);
    }
  };

  const refreshSelectedFavoriteState = async () => {
    if (!connectionUrl || !selectedDatabase) {
      setSelectedIsFavorite(false);
      return;
    }

    try {
      setSelectedIsFavorite(await isFavoriteBucket(connectionUrl, selectedDatabase));
    } catch (error) {
      console.error('Failed to check favourite bucket:', error);
      setSelectedIsFavorite(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    setInputValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setOpen(true); // Show recents even when empty
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await onSearchDatabases(value);
      setSearchResults(results || []);
      setIsSearching(false);
      setOpen(true);
    }, 500); // Reduced from 3000ms to 500ms for faster feedback
  };

  const handleSelect = async (db) => {
    // Close dropdown and clear input immediately for better UX
    setOpen(false);
    setInputValue(db);
    setSearchResults([]);
    setIsSearching(false);
    
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Select the database (this triggers the load)
    onSelectDatabase(db);
    
    // Update recent databases in background
    addRecentDatabase(db).then(() => loadRecentDatabases());
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
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!connectionUrl || !selectedDatabase) {
      return;
    }

    try {
      const isFavorite = await toggleFavoriteBucket(connectionUrl, selectedDatabase);
      setSelectedIsFavorite(isFavorite);
      await loadFavoriteBuckets();
    } catch (error) {
      console.error('Failed to update favourite bucket:', error);
    }
  };

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
                  value={inputValue}
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
                {(selectedDatabase || inputValue) && (
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
            <PopoverContent
              className="w-64 p-0"
              align="start"
              onOpenAutoFocus={keepInputFocus}
              onCloseAutoFocus={keepInputFocus}
            >
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

          {selectedDatabase && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`h-9 max-w-56 inline-flex items-center gap-2 rounded-md border px-3 text-xs font-mono transition-colors ${
                selectedIsFavorite
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title={selectedIsFavorite ? 'Remove from favourite buckets' : 'Add to favourite buckets'}
              data-testid="toggle-favorite-bucket-btn"
            >
              <Star className={`h-4 w-4 ${selectedIsFavorite ? 'fill-current' : ''}`} />
              <span className="truncate">{selectedDatabase}</span>
            </button>
          )}

          <select
            value=""
            onChange={(event) => {
              if (event.target.value) {
                handleSelect(event.target.value);
              }
            }}
            className="h-9 w-48 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            data-testid="favorite-buckets-select"
          >
            <option value="">Favourite Buckets</option>
            {favoriteBuckets.map((bucket) => (
              <option key={bucket.id} value={bucket.name}>
                {bucket.name}
              </option>
            ))}
          </select>

          <div 
            className={`w-3 h-3 rounded-full ${getStatusColor()} shadow-sm`}
            title={getStatusTitle()}
            data-testid="connection-status-indicator"
          />
        </div>
        
        <span className="text-xs text-slate-500 font-mono">{connectionUrl}</span>
      </div>

      <div className="flex items-center gap-2">
        <ProductActions entrypointPrefix="topbar" compact />
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
    </div>
  );
}
