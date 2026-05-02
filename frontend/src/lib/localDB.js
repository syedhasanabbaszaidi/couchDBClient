// Local database wrapper using IndexedDB
// Works in both web browsers and Electron apps

const DB_NAME = 'couchdb_client_db';
const DB_VERSION = 2;

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

      // Store for favourite buckets per connection
      if (!database.objectStoreNames.contains('favorite_buckets')) {
        const store = database.createObjectStore('favorite_buckets', { keyPath: 'id' });
        store.createIndex('connectionUrl', 'connectionUrl', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
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
  const documents = all
    .filter(d => d.database === database)
    .sort((a, b) => a.timestamp - b.timestamp);

  return documents
    .slice(Math.max(documents.length - 20, 0))
    .map(d => d.docId);
};

// Get ALL recent documents across all databases (for cross-database navigation)
export const getAllRecentDocuments = async () => {
  const all = await getAll('recent_documents');
  const documents = all.sort((a, b) => a.timestamp - b.timestamp);
  return documents.slice(Math.max(documents.length - 20, 0));
};

export const addRecentDocument = async (database, docId) => {
  const existing = await getAll('recent_documents');

  // Keep original opening order. Re-selecting a document should not move it.
  const alreadyOpened = existing.some(d => d.database === database && d.docId === docId);
  if (alreadyOpened) {
    return;
  }

  await put('recent_documents', {
    database,
    docId,
    timestamp: Date.now(),
  });

  // Keep only last 20 per database
  const allForDb = (await getAll('recent_documents'))
    .filter(d => d.database === database)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (allForDb.length > 20) {
    const toDeleteItems = allForDb.slice(0, allForDb.length - 20);
    for (const item of toDeleteItems) {
      await deleteRecord('recent_documents', item.id);
    }
  }
};

// Clear all recent documents
export const clearRecentDocuments = async () => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['recent_documents'], 'readwrite');
    const store = transaction.objectStore('recent_documents');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Tab states (selected database, open document)
export const getTabState = (tabId) => get('tab_states', tabId);
export const saveTabState = (tabId, state) => put('tab_states', { tabId, ...state });
export const deleteTabState = (tabId) => deleteRecord('tab_states', tabId);

function getFavoriteBucketId(connectionUrl, database) {
  return `${connectionUrl}::${database}`;
}

export const getFavoriteBuckets = async (connectionUrl) => {
  const all = await getAll('favorite_buckets');
  return all
    .filter(bucket => bucket.connectionUrl === connectionUrl)
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const isFavoriteBucket = async (connectionUrl, database) => {
  const record = await get('favorite_buckets', getFavoriteBucketId(connectionUrl, database));
  return Boolean(record);
};

export const addFavoriteBucket = (connectionUrl, database) => put('favorite_buckets', {
  id: getFavoriteBucketId(connectionUrl, database),
  connectionUrl,
  name: database,
  timestamp: Date.now(),
});

export const removeFavoriteBucket = (connectionUrl, database) => deleteRecord(
  'favorite_buckets',
  getFavoriteBucketId(connectionUrl, database)
);

export const toggleFavoriteBucket = async (connectionUrl, database) => {
  if (await isFavoriteBucket(connectionUrl, database)) {
    await removeFavoriteBucket(connectionUrl, database);
    return false;
  }

  await addFavoriteBucket(connectionUrl, database);
  return true;
};

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
  getAllRecentDocuments,
  addRecentDocument,
  clearRecentDocuments,
  getTabState,
  saveTabState,
  deleteTabState,
  getFavoriteBuckets,
  isFavoriteBucket,
  addFavoriteBucket,
  removeFavoriteBucket,
  toggleFavoriteBucket,
};
