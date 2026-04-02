const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { initializeDatabase, isDatabaseEnabled, maybeQuery } = require('./db');
const { capturePostHogEvent } = require('./posthog');
const { getReleaseAsset, getReleaseCatalog } = require('./releases');

const app = express();
const PORT = process.env.PORT || 8001;

app.set('trust proxy', true);
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

function buildCouchUrl(baseUrl, ...segments) {
  const trimmedBaseUrl = String(baseUrl || '').replace(/\/+$/, '');
  const encodedSegments = segments.map((segment) => encodeURIComponent(String(segment)));
  return `${trimmedBaseUrl}/${encodedSegments.join('/')}`;
}

function sanitizeMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const blockedKeys = new Set(['url', 'username', 'password', 'host', 'authorization']);
  return Object.fromEntries(
    Object.entries(input).filter(([key, value]) => !blockedKeys.has(key) && value !== undefined)
  );
}

function getLocationContext(req, body = {}) {
  return {
    country: req.get('x-vercel-ip-country') || req.get('cf-ipcountry') || body.country || null,
    region: req.get('x-vercel-ip-country-region') || body.region || null,
    city: req.get('x-vercel-ip-city') || body.city || null,
    userAgent: req.get('user-agent') || null,
  };
}

function normalizeBaseContext(req, body = {}) {
  const location = getLocationContext(req, body);
  return {
    source: body.source || 'web',
    entrypoint: body.entrypoint || null,
    anonymousId: body.anonymousId || null,
    sessionId: body.sessionId || null,
    platform: body.platform || body.selectedPlatform || null,
    timezone: body.timezone || null,
    locale: body.locale || null,
    ...location,
  };
}

async function upsertWebSession(context, eventName) {
  if (!context.sessionId || !context.anonymousId) {
    return;
  }

  await maybeQuery(
    `
      INSERT INTO web_sessions (
        session_id,
        anonymous_id,
        source,
        platform,
        country,
        region,
        city,
        timezone,
        locale,
        user_agent,
        page_views,
        last_event_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (session_id)
      DO UPDATE SET
        source = EXCLUDED.source,
        platform = EXCLUDED.platform,
        country = COALESCE(EXCLUDED.country, web_sessions.country),
        region = COALESCE(EXCLUDED.region, web_sessions.region),
        city = COALESCE(EXCLUDED.city, web_sessions.city),
        timezone = COALESCE(EXCLUDED.timezone, web_sessions.timezone),
        locale = COALESCE(EXCLUDED.locale, web_sessions.locale),
        user_agent = COALESCE(EXCLUDED.user_agent, web_sessions.user_agent),
        last_seen_at = NOW(),
        page_views = web_sessions.page_views + EXCLUDED.page_views,
        last_event_name = EXCLUDED.last_event_name
    `,
    [
      context.sessionId,
      context.anonymousId,
      context.source,
      context.platform,
      context.country,
      context.region,
      context.city,
      context.timezone,
      context.locale,
      context.userAgent,
      eventName === 'page_view' ? 1 : 0,
      eventName,
    ]
  );
}

