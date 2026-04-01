const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const packageJson = require(path.resolve(__dirname, '../package.json'));
const productName = packageJson.build?.productName || 'CouchDB Client';
const version = packageJson.version;
const baseName = `${productName}-${version}`;

const renameMap = [
  [`${baseName}.dmg`, `${baseName}-x64.dmg`],
  [`${baseName}.dmg.blockmap`, `${baseName}-x64.dmg.blockmap`],
  [`${baseName}-mac.zip`, `${baseName}-x64-mac.zip`],
  [`${baseName}-mac.zip.blockmap`, `${baseName}-x64-mac.zip.blockmap`],
];

for (const [sourceName, targetName] of renameMap) {
  const sourcePath = path.join(distDir, sourceName);
  const targetPath = path.join(distDir, targetName);

  if (!fs.existsSync(sourcePath)) {
    continue;
  }

  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { force: true });
  }

  fs.renameSync(sourcePath, targetPath);
  console.log(`Renamed ${sourceName} -> ${targetName}`);
}
