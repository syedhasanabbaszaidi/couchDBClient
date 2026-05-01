import axios from 'axios';
import {
  DESKTOP_RELEASE_LABEL,
  DOWNLOAD_PLATFORM_OPTIONS,
  detectAnalyticsPlatform,
} from '@/lib/platform';
import { isDesktopRuntime } from '@/lib/runtime';
import { API, hasBackendApi } from '@/lib/api';

function getLocalReleaseCatalog() {
  return {
    success: true,
    releaseTag: DESKTOP_RELEASE_LABEL,
    githubRepository: null,
    assets: Object.fromEntries(
      DOWNLOAD_PLATFORM_OPTIONS.map((option) => [
        option.key,
        {
          ...option,
          assetName: option.key,
          downloadUrl: null,
        },
      ])
    ),
  };
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    local: window.localStorage,
    session: window.sessionStorage,
  };
}

export function getAnalyticsContext() {
  const storage = getStorage();
  if (!storage) {
    return {
      anonymousId: null,
      sessionId: null,
      locale: null,
      timezone: null,
      platform: detectAnalyticsPlatform(),
      source: 'web',
    };
  }

  let anonymousId = storage.local.getItem('couchdb_client_anonymous_id');
  if (!anonymousId) {
    anonymousId = createId();
    storage.local.setItem('couchdb_client_anonymous_id', anonymousId);
  }

  let sessionId = storage.session.getItem('couchdb_client_session_id');
  if (!sessionId) {
    sessionId = createId();
    storage.session.setItem('couchdb_client_session_id', sessionId);
  }

  return {
    anonymousId,
    sessionId,
    locale: typeof navigator !== 'undefined' ? navigator.language : null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    platform: detectAnalyticsPlatform(),
    source: 'web',
  };
}

export async function trackAnalyticsEvent(eventName, metadata = {}, options = {}) {
  if (isDesktopRuntime() || !hasBackendApi()) {
    return;
  }

  const context = getAnalyticsContext();
  await axios.post(`${API}/analytics/event`, {
    eventName,
    metadata,
    entrypoint: options.entrypoint || null,
    platform: options.platform || context.platform,
    anonymousId: context.anonymousId,
    sessionId: context.sessionId,
    timezone: context.timezone,
    locale: context.locale,
    source: context.source,
  }).catch(() => {
    // Analytics is best-effort and should never block the product flow.
  });
}

export async function ensureSessionStarted(pageName) {
  if (isDesktopRuntime()) {
    return;
  }

  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (!storage.session.getItem('couchdb_client_session_started')) {
    storage.session.setItem('couchdb_client_session_started', 'true');
    await trackAnalyticsEvent('session_started', { page: pageName }, { entrypoint: 'app-shell' });
  }
}

export async function fetchReleaseCatalog() {
  if (!hasBackendApi()) {
    return getLocalReleaseCatalog();
  }

  const response = await axios.get(`${API}/releases/catalog`);
  return response.data;
}

export async function submitDownloadLead({ name, email, selectedPlatform, entrypoint }) {
  if (!hasBackendApi()) {
    const error = new Error('Download backend is not configured for this local build.');
    error.response = {
      data: {
        detail: 'Download backend is not configured for this local build.',
      },
    };
    throw error;
  }

  const context = getAnalyticsContext();
  const response = await axios.post(`${API}/downloads/lead`, {
    name,
    email,
    selectedPlatform,
    entrypoint,
    platform: context.platform,
    anonymousId: context.anonymousId,
    sessionId: context.sessionId,
    timezone: context.timezone,
    locale: context.locale,
    source: context.source,
  });

  return response.data;
}

export function buildDownloadRedirectUrl({ selectedPlatform, leadId, entrypoint }) {
  if (!hasBackendApi()) {
    return '';
  }

  const context = getAnalyticsContext();
  const params = new URLSearchParams({
    platform: selectedPlatform,
    source: context.source,
    anonymousId: context.anonymousId || '',
    sessionId: context.sessionId || '',
    entrypoint: entrypoint || '',
  });

  if (leadId) {
    params.set('leadId', leadId);
  }

  return `${API}/releases/download?${params.toString()}`;
}
