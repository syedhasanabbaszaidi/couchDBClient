export function isDesktopRuntime() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  return window.location.protocol === 'file:' || userAgent.includes('Electron');
}
