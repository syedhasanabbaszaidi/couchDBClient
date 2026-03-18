const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// Helper function to create auth headers
function getAuthHeader(username, password) {
  if (username && password) {
    const credentials = `${username}:${password}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return { 'Authorization': `Basic ${encoded}` };
  }
  return {};
}

// Test connection
app.post('/api/couchdb/test-connection', async (req, res) => {
  try {
    const { url, username, password } = req.body;
    const headers = getAuthHeader(username, password);
    const response = await axios.get(url, { headers, timeout: 10000 });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      detail: error.message
    });
  }
});

// List databases
app.get('/api/couchdb/databases', async (req, res) => {
  try {
    const { url, username, password } = req.query;
    const headers = getAuthHeader(username, password);
    const response = await axios.get(`${url}/_all_dbs`, { headers, timeout: 10000 });
    res.json({ success: true, databases: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      detail: error.message
    });
  }
});

// List documents
app.get('/api/couchdb/documents', async (req, res) => {
  try {
    const { url, database, username, password, limit = 100, skip = 0 } = req.query;
    const headers = getAuthHeader(username, password);
    const response = await axios.get(
      `${url}/${database}/_all_docs`,
      {
        headers,
        params: { include_docs: false, limit, skip },
        timeout: 10000
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      detail: error.message
    });
  }
});

// Get document
app.get('/api/couchdb/document', async (req, res) => {
  try {
    const { url, database, doc_id, username, password } = req.query;
    const headers = getAuthHeader(username, password);
    const response = await axios.get(
      `${url}/${database}/${doc_id}`,
      { headers, timeout: 10000 }
    );
    res.json({ success: true, document: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      detail: error.message
    });
  }
});

// Save/update document
app.put('/api/couchdb/document', async (req, res) => {
  try {
    const { url, database, doc_id, username, password } = req.query;
    const { document } = req.body;
    const headers = {
      ...getAuthHeader(username, password),
      'Content-Type': 'application/json'
    };
    const response = await axios.put(
      `${url}/${database}/${doc_id}`,
      document,
      { headers, timeout: 10000 }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      detail: error.response?.data?.reason || error.message
    });
  }
});

// Create document
app.post('/api/couchdb/document', async (req, res) => {
  try {
    const { url, database, username, password } = req.query;
    const { document } = req.body;
    const headers = {
      ...getAuthHeader(username, password),
      'Content-Type': 'application/json'
    };
    const response = await axios.post(
      `${url}/${database}`,
      document || {},
      { headers, timeout: 10000 }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      detail: error.message
    });
  }
});

// Delete document
app.delete('/api/couchdb/document', async (req, res) => {
  try {
    const { url, database, doc_id, rev, username, password } = req.query;
    const headers = getAuthHeader(username, password);
    const response = await axios.delete(
      `${url}/${database}/${doc_id}?rev=${rev}`,
      { headers, timeout: 10000 }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      detail: error.message
    });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'CouchDB Client API' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
