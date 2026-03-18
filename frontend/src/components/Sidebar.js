import { useState, useEffect } from 'react';
import { Search, Plus, FileJson, RotateCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function Sidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  onNewDocument,
  loading,
  onRefresh,
  database,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState([]);

  useEffect(() => {
    if (database) {
      const recent = JSON.parse(localStorage.getItem(`recent_docs_${database}`) || '[]');
      setRecentDocuments(recent);
    }
  }, [database]);

  useEffect(() => {
    if (selectedDocument && selectedDocument !== 'new' && database) {
      const recent = JSON.parse(localStorage.getItem(`recent_docs_${database}`) || '[]');
      const filtered = recent.filter(id => id !== selectedDocument);
      filtered.unshift(selectedDocument);
      const updated = filtered.slice(0, 10);
      localStorage.setItem(`recent_docs_${database}`, JSON.stringify(updated));
      setRecentDocuments(updated);
    }
  }, [selectedDocument, database]);

  const filteredDocuments = documents.filter((doc) =>
    doc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFromSearch = (docId) => {
    onSelectDocument(docId);
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0" data-testid="sidebar">
      <div className="p-4 border-b border-slate-200 space-y-3">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                className="pl-9 h-9 bg-white"
                data-testid="search-documents-input"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>No documents found.</CommandEmpty>
                <CommandGroup heading="Search Results">
                  {filteredDocuments.slice(0, 10).map((doc) => (
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
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex gap-2">
          <Button
            onClick={onNewDocument}
            className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white text-sm"
            data-testid="new-document-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Document
          </Button>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="h-9 px-3"
            data-testid="refresh-documents-btn"
            disabled={loading}
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {recentDocuments.length > 0 && (
          <div className="p-2 border-b border-slate-200">
            <div className="flex items-center gap-1 px-2 py-1 mb-1">
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
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-medium'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                  data-testid={`recent-doc-${docId}`}
                >
                  <FileJson className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-mono text-xs">{docId}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-2">
          <div className="px-2 py-1 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">All Documents</span>
          </div>
          {loading ? (
            <div className="text-center py-8 text-sm text-slate-500">Loading...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              {searchQuery ? 'No documents found' : 'No documents'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-all ${
                    selectedDocument === doc.id
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-medium'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                  data-testid={`document-item-${doc.id}`}
                >
                  <FileJson className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-mono text-xs">{doc.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
