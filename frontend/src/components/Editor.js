import { useState, useEffect } from 'react';
import { Save, RotateCw, Trash2, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { JsonView, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Editor({
  documentData,
  documentId,
  onSave,
  onCreate,
  onDelete,
  database,
}) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const [viewMode, setViewMode] = useState('formatted');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalDeleteDialog, setShowFinalDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (documentData) {
      const formatted = JSON.stringify(documentData, null, 2);
      setContent(formatted);
      setOriginalContent(formatted);
      setParsedJson(documentData);
      setIsValid(true);
    } else if (documentId === 'new') {
      const newDoc = { "_id": generateUUID() };
      const formatted = JSON.stringify(newDoc, null, 2);
      setContent(formatted);
      setOriginalContent('');
      setParsedJson(newDoc);
      setIsValid(true);
    } else {
      setContent('');
      setOriginalContent('');
      setParsedJson(null);
    }
  }, [documentData, documentId]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    try {
      const parsed = JSON.parse(newContent);
      setParsedJson(parsed);
      setIsValid(true);
    } catch (error) {
      setParsedJson(null);
      setIsValid(false);
    }
  };

  const handleSave = () => {
    if (!isValid) {
      toast.error('Invalid JSON format');
      return;
    }

    try {
      const parsed = JSON.parse(content);
      if (documentId === 'new') {
        onCreate(parsed);
      } else {
        onSave(documentId, parsed);
      }
    } catch (error) {
      toast.error('Failed to parse JSON');
    }
  };

  const handleRevert = () => {
    setContent(originalContent);
    try {
      setParsedJson(JSON.parse(originalContent));
      setIsValid(true);
    } catch (e) {
      setParsedJson(null);
    }
    toast.info('Changes reverted');
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleFirstConfirm = () => {
    setShowDeleteDialog(false);
    setShowFinalDeleteDialog(true);
  };

  const handleFinalDelete = () => {
    if (documentData && documentData._rev) {
      onDelete(documentId, documentData._rev);
      setShowFinalDeleteDialog(false);
    }
  };

  const handleCopyDocument = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      toast.success('Document JSON copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy document');
    }
  };

  const handleDownload = () => {
    try {
      if (!content || content.trim() === '') {
        toast.error('No content to download');
        return;
      }

      const parsed = JSON.parse(content);
      const jsonString = JSON.stringify(parsed, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${documentId || 'document'}.json`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document: ' + error.message);
    }
  };

  const hasChanges = content !== originalContent;

  if (!documentId) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center" data-testid="editor-empty">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Select a document to view or edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col relative overflow-hidden" data-testid="editor">
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {database}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-mono text-slate-900">
            {documentId === 'new' ? 'New Document' : documentId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode('formatted')}
              className={`px-3 py-1 text-xs font-medium ${
                viewMode === 'formatted'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Formatted
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-xs font-medium border-l border-slate-200 ${
                viewMode === 'raw'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Raw JSON
            </button>
          </div>

          {documentId !== 'new' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-9 text-slate-600 hover:text-slate-900"
                data-testid="download-btn"
                title="Download JSON file"
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="text-xs">Download</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyDocument}
                className="h-9 text-slate-600 hover:text-slate-900"
                data-testid="copy-document-btn"
                title="Copy entire document JSON"
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                <span className="text-xs">Copy JSON</span>
              </Button>
            </>
          )}
          
          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRevert}
              className="h-9 text-slate-600 hover:text-slate-900"
              data-testid="revert-btn"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Revert
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={!hasChanges || !isValid}
            className="h-9 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg"
            data-testid="save-document-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {documentId !== 'new' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="delete-document-btn"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'formatted' && parsedJson && isValid ? (
          <div className="bg-slate-50 p-4 rounded-md">
            <JsonView 
              data={parsedJson} 
              shouldExpandNode={() => true}
              style={{
                ...defaultStyles,
                container: 'font-mono text-sm',
                label: 'text-blue-600 font-semibold cursor-pointer',
                nullValue: 'text-slate-400',
                undefinedValue: 'text-slate-400',
                stringValue: 'text-green-600',
                booleanValue: 'text-purple-600',
                numberValue: 'text-orange-600',
                otherValue: 'text-slate-600',
                punctuation: 'text-slate-400',
                collapseIcon: 'cursor-pointer select-none text-slate-900 hover:text-blue-600 font-bold',
                expandIcon: 'cursor-pointer select-none text-slate-900 hover:text-blue-600 font-bold',
              }}
            />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            className={`w-full h-full font-mono text-sm leading-6 border-none outline-none resize-none p-4 rounded-md ${
              isValid ? 'bg-slate-50' : 'bg-red-50 border border-red-200'
            }`}
            placeholder="Enter JSON document..."
            spellCheck={false}
            data-testid="json-editor-textarea"
          />
        )}
      </div>

      {documentData && documentData._rev && (
        <div className="h-8 border-t border-slate-200 flex items-center px-4 bg-slate-50 flex-shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            Rev: {documentData._rev}
          </span>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document?
              <br />
              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded mt-2 inline-block">
                {documentId}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFirstConfirm}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="delete-first-confirm-btn"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFinalDeleteDialog} onOpenChange={setShowFinalDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">⚠️ Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">This action cannot be undone!</span>
              <br />
              <br />
              The document will be permanently deleted from the database.
              <br />
              <br />
              Document: <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{documentId}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-final-cancel-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="delete-final-confirm-btn"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
