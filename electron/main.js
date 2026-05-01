const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startLocalApiServer } = require('./local-api');
const isDev = process.env.NODE_ENV === 'development';
let localApi = null;

function createWindow() {
  const bundledIndexPath = path.join(__dirname, 'frontend-build', 'index.html');
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'CouchDB Client',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(bundledIndexPath);
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Window failed to load', {
      errorCode,
      errorDescription,
      validatedURL,
      bundledIndexPath,
    });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process exited', details);
  });

  mainWindow.on('closed', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  startLocalApiServer()
    .then((api) => {
      localApi = api;
      process.env.COUCHDB_CLIENT_LOCAL_API_URL = api.url;
      console.log(`Local CouchDB proxy listening at ${api.url}`);
      createWindow();
    })
    .catch((error) => {
      console.error('Failed to start local CouchDB proxy:', error);
      createWindow();
    });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (localApi) {
    localApi.close();
    localApi = null;
  }
});
