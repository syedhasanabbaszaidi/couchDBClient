const { Pool } = require('pg');

let pool = null;
let initialized = false;

function isDatabaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function createPool() {
  if (!isDatabaseEnabled()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

async function initializeDatabase() {
  const db = createPool();
  if (!db || initialized) {
    return db;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'web',
      entrypoint TEXT,
      selected_platform TEXT NOT NULL,
      anonymous_id TEXT,
      session_id TEXT,
      timezone TEXT,
      locale TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS download_events (
      id BIGSERIAL PRIMARY KEY,
      lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      event_name TEXT NOT NULL,
      selected_platform TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      release_tag TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'web',
      entrypoint TEXT,
      anonymous_id TEXT,
      session_id TEXT,
      country TEXT,
      region TEXT,
      user_agent TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS web_sessions (
      session_id TEXT PRIMARY KEY,
      anonymous_id TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'web',
      platform TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      timezone TEXT,
      locale TEXT,
      user_agent TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      page_views INTEGER NOT NULL DEFAULT 0,
      last_event_name TEXT
    );

    CREATE TABLE IF NOT EXISTS usage_events (
      id BIGSERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'web',
      entrypoint TEXT,
      anonymous_id TEXT,
      session_id TEXT,
      platform TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      user_agent TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  initialized = true;
  return db;
}

async function query(text, params = []) {
  const db = await initializeDatabase();
  if (!db) {
    throw new Error('Database is not configured');
  }
  return db.query(text, params);
}

async function maybeQuery(text, params = []) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  return query(text, params);
}

module.exports = {
  isDatabaseEnabled,
  initializeDatabase,
  maybeQuery,
  query,
};
