import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ connection, onDisconnect }) {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDatabases();
  }, []);

  useEffect(() => {
    if (selectedDatabase) {
      loadDocuments();
    }
  }, [selectedDatabase]);

  const loadDatabases = async () => {
    try {
      const response = await axios.get(`${API}/couchdb/databases`, {
        params: {
          url: connection.url,
          username: connection.username,
          password: connection.password,
        },
      });
      if (response.data.success) {
        const dbs = response.data.databases.filter(db => !db.startsWith('_'));
        setDatabases(dbs);
        if (dbs.length > 0 && !selectedDatabase) {
          setSelectedDatabase(dbs[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load databases:', error);
      toast.error('Failed to load databases');
    }
  };

  const loadDocuments = async () => {
    if (!selectedDatabase) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/couchdb/documents`, {
        params: {
          url: connection.url,
          database: selectedDatabase,
          username: connection.username,
          password: connection.password,
          limit: 100,
        },
      });
      if (response.data.success) {
        setDocuments(response.data.data.rows || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadDocument = async (docId) => {
    try {
      const response = await axios.get(`${API}/couchdb/document`, {
        params: {
          url: connection.url,
          database: selectedDatabase,
          doc_id: docId,
          username: connection.username,
          password: connection.password,
        },
      });
      if (response.data.success) {
        setDocumentContent(response.data.document);
        setSelectedDocument(docId);
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.error('Failed to load document');
    }
  };

  const saveDocument = async (docId, content) => {
    try {
      const response = await axios.put(
        `${API}/couchdb/document`,
        { document: content },
        {
          params: {
            url: connection.url,
            database: selectedDatabase,
            doc_id: docId,
            username: connection.username,
            password: connection.password,
          },
        }
      );
      if (response.data.success) {
        toast.success('Document saved successfully');
        setDocumentContent({ ...content, _rev: response.data.data.rev });
        loadDocuments();
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      toast.error(error.response?.data?.detail || 'Failed to save document');
    }
  };

  const createDocument = async (content) => {
    try {
      const response = await axios.post(
        `${API}/couchdb/document`,
        { document: content },
        {
          params: {
            url: connection.url,
            database: selectedDatabase,
            username: connection.username,
            password: connection.password,
          },
        }
      );
      if (response.data.success) {
        toast.success('Document created successfully');
        loadDocuments();
        loadDocument(response.data.data.id);
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      toast.error('Failed to create document');
    }
  };

  const deleteDocument = async (docId, rev) => {
    try {
      const response = await axios.delete(`${API}/couchdb/document`, {
        params: {
          url: connection.url,
          database: selectedDatabase,
          doc_id: docId,
          rev: rev,
          username: connection.username,
          password: connection.password,
        },
      });
      if (response.data.success) {
        toast.success('Document deleted successfully');
        setSelectedDocument(null);
        setDocumentContent(null);
        loadDocuments();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" data-testid="dashboard">
      <TopBar
        databases={databases}
        selectedDatabase={selectedDatabase}
        onSelectDatabase={setSelectedDatabase}
        onDisconnect={onDisconnect}
        connectionUrl={connection.url}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          documents={documents}
          selectedDocument={selectedDocument}
          onSelectDocument={loadDocument}
          onNewDocument={() => {
            setSelectedDocument('new');
            setDocumentContent(null);
          }}
          loading={loading}
          onRefresh={loadDocuments}
          database={selectedDatabase}
        />
        <Editor
          document={documentContent}
          documentId={selectedDocument}
          onSave={saveDocument}
          onCreate={createDocument}
          onDelete={deleteDocument}
          database={selectedDatabase}
        />
      </div>
    </div>
  );
}
