import { useState, useEffect, useRef } from 'react';
import { Plus, FileJson, Clock, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { getRecentDocuments, getAllRecentDocuments, addRecentDocument, clearRecentDocuments } from '@/lib/localDB';

export default function Sidebar({
  selectedDocument,
  onSelectDocument,
  onSearchDocuments,
  onNewDocument,
  database,
  onSwitchDatabase,
}) {
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadRecentDocuments();
    // Clear search when database changes
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [database]);

  useEffect(() => {
    if (selectedDocument && selectedDocument !== 'new' && database) {
      addRecentDocument(database, selectedDocument).then(() => {
        loadRecentDocuments();
      });
    }
  }, [selectedDocument, database]);

  const loadRecentDocuments = async () => {
    try {
      // Load ALL recent documents from all databases
      const allRecent = await getAllRecentDocuments();
      console.log('All recent docs:', allRecent);
      console.log('Current database:', database);
      setRecentDocuments(allRecent || []);
    } catch (error) {
      console.error('Failed to load recent documents:', error);
    }
  };

  const handleSelectDocument = async (doc) => {
    console.log('Selected doc:', doc, 'Current DB:', database);
    // Check if document is from a different database
    if (doc.database && doc.database !== database) {
      console.log('Switching database from', database, 'to', doc.database);
      // Switch database first
      await onSwitchDatabase(doc.database);
      // Small delay to let database switch complete
      setTimeout(() => {
        onSelectDocument(doc.docId);
      }, 200);
    } else {
      onSelectDocument(doc.docId);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSearchOpen(false);
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Searching for:', value, 'in database:', database);
        const results = await onSearchDocuments(value);
        console.log('Search results:', results);
        setSearchResults(results || []);
        setIsSearching(false);
        if (results && results.length > 0) {
          setSearchOpen(true);
        } else {
          setSearchOpen(true); // Show "no results" message
        }
      } catch (error) {
        console.error('Search error:', error);
        setIsSearching(false);
        setSearchOpen(false);
      }
    }, 500); // Reduced from 1500ms to 500ms for faster feedback
  };

  const handleSelectFromSearch = (docId) => {
    onSelectDocument(docId);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const handleSearchClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.setSelectionRange(
        searchInputRef.current.value.length,
        searchInputRef.current.value.length
      );
    }
  };

  const handleClearRecentDocuments = async () => {
    try {
      await clearRecentDocuments();
      setRecentDocuments([]);
    } catch (error) {
      console.error('Failed to clear recent documents:', error);
    }
  };

  if (!database) {
    return (
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0" data-testid="sidebar">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">Select a database first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0" data-testid="sidebar">
      <div className="p-4 border-b border-slate-200 space-y-3">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={isSearching ? "Searching..." : "Search documents by ID..."}
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={handleSearchClick}
                onMouseDown={(e) => {
                  if (searchInputRef.current !== document.activeElement) {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                  }
                }}
                className="pl-9 h-9 bg-white"
                data-testid="search-documents-input"
                autoComplete="off"
                disabled={!database}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandList>
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Searching database...
                  </div>
                ) : searchResults.length === 0 ? (
                  <CommandEmpty>
                    {searchQuery ? 'No documents found matching your search.' : 'Type to search...'}
                  </CommandEmpty>
                ) : (
                  <CommandGroup heading={`Found ${searchResults.length} document(s)`}>
                    {searchResults.map((doc) => (
                      <CommandItem
                        key={doc.id}
                        value={doc.id}
                        onSelect={() => handleSelectFromSearch(doc.id)}
                        data-testid={`search-result-${doc.id}`}
                      >
                        <FileJson className="w-4 h-4 mr-2" />
                        <span className="font-mono text-xs truncate">{doc.id}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={onNewDocument}
          className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white text-sm"
          data-testid="new-document-btn"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Document
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {recentDocuments.length > 0 ? (
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-2 mb-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recently Opened</span>
              </div>
              <button
                onClick={handleClearRecentDocuments}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear recent documents"
                data-testid="clear-recent-docs-btn"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {recentDocuments.map((doc) => {
                // Always compare using strict equality to determine if doc is from a different database
                const isFromDifferentDb = doc.database !== database;
                const isSelected = selectedDocument === doc.docId && doc.database === database;
                
                return (
                <button
                  key={`${doc.database}-${doc.docId}`}
                  onClick={() => handleSelectDocument(doc)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 shadow-sm border border-blue-200 font-medium'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                  data-testid={`recent-doc-${doc.docId}`}
                >
                  <FileJson className={`w-4 h-4 flex-shrink-0 ${
                    isSelected ? 'text-blue-600' : ''
                  }`} />
                  <div className="flex-1 truncate text-left">
                    <span className="font-mono text-xs block truncate">{doc.docId}</span>
                    {isFromDifferentDb && (
                      <span className="text-xs text-orange-600 font-medium">{doc.database}</span>
                    )}
                  </div>
                  {isFromDifferentDb && (
                    <span className="text-xs text-slate-400">↗</span>
                  )}
                </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <FileJson className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No recent documents</p>
              <p className="text-xs text-slate-400 mt-1">Open documents to see them here</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
