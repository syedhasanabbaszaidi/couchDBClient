// Local database wrapper using IndexedDB
// Works in both web browsers and Electron apps

const DB_NAME = 'couchdb_client_db';
const DB_VERSION = 1;

let db = null;

const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Store for saved connections
      if (!database.objectStoreNames.contains('connections')) {
        database.createObjectStore('connections', { keyPath: 'id' });
      }

      // Store for recent connections
      if (!database.objectStoreNames.contains('recent_connections')) {
        const store = database.createObjectStore('recent_connections', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store for recent databases per connection
      if (!database.objectStoreNames.contains('recent_databases')) {
        const store = database.createObjectStore('recent_databases', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store for recent documents per database
      if (!database.objectStoreNames.contains('recent_documents')) {
        const store = database.createObjectStore('recent_documents', { keyPath: 'id', autoIncrement: true });
        store.createIndex('database', 'database', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store for tab states
      if (!database.objectStoreNames.contains('tab_states')) {
        database.createObjectStore('tab_states', { keyPath: 'tabId' });
      }
    };
  });
};

// Generic operations
const getAll = async (storeName) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const get = async (storeName, key) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const put = async (storeName, data) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteRecord = async (storeName, key) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Saved connections
export const getSavedConnections = () => getAll('connections');
export const saveConnection = (connection) => put('connections', connection);
export const deleteSavedConnection = (id) => deleteRecord('connections', id);

// Recent connections (last 5)
export const getRecentConnections = async () => {
  const all = await getAll('recent_connections');
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
};

export const addRecentConnection = async (connection) => {
  const existing = await getAll('recent_connections');
  const filtered = existing.filter(c => c.url !== connection.url);
  
  await put('recent_connections', {
    ...connection,
    timestamp: Date.now(),
  });

  // Keep only last 5
  const all = await getRecentConnections();
  if (all.length > 5) {
    const toDelete = all.slice(5);
    for (const item of toDelete) {
      await deleteRecord('recent_connections', item.id);
    }
  }
};

// Recent databases (last 10)
export const getRecentDatabases = async () => {
  const all = await getAll('recent_databases');
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
};

export const addRecentDatabase = async (database) => {
  const existing = await getAll('recent_databases');
  
  // Remove existing entry for this database
  const toDelete = existing.filter(d => d.name === database);
  for (const item of toDelete) {
    await deleteRecord('recent_databases', item.id);
  }

  await put('recent_databases', {
    name: database,
    timestamp: Date.now(),
  });

  // Keep only last 10
  const all = await getRecentDatabases();
  if (all.length > 10) {
    const toDeleteItems = all.slice(10);
    for (const item of toDeleteItems) {
      await deleteRecord('recent_databases', item.id);
    }
  }
};

// Recent documents per database (last 20)
export const getRecentDocuments = async (database) => {
  const all = await getAll('recent_documents');
  return all
    .filter(d => d.database === database)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
    .map(d => d.docId);
};

export const addRecentDocument = async (database, docId) => {
  const existing = await getAll('recent_documents');
  
  // Remove existing entry for this document in this database
  const toDelete = existing.filter(d => d.database === database && d.docId === docId);
  for (const item of toDelete) {
    await deleteRecord('recent_documents', item.id);
  }

  await put('recent_documents', {
    database,
    docId,
    timestamp: Date.now(),
  });

  // Keep only last 20 per database
  const allForDb = await getRecentDocuments(database);
  if (allForDb.length > 20) {
    const allRecords = await getAll('recent_documents');
    const toDeleteItems = allRecords
      .filter(d => d.database === database)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(20);
    for (const item of toDeleteItems) {
      await deleteRecord('recent_documents', item.id);
    }
  }
};

// Tab states (selected database, open document)
export const getTabState = (tabId) => get('tab_states', tabId);
export const saveTabState = (tabId, state) => put('tab_states', { tabId, ...state });
export const deleteTabState = (tabId) => deleteRecord('tab_states', tabId);

export default {
  initDB,
  getSavedConnections,
  saveConnection,
  deleteSavedConnection,
  getRecentConnections,
  addRecentConnection,
  getRecentDatabases,
  addRecentDatabase,
  getRecentDocuments,
  addRecentDocument,
  getTabState,
  saveTabState,
  deleteTabState,
};
