export const DESKTOP_RELEASE_LABEL = 'v1.0.0';

export const DOWNLOAD_PLATFORM_OPTIONS = [
  {
    key: 'mac-arm64',
    label: 'macOS (Apple Silicon)',
    helperText: 'Best for M1, M2, M3, and newer Macs.',
    family: 'mac',
  },
  {
    key: 'mac-x64',
    label: 'macOS (Intel)',
    helperText: 'For older Intel-based Macs.',
    family: 'mac',
  },
  {
    key: 'windows-x64-installer',
    label: 'Windows Installer',
    helperText: 'Recommended for most Windows users.',
    family: 'windows',
  },
  {
    key: 'windows-x64-portable',
    label: 'Windows Portable',
    helperText: 'Run without installation.',
    family: 'windows',
  },
];

export function getPlatformOption(platformKey) {
  return DOWNLOAD_PLATFORM_OPTIONS.find((option) => option.key === platformKey) || null;
}

export function detectRecommendedDownloadPlatform() {
  if (typeof navigator === 'undefined') {
    return 'mac-arm64';
  }

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';

  if (/win/i.test(userAgent) || /win/i.test(platform)) {
    return 'windows-x64-installer';
  }

  if (/mac/i.test(userAgent) || /mac/i.test(platform)) {
    return 'mac-arm64';
  }

  return 'mac-arm64';
}

export function detectAnalyticsPlatform() {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';

  if (/iphone|ipad|ios/i.test(userAgent)) {
    return 'iOS';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/win/i.test(userAgent) || /win/i.test(platform)) {
    return 'Windows';
  }

  if (/mac/i.test(userAgent) || /mac/i.test(platform)) {
    return 'macOS';
  }

  if (/linux/i.test(userAgent) || /linux/i.test(platform)) {
    return 'Linux';
  }

  return 'unknown';
}
