import { isDesktopRuntime } from '@/lib/runtime';

function normalizeUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function getRuntimeBackendUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.couchdbClientRuntime?.apiBaseUrl || '';
}

export const BACKEND_URL = normalizeUrl(getRuntimeBackendUrl() || process.env.REACT_APP_BACKEND_URL);
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : '';

export function hasBackendApi() {
  return Boolean(API);
}

export function isLocalhostUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname) || parsedUrl.hostname.endsWith('.localhost');
  } catch (_error) {
    const normalizedUrl = String(url || '').toLowerCase();
    return normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
  }
}

export function shouldUseDirectCouchConnection(url) {
  if (isDesktopRuntime() && hasBackendApi()) {
    return false;
  }

  return isLocalhostUrl(url) || !hasBackendApi();
}
