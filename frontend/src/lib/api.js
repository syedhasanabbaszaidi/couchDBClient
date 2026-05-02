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

export function getBackendUrl() {
  return normalizeUrl(getRuntimeBackendUrl() || process.env.REACT_APP_BACKEND_URL);
}

export function getApiBase() {
  const backendUrl = getBackendUrl();
  return backendUrl ? `${backendUrl}/api` : '';
}

export function apiUrl(path) {
  const apiBase = getApiBase();

  if (!apiBase) {
    return '';
  }

  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
}

export const BACKEND_URL = getBackendUrl();
export const API = getApiBase();

export function hasBackendApi() {
  return Boolean(getApiBase());
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
  if (isDesktopRuntime()) {
    return false;
  }

  return isLocalhostUrl(url) || !hasBackendApi();
}
