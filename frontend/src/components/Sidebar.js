import { useState, useEffect, useRef } from 'react';
import { Plus, FileJson, Clock, Search } from 'lucide-react';
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
import { getRecentDocuments, addRecentDocument } from '@/lib/localDB';

export default function Sidebar({
  selectedDocument,
  onSelectDocument,
  onSearchDocuments,
  onNewDocument,
  database,
}) {
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (database) {
      loadRecentDocuments();
    }
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
    if (!database) return;
    try {
      const recent = await getRecentDocuments(database);
      setRecentDocuments(recent || []);
    } catch (error) {
      console.error('Failed to load recent documents:', error);
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
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await onSearchDocuments(value);
      setSearchResults(results || []);
      setIsSearching(false);
      setSearchOpen(true);
    }, 3000);
  };

  const handleSelectFromSearch = (docId) => {
    onSelectDocument(docId);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
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
                placeholder="Search documents by ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={() => searchInputRef.current?.focus()}
                className="pl-9 h-9 bg-white"
                data-testid="search-documents-input"
                autoComplete="off"
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
                {searchResults.length === 0 ? (
                  <CommandEmpty>No documents found. Keep typing...</CommandEmpty>
                ) : (
                  <CommandGroup>
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
            <div className="flex items-center gap-1 px-2 py-2 mb-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recently Opened</span>
            </div>
            <div className="space-y-1">
              {recentDocuments.map((docId) => (
                <button
                  key={docId}
                  onClick={() => onSelectDocument(docId)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-all ${
                    selectedDocument === docId
                      ? 'bg-blue-50 text-blue-900 shadow-sm border border-blue-200 font-medium'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                  data-testid={`recent-doc-${docId}`}
                >
                  <FileJson className={`w-4 h-4 flex-shrink-0 ${
                    selectedDocument === docId ? 'text-blue-600' : ''
                  }`} />
                  <span className="truncate font-mono text-xs">{docId}</span>
                </button>
              ))}
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
