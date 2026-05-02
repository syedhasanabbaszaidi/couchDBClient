const http = require('http');
const https = require('https');
const { URL } = require('url');
const path = require('path');

const electronPackage = require(path.resolve(__dirname, 'package.json'));

const REQUEST_TIMEOUT_MS = 10000;

function getAuthHeader(username, password) {
  if (username && password) {
    const credentials = `${username}:${password}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  return {};
}

function buildCouchUrl(baseUrl, ...segments) {
  const trimmedBaseUrl = String(baseUrl || '').replace(/\/+$/, '');
  const encodedSegments = segments.map((segment) => encodeURIComponent(String(segment)));
  return `${trimmedBaseUrl}/${encodedSegments.join('/')}`;
}

function getAllowedOrigin(req) {
  const origin = req.headers.origin;

  if (!origin) {
    return null;
  }

  if (
    origin === 'null' ||
    origin === 'file://' ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return origin;
  }

  return null;
}

function addCorsHeaders(req, res) {
  const allowedOrigin = getAllowedOrigin(req);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return allowedOrigin;
}

function sendJson(req, res, statusCode, payload) {
  addCorsHeaders(req, res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function parseMaybeJson(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > 5 * 1024 * 1024) {
        req.destroy(new Error('Request body is too large'));
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      const parsed = parseMaybeJson(body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        resolve(parsed);
        return;
      }

      reject(new Error('Invalid JSON request body'));
    });

    req.on('error', reject);
  });
}

function requestJson(targetUrl, options = {}) {
  return new Promise((resolve, reject) => {
    let parsedUrl;

    try {
      parsedUrl = new URL(targetUrl);
    } catch (_error) {
      reject(Object.assign(new Error('Invalid CouchDB URL'), { statusCode: 400 }));
      return;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      reject(Object.assign(new Error('Only http and https CouchDB URLs are supported'), { statusCode: 400 }));
      return;
    }

    for (const [key, value] of Object.entries(options.params || {})) {
      if (value !== undefined && value !== null) {
        parsedUrl.searchParams.set(key, String(value));
      }
    }

    const body = options.body === undefined ? null : JSON.stringify(options.body);
    const headers = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const request = client.request(
      parsedUrl,
      {
        method: options.method || 'GET',
        headers,
        timeout: options.timeout || REQUEST_TIMEOUT_MS,
      },
      (response) => {
        const chunks = [];

        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const responseText = Buffer.concat(chunks).toString('utf8');
          const data = parseMaybeJson(responseText);

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(data);
            return;
          }

          const detail =
            (data && typeof data === 'object' && (data.reason || data.error)) ||
            response.statusMessage ||
            `CouchDB request failed with status ${response.statusCode}`;
          reject(Object.assign(new Error(detail), { statusCode: response.statusCode, data }));
        });
      }
    );

    request.on('timeout', () => {
      request.destroy(Object.assign(new Error('CouchDB request timed out'), { statusCode: 504 }));
    });

    request.on('error', reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

function getReleaseCatalog() {
  const version = electronPackage.version;
  const releaseTag = `v${version}`;
  const assets = {
    'mac-arm64': {
      key: 'mac-arm64',
      label: 'macOS (Apple Silicon)',
      osFamily: 'mac',
      arch: 'arm64',
      assetName: `CouchDB Client-${version}-arm64.dmg`,
      downloadUrl: null,
    },
    'mac-x64': {
      key: 'mac-x64',
      label: 'macOS (Intel)',
      osFamily: 'mac',
      arch: 'x64',
      assetName: `CouchDB Client-${version}-x64.dmg`,
      downloadUrl: null,
    },
    'windows-x64-installer': {
      key: 'windows-x64-installer',
      label: 'Windows Installer',
      osFamily: 'windows',
      arch: 'x64',
      assetName: `CouchDB Client Setup ${version}.exe`,
      downloadUrl: null,
    },
    'windows-x64-portable': {
      key: 'windows-x64-portable',
      label: 'Windows Portable',
      osFamily: 'windows',
      arch: 'x64',
      assetName: `CouchDB Client ${version}.exe`,
      downloadUrl: null,
    },
  };

  return {
    success: true,
    releaseTag,
    githubRepository: null,
    assets,
  };
}

async function handleCouchRequest(req, res, route) {
  if (route.pathname === '/api/couchdb/test-connection' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const headers = getAuthHeader(body.username, body.password);
    const data = await requestJson(body.url, {
      headers,
    });
    await requestJson(buildCouchUrl(body.url, '_all_dbs'), { headers });
    sendJson(req, res, 200, { success: true, data });
    return true;
  }

  if (route.pathname === '/api/couchdb/databases' && req.method === 'GET') {
    const data = await requestJson(buildCouchUrl(route.searchParams.get('url'), '_all_dbs'), {
      headers: getAuthHeader(route.searchParams.get('username'), route.searchParams.get('password')),
    });
    sendJson(req, res, 200, { success: true, databases: data });
    return true;
  }

  if (route.pathname === '/api/couchdb/documents' && req.method === 'GET') {
    const params = {
      include_docs: false,
      limit: route.searchParams.get('limit') || 100,
      skip: route.searchParams.get('skip') || 0,
    };
    const startkey = route.searchParams.get('startkey');
    const endkey = route.searchParams.get('endkey');

    if (startkey) {
      params.startkey = JSON.stringify(startkey);
    }

    if (endkey) {
      params.endkey = JSON.stringify(endkey);
    }

    const data = await requestJson(
      buildCouchUrl(route.searchParams.get('url'), route.searchParams.get('database'), '_all_docs'),
      {
        headers: getAuthHeader(route.searchParams.get('username'), route.searchParams.get('password')),
        params,
      }
    );
    sendJson(req, res, 200, { success: true, data });
    return true;
  }

  if (route.pathname === '/api/couchdb/document' && req.method === 'GET') {
    const data = await requestJson(
      buildCouchUrl(route.searchParams.get('url'), route.searchParams.get('database'), route.searchParams.get('doc_id')),
      {
        headers: getAuthHeader(route.searchParams.get('username'), route.searchParams.get('password')),
      }
    );
    sendJson(req, res, 200, { success: true, document: data });
    return true;
  }

  if (route.pathname === '/api/couchdb/document' && req.method === 'PUT') {
    const body = await readJsonBody(req);
    const data = await requestJson(
      buildCouchUrl(route.searchParams.get('url'), route.searchParams.get('database'), route.searchParams.get('doc_id')),
      {
        method: 'PUT',
        headers: getAuthHeader(route.searchParams.get('username'), route.searchParams.get('password')),
        body: body.document,
      }
    );
    sendJson(req, res, 200, { success: true, data });
    return true;
  }

  if (route.pathname === '/api/couchdb/document' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const data = await requestJson(
      buildCouchUrl(route.searchParams.get('url'), route.searchParams.get('database')),
      {
        method: 'POST',
        headers: getAuthHeader(route.searchParams.get('username'), route.searchParams.get('password')),
        body: body.document || {},
      }
    );
    sendJson(req, res, 200, { success: true, data });
    return true;
  }

  if (route.pathname === '/api/couchdb/document' && req.method === 'DELETE') {
    const data = await requestJson(
      buildCouchUrl(route.searchParams.get('url'), route.searchParams.get('database'), route.searchParams.get('doc_id')),
      {
        method: 'DELETE',
        headers: getAuthHeader(route.searchParams.get('username'), route.searchParams.get('password')),
        params: {
          rev: route.searchParams.get('rev'),
        },
      }
    );
    sendJson(req, res, 200, { success: true, data });
    return true;
  }

  return false;
}

async function handleRequest(req, res) {
  const allowedOrigin = addCorsHeaders(req, res);

  if (req.headers.origin && !allowedOrigin) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, detail: 'Origin is not allowed' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(allowedOrigin ? 204 : 403);
    res.end();
    return;
  }

  const route = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  try {
    if (await handleCouchRequest(req, res, route)) {
      return;
    }

    if (route.pathname === '/api/releases/catalog' && req.method === 'GET') {
      sendJson(req, res, 200, getReleaseCatalog());
      return;
    }

    if (route.pathname === '/api/downloads/lead' && req.method === 'POST') {
      sendJson(req, res, 501, {
        success: false,
        detail: 'Desktop downloads are disabled inside the local desktop build.',
      });
      return;
    }

    if (route.pathname === '/api/releases/download' && req.method === 'GET') {
      sendJson(req, res, 501, {
        success: false,
        detail: 'Desktop downloads are disabled inside the local desktop build.',
      });
      return;
    }

    if (route.pathname === '/api/analytics/event' && req.method === 'POST') {
      sendJson(req, res, 200, {
        success: true,
        databaseEnabled: false,
      });
      return;
    }

    if (route.pathname === '/api' && req.method === 'GET') {
      sendJson(req, res, 200, { message: 'CouchDB Client local API' });
      return;
    }

    sendJson(req, res, 404, { success: false, detail: 'Not found' });
  } catch (error) {
    sendJson(req, res, error.statusCode || 500, {
      success: false,
      detail: error.message || 'Local API request failed',
      data: error.data,
    });
  }
}

function startLocalApiServer() {
  const server = http.createServer((req, res) => {
    void handleRequest(req, res);
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () => server.close(),
      });
    });
  });
}

module.exports = {
  startLocalApiServer,
};
