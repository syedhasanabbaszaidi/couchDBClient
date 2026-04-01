const path = require('path');

const electronPackage = require(path.resolve(__dirname, '../electron/package.json'));

const releaseTag = process.env.RELEASE_TAG || `v${electronPackage.version}`;
const githubRepository = process.env.GITHUB_REPOSITORY || 'syedhasanabbaszaidi/client';

const assetCatalog = {
  'mac-arm64': {
    key: 'mac-arm64',
    label: 'macOS (Apple Silicon)',
    osFamily: 'mac',
    arch: 'arm64',
    assetName: `CouchDB Client-${electronPackage.version}-arm64.dmg`,
  },
  'mac-x64': {
    key: 'mac-x64',
    label: 'macOS (Intel)',
    osFamily: 'mac',
    arch: 'x64',
    assetName: `CouchDB Client-${electronPackage.version}-x64.dmg`,
  },
  'windows-x64-installer': {
    key: 'windows-x64-installer',
    label: 'Windows Installer',
    osFamily: 'windows',
    arch: 'x64',
    assetName: `CouchDB Client Setup ${electronPackage.version}.exe`,
  },
  'windows-x64-portable': {
    key: 'windows-x64-portable',
    label: 'Windows Portable',
    osFamily: 'windows',
    arch: 'x64',
    assetName: `CouchDB Client ${electronPackage.version}.exe`,
  },
};

function buildReleaseAssetUrl(assetName) {
  return `https://github.com/${githubRepository}/releases/download/${releaseTag}/${encodeURIComponent(assetName)}`;
}

function getReleaseCatalog() {
  return {
    releaseTag,
    githubRepository,
    assets: Object.fromEntries(
      Object.entries(assetCatalog).map(([key, config]) => [
        key,
        {
          ...config,
          downloadUrl: buildReleaseAssetUrl(config.assetName),
        },
      ])
    ),
  };
}

function getReleaseAsset(platformKey) {
  const catalog = getReleaseCatalog();
  return catalog.assets[platformKey] || null;
}

module.exports = {
  getReleaseAsset,
  getReleaseCatalog,
};
