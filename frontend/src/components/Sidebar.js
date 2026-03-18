import { useState } from 'react';
import { Search, Plus, FileJson, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Sidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  onNewDocument,
  loading,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = documents.filter((doc) =>
    doc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0" data-testid="sidebar">
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white"
            data-testid="search-documents-input"
          />
        </div>
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
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-sm text-slate-500">Loading...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              {searchQuery ? 'No documents found' : 'No documents'}
            </div>
          ) : (
            filteredDocuments.map((doc) => (
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
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
