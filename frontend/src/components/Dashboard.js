import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import axios from 'axios';
import { toast } from 'sonner';
import { apiUrl, getApiBase, shouldUseDirectCouchConnection } from '@/lib/api';
import { addRecentDocument, getTabState, saveTabState } from '@/lib/localDB';

function buildCouchPath(baseUrl, ...segments) {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, '');
  const encodedSegments = segments.map((segment) => encodeURIComponent(String(segment)));
  return `${trimmedBaseUrl}/${encodedSegments.join('/')}`;
}

// Helper function to create auth headers for direct CouchDB connection
function getAuthHeader(username, password) {
  if (username && password) {
    const credentials = `${username}:${password}`;
    const encoded = btoa(credentials);
    return { 'Authorization': `Basic ${encoded}` };
  }
  return {};
}

export default function Dashboard({ 
  connection, 
  onDisconnect, 
  onConnectionError,
  onConnectionSuccess 
}) {
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [openedDocumentsVersion, setOpenedDocumentsVersion] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const useDirect = shouldUseDirectCouchConnection(connection.url);

  // Load tab state on mount
  useEffect(() => {
    loadTabState();
    checkConnection();
    // Run once when a dashboard tab is mounted for this connection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save tab state when it changes
  useEffect(() => {
    if (connection.id) {
      saveTabState(connection.id, {
        selectedDatabase,
        selectedDocument,
      });
    }
  }, [selectedDatabase, selectedDocument, connection.id]);

  const loadTabState = async () => {
    if (connection.id) {
      try {
        const state = await getTabState(connection.id);
        if (state) {
          if (state.selectedDatabase) setSelectedDatabase(state.selectedDatabase);
          if (state.selectedDocument) setSelectedDocument(state.selectedDocument);
        }
      } catch (error) {
        console.error('Failed to load tab state:', error);
      }
    }
  };

  const checkConnection = async () => {
    try {
      if (useDirect) {
        await axios.get(connection.url, {
          headers: getAuthHeader(connection.username, connection.password),
          timeout: 5000,
        });
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available');
        }

        await axios.post(apiUrl('/couchdb/test-connection'), {
          url: connection.url,
          username: connection.username,
          password: connection.password,
        }, { timeout: 5000 });
      }
      setConnectionStatus('connected');
      onConnectionSuccess();
    } catch (error) {
      setConnectionStatus('error');
      onConnectionError();
      toast.error('Connection lost or invalid');
    }
  };

  const handleSelectDatabase = (database) => {
    if (database !== selectedDatabase) {
      setSelectedDocument(null);
      setDocumentContent(null);
      setDocumentError(null);
    }

    setSelectedDatabase(database);
  };

  // Search databases function (called by TopBar)
  const searchDatabases = async (searchQuery) => {
    try {
      if (useDirect) {
        const response = await axios.get(`${connection.url}/_all_dbs`, {
          headers: getAuthHeader(connection.username, connection.password),
        });
        const allDbs = response.data.filter(db => !db.startsWith('_'));
        onConnectionSuccess();
        return allDbs.filter(db => 
          db.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available');
        }

        const response = await axios.get(apiUrl('/couchdb/databases'), {
          params: {
            url: connection.url,
            username: connection.username,
            password: connection.password,
          },
        });
        if (response.data.success) {
          onConnectionSuccess();
          const allDbs = response.data.databases.filter(db => !db.startsWith('_'));
          return allDbs.filter(db => 
            db.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      }
    } catch (error) {
      console.error('Failed to search databases:', error);
      onConnectionError();
      toast.error('Failed to search databases - connection may be lost');
      return [];
    }
  };

  // Search documents function (called by Sidebar)
  // Uses CouchDB's startkey/endkey for efficient server-side filtering
  const searchDocuments = async (searchQuery) => {
    if (!selectedDatabase) return [];
    
    console.log('searchDocuments called with:', searchQuery, 'using startkey/endkey');
    
    try {
      if (useDirect) {
        // Use startkey/endkey for server-side "startsWith" filtering
        const params = { 
          include_docs: false, 
          startkey: JSON.stringify(searchQuery),
          endkey: JSON.stringify(searchQuery + '\ufff0'),
          limit: 100,
        };
        console.log('Direct mode params:', params);
        
        const response = await axios.get(
          buildCouchPath(connection.url, selectedDatabase, '_all_docs'),
          {
            headers: getAuthHeader(connection.username, connection.password),
            params,
          }
        );
        console.log('Search response:', response.data.rows?.length, 'results');
        return response.data.rows || [];
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available');
        }

        const response = await axios.get(apiUrl('/couchdb/documents'), {
          params: {
            url: connection.url,
            database: selectedDatabase,
            username: connection.username,
            password: connection.password,
            startkey: searchQuery,
            endkey: searchQuery + '\ufff0',
            limit: 100,
          },
        });
        if (response.data.success) {
          return response.data.data.rows || [];
        }
      }
    } catch (error) {
      console.error('Failed to search documents:', error);
      toast.error('Failed to search documents');
      return [];
    }
  };

  const loadDocument = async (docId, dbOverride = null) => {
    const targetDb = dbOverride || selectedDatabase;
    if (!targetDb) {
      toast.error('No database selected');
      return;
    }

    setSelectedDocument(docId);
    setDocumentContent(null);
    setDocumentError(null);

    if (dbOverride && dbOverride !== selectedDatabase) {
      setSelectedDatabase(dbOverride);
    }
    
    try {
      if (useDirect) {
        const response = await axios.get(
          buildCouchPath(connection.url, targetDb, docId),
          {
            headers: getAuthHeader(connection.username, connection.password),
          }
        );
        setDocumentContent(response.data);
        await addRecentDocument(targetDb, docId);
        setOpenedDocumentsVersion((version) => version + 1);
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available');
        }

        const response = await axios.get(apiUrl('/couchdb/document'), {
          params: {
            url: connection.url,
            database: targetDb,
            doc_id: docId,
            username: connection.username,
            password: connection.password,
          },
        });
        if (response.data.success) {
          setDocumentContent(response.data.document);
          await addRecentDocument(targetDb, docId);
          setOpenedDocumentsVersion((version) => version + 1);
        }
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      const message = `${docId} could not be opened`;
      setDocumentContent(null);
      setDocumentError(message);
      toast.error(message);
    }
  };

  const saveDocument = async (docId, content) => {
    try {
      if (useDirect) {
        const response = await axios.put(
          buildCouchPath(connection.url, selectedDatabase, docId),
          content,
          {
            headers: {
              ...getAuthHeader(connection.username, connection.password),
              'Content-Type': 'application/json',
            },
          }
        );
        toast.success('Document saved successfully');
        setDocumentError(null);
        setDocumentContent({ ...content, _rev: response.data.rev });
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available');
        }

        const response = await axios.put(
          apiUrl('/couchdb/document'),
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
          setDocumentError(null);
          setDocumentContent({ ...content, _rev: response.data.data.rev });
        }
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.reason || 'Failed to save document');
    }
  };

  const createDocument = async (content) => {
    try {
      if (useDirect) {
        const response = await axios.post(
          buildCouchPath(connection.url, selectedDatabase),
          content,
          {
            headers: {
              ...getAuthHeader(connection.username, connection.password),
              'Content-Type': 'application/json',
            },
          }
        );
        toast.success('Document created successfully');
        setDocumentError(null);
        loadDocument(response.data.id);
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available');
        }

        const response = await axios.post(
          apiUrl('/couchdb/document'),
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
          setDocumentError(null);
          loadDocument(response.data.data.id);
        }
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      toast.error('Failed to create document');
    }
  };

  const deleteDocument = async (docId, rev) => {
    try {
      if (useDirect) {
        await axios.delete(
          buildCouchPath(connection.url, selectedDatabase, docId),
          {
            headers: getAuthHeader(connection.username, connection.password),
            params: { rev },
          }
        );
        toast.success('Document deleted successfully');
        setSelectedDocument(null);
        setDocumentContent(null);
        setDocumentError(null);
      } else {
        const apiBase = getApiBase();
        if (!apiBase) {
          throw new Error('Local CouchDB proxy is not available');
        }

        const response = await axios.delete(apiUrl('/couchdb/document'), {
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
          setDocumentError(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" data-testid="dashboard">
      <TopBar
        selectedDatabase={selectedDatabase}
        onSelectDatabase={handleSelectDatabase}
        onSearchDatabases={searchDatabases}
        onDisconnect={onDisconnect}
        connectionUrl={connection.targetUrl || connection.url}
        connectionMode={connection.connectionType === 'ssh' ? 'SSH' : (useDirect ? 'Direct' : 'Proxy')}
        connectionStatus={connectionStatus}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          selectedDocument={selectedDocument}
          onSelectDocument={loadDocument}
          onSearchDocuments={searchDocuments}
          onSwitchDatabase={handleSelectDatabase}
          openedDocumentsVersion={openedDocumentsVersion}
          onNewDocument={() => {
            setSelectedDocument('new');
            setDocumentContent(null);
            setDocumentError(null);
          }}
          database={selectedDatabase}
        />
        <Editor
          documentData={documentContent}
          documentId={selectedDocument}
          documentError={documentError}
          onSave={saveDocument}
          onCreate={createDocument}
          onDelete={deleteDocument}
          database={selectedDatabase}
        />
      </div>
    </div>
  );
}
