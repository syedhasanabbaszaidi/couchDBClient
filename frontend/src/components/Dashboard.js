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

export default function Dashboard({ connection, onDisconnect }) {
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const useDirect = isLocalhost(connection.url);

  // Search databases function (called by TopBar)
  const searchDatabases = async (searchQuery) => {
    try {
      if (useDirect) {
        const response = await axios.get(`${connection.url}/_all_dbs`, {
          headers: getAuthHeader(connection.username, connection.password),
        });
        const allDbs = response.data.filter(db => !db.startsWith('_'));
        // Filter by search query
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
          const allDbs = response.data.databases.filter(db => !db.startsWith('_'));
          return allDbs.filter(db => 
            db.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      }
    } catch (error) {
      console.error('Failed to search databases:', error);
      toast.error('Failed to search databases');
      return [];
    }
  };

  const loadDocument = async (docId) => {
    try {
      if (useDirect) {
        const response = await axios.get(
          `${connection.url}/${selectedDatabase}/${docId}`,
          {
            headers: getAuthHeader(connection.username, connection.password),
          }
        );
        setDocumentContent(response.data);
        setSelectedDocument(docId);
      } else {
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
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          selectedDocument={selectedDocument}
          onSelectDocument={loadDocument}
          onNewDocument={() => {
            setSelectedDocument('new');
            setDocumentContent(null);
          }}
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
