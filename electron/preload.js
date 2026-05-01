const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('couchdbClientRuntime', {
  apiBaseUrl: process.env.COUCHDB_CLIENT_LOCAL_API_URL || '',
});
