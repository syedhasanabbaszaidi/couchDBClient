import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to create auth headers for direct CouchDB connection
function getAuthHeader(username, password) {
  if (username && password) {
    const credentials = `${username}:${password}`;
    const encoded = btoa(credentials);
    return { 'Authorization': `Basic ${encoded}` };
  }
  return {};
}

// Check if URL is localhost/127.0.0.1 (direct connection needed)
function isLocalhost(url) {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

import { getTabState, saveTabState } from '@/lib/localDB';

export default function Dashboard({ 
  connection, 
  onDisconnect, 
  onConnectionError,
  onConnectionSuccess 
}) {
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const useDirect = isLocalhost(connection.url);

  // Load tab state on mount
  useEffect(() => {
    loadTabState();
    checkConnection();
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
        await axios.post(`${API}/couchdb/test-connection`, {
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
        const response = await axios.get(`${API}/couchdb/databases`, {
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
          `${connection.url}/${selectedDatabase}/_all_docs`,
          {
            headers: getAuthHeader(connection.username, connection.password),
            params,
          }
        );
        console.log('Search response:', response.data.rows?.length, 'results');
        return response.data.rows || [];
      } else {
        const response = await axios.get(`${API}/couchdb/documents`, {
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
    
    try {
      if (useDirect) {
        const response = await axios.get(
          `${connection.url}/${targetDb}/${docId}`,
          {
            headers: getAuthHeader(connection.username, connection.password),
          }
        );
        setDocumentContent(response.data);
        setSelectedDocument(docId);
        // Update selected database if loading from different db
        if (dbOverride && dbOverride !== selectedDatabase) {
          setSelectedDatabase(dbOverride);
        }
      } else {
        const response = await axios.get(`${API}/couchdb/document`, {
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
          setSelectedDocument(docId);
          // Update selected database if loading from different db
          if (dbOverride && dbOverride !== selectedDatabase) {
            setSelectedDatabase(dbOverride);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.error('Failed to load document');
    }
  };

  const saveDocument = async (docId, content) => {
    try {
      if (useDirect) {
        const response = await axios.put(
          `${connection.url}/${selectedDatabase}/${docId}`,
          content,
          {
            headers: {
              ...getAuthHeader(connection.username, connection.password),
              'Content-Type': 'application/json',
            },
          }
        );
        toast.success('Document saved successfully');
        setDocumentContent({ ...content, _rev: response.data.rev });
      } else {
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
          `${connection.url}/${selectedDatabase}`,
          content,
          {
            headers: {
              ...getAuthHeader(connection.username, connection.password),
              'Content-Type': 'application/json',
            },
          }
        );
        toast.success('Document created successfully');
        loadDocument(response.data.id);
      } else {
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
          `${connection.url}/${selectedDatabase}/${docId}?rev=${rev}`,
          {
            headers: getAuthHeader(connection.username, connection.password),
          }
        );
        toast.success('Document deleted successfully');
        setSelectedDocument(null);
        setDocumentContent(null);
      } else {
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
        onSelectDatabase={setSelectedDatabase}
        onSearchDatabases={searchDatabases}
        onDisconnect={onDisconnect}
        connectionUrl={connection.url}
        connectionMode={useDirect ? 'Direct' : 'Proxy'}
        connectionStatus={connectionStatus}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          selectedDocument={selectedDocument}
          onSelectDocument={loadDocument}
          onSearchDocuments={searchDocuments}
          onSwitchDatabase={setSelectedDatabase}
          onNewDocument={() => {
            setSelectedDocument('new');
            setDocumentContent(null);
          }}
          database={selectedDatabase}
        />
        <Editor
          documentData={documentContent}
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