async function recordUsageEvent(req, { eventName, metadata = {} }) {
  const context = normalizeBaseContext(req, req.body || {});
  const cleanMetadata = sanitizeMetadata(metadata);

  await maybeQuery(
    `
      INSERT INTO usage_events (
        event_name,
        source,
        entrypoint,
        anonymous_id,
        session_id,
        platform,
        country,
        region,
        city,
        user_agent,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    `,
    [
      eventName,
      context.source,
      context.entrypoint,
      context.anonymousId,
      context.sessionId,
      context.platform,
      context.country,
      context.region,
      context.city,
      context.userAgent,
      JSON.stringify(cleanMetadata),
    ]
  );

  await upsertWebSession(context, eventName);

  await capturePostHogEvent({
    distinctId: context.anonymousId || context.sessionId,
    event: eventName,
    properties: {
      source: context.source,
      entrypoint: context.entrypoint,
      platform: context.platform,
      country: context.country,
      region: context.region,
      city: context.city,
      session_id: context.sessionId,
      ...cleanMetadata,
    },
  });
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    const { url, database, username, password, limit = 100, skip = 0, startkey, endkey } = req.query;
    const headers = getAuthHeader(username, password);
    const params = { include_docs: false, limit, skip };
    
    // Add startkey/endkey for server-side filtering if provided
    if (startkey) params.startkey = JSON.stringify(startkey);
    if (endkey) params.endkey = JSON.stringify(endkey);
    
    const response = await axios.get(
      buildCouchUrl(url, database, '_all_docs'),
      {
        headers,
        params,
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
      buildCouchUrl(url, database, doc_id),
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
      buildCouchUrl(url, database, doc_id),
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
      buildCouchUrl(url, database),
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
      buildCouchUrl(url, database, doc_id),
      {
        headers,
        params: { rev },
        timeout: 10000,
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

app.get('/api/releases/catalog', async (req, res) => {
  res.json({
    success: true,
    ...getReleaseCatalog(),
  });
});

app.post('/api/downloads/lead', async (req, res) => {
  try {
    const { name, email, selectedPlatform } = req.body;
    const asset = getReleaseAsset(selectedPlatform);

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, detail: 'Name is required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, detail: 'A valid email is required.' });
    }

    if (!asset) {
      return res.status(400).json({ success: false, detail: 'Unsupported download platform.' });
    }

    const context = normalizeBaseContext(req, req.body);
    let leadId = null;

    const leadResult = await maybeQuery(
      `
        INSERT INTO leads (
          name,
          email,
          source,
          entrypoint,
          selected_platform,
          anonymous_id,
          session_id,
          timezone,
          locale,
          country,
          region,
          city,
          user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `,
      [
        name.trim(),
        email.trim().toLowerCase(),
        context.source,
        context.entrypoint,
        selectedPlatform,
        context.anonymousId,
        context.sessionId,
        context.timezone,
        context.locale,
        context.country,
        context.region,
        context.city,
        context.userAgent,
      ]
    );

    if (leadResult?.rows?.[0]?.id) {
      leadId = String(leadResult.rows[0].id);
    }

    await recordUsageEvent(req, {
      eventName: 'download_form_submitted',
      metadata: {
        selectedPlatform,
        assetName: asset.assetName,
        leadCaptured: Boolean(leadId),
      },
    });

    res.json({
      success: true,
      leadId,
      releaseTag: getReleaseCatalog().releaseTag,
      assetName: asset.assetName,
      downloadUrl: asset.downloadUrl,
    });
  } catch (error) {
    console.error('Failed to capture download lead:', error);
    res.status(500).json({
      success: false,
      detail: 'Unable to prepare your download right now.',
    });
  }
});

app.get('/api/releases/download', async (req, res) => {
  try {
    const { platform, leadId, anonymousId, sessionId, source = 'web', entrypoint } = req.query;
    const asset = getReleaseAsset(platform);

    if (!asset) {
      return res.status(400).json({ success: false, detail: 'Unsupported download platform.' });
    }

    const context = normalizeBaseContext(req, {
      source,
      entrypoint,
      anonymousId,
      sessionId,
      platform,
    });

    await maybeQuery(
      `
        INSERT INTO download_events (
          lead_id,
          event_name,
          selected_platform,
          asset_name,
          release_tag,
          source,
          entrypoint,
          anonymous_id,
          session_id,
          country,
          region,
          user_agent,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      `,
      [
        leadId ? Number(leadId) : null,
        'download_redirected',
        platform,
        asset.assetName,
        getReleaseCatalog().releaseTag,
        context.source,
        context.entrypoint,
        context.anonymousId,
        context.sessionId,
        context.country,
        context.region,
        context.userAgent,
        JSON.stringify({ downloadUrl: asset.downloadUrl }),
      ]
    );

    await capturePostHogEvent({
      distinctId: context.anonymousId || context.sessionId,
      event: 'download_redirected',
      properties: {
        source: context.source,
        entrypoint: context.entrypoint,
        platform,
        asset_name: asset.assetName,
        release_tag: getReleaseCatalog().releaseTag,
        country: context.country,
        region: context.region,
        lead_id: leadId || null,
      },
    });

    res.redirect(asset.downloadUrl);
  } catch (error) {
    console.error('Failed to redirect release download:', error);
    res.status(500).json({
      success: false,
      detail: 'Unable to redirect to the download right now.',
    });
  }
});

app.post('/api/analytics/event', async (req, res) => {
  try {
    const { eventName, metadata } = req.body || {};

    if (!eventName) {
      return res.status(400).json({ success: false, detail: 'eventName is required.' });
    }

    await recordUsageEvent(req, {
      eventName,
      metadata,
    });

    res.json({
      success: true,
      databaseEnabled: isDatabaseEnabled(),
    });
  } catch (error) {
    console.error('Analytics event failed:', error);
    res.status(500).json({
      success: false,
      detail: 'Unable to record analytics event.',
    });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'CouchDB Client API' });
});

initializeDatabase()
  .then(() => {
    if (isDatabaseEnabled()) {
      console.log('Postgres analytics storage ready');
    } else {
      console.log('Postgres analytics storage disabled (DATABASE_URL not set)');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize backend:', error);
    process.exit(1);
  });
