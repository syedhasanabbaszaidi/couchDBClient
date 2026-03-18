import { useState, useEffect } from 'react';
import { Save, RotateCw, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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

export default function Editor({
  document,
  documentId,
  onSave,
  onCreate,
  onDelete,
  database,
}) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (document) {
      const formatted = JSON.stringify(document, null, 2);
      setContent(formatted);
      setOriginalContent(formatted);
      setIsValid(true);
    } else {
      setContent('');
      setOriginalContent('');
    }
  }, [document]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    try {
      JSON.parse(newContent);
      setIsValid(true);
    } catch (error) {
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
    setIsValid(true);
    toast.info('Changes reverted');
  };

  const handleDelete = () => {
    if (document && document._rev) {
      onDelete(documentId, document._rev);
      setShowDeleteDialog(false);
    }
  };

  const handleCopyId = () => {
    if (documentId && documentId !== 'new') {
      navigator.clipboard.writeText(documentId);
      setCopied(true);
      toast.success('Document ID copied');
      setTimeout(() => setCopied(false), 2000);
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
          {documentId !== 'new' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyId}
              className="h-9 text-slate-600 hover:text-slate-900"
              data-testid="copy-id-btn"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
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
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white"
            data-testid="save-document-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {documentId !== 'new' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="delete-document-btn"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
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
      </div>

      {document && document._rev && (
        <div className="h-8 border-t border-slate-200 flex items-center px-4 bg-slate-50 flex-shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            Rev: {document._rev}
          </span>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="delete-confirm-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
