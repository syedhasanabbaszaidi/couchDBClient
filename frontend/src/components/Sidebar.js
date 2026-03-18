import { useState, useEffect } from 'react';
import { Plus, FileJson, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Sidebar({
  selectedDocument,
  onSelectDocument,
  onNewDocument,
  database,
}) {
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
      const updated = filtered.slice(0, 20);
      localStorage.setItem(`recent_docs_${database}`, JSON.stringify(updated));
      setRecentDocuments(updated);
    }
  }, [selectedDocument, database]);

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
      <div className="p-4 border-b border-slate-200">
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
