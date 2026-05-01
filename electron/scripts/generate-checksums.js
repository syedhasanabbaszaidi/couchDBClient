const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const distDir = path.resolve(__dirname, '../dist');
const outputPath = path.join(distDir, 'CHECKSUMS.txt');

const defaultRequiredArtifacts = [
  'CouchDB Client-1.0.0-arm64.dmg',
  'CouchDB Client-1.0.0-arm64-mac.zip',
  'CouchDB Client-1.0.0-x64.dmg',
  'CouchDB Client-1.0.0-x64-mac.zip',
  'CouchDB Client Setup 1.0.0.exe',
  'CouchDB Client 1.0.0.exe',
];

const configuredArtifacts = (process.env.CHECKSUM_ARTIFACTS || '')
  .split(',')
  .map((fileName) => fileName.trim())
  .filter(Boolean);

const requiredArtifacts = configuredArtifacts.length > 0 ? configuredArtifacts : defaultRequiredArtifacts;

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error(`Missing dist directory: ${distDir}`);
    process.exit(1);
  }

  const missing = requiredArtifacts.filter(
    (fileName) => !fs.existsSync(path.join(distDir, fileName))
  );

  if (missing.length > 0) {
    console.error('Cannot generate release checksums. Missing artifacts:');
    for (const fileName of missing) {
      console.error(`- ${fileName}`);
    }
    process.exit(1);
  }

  const lines = [];
  for (const fileName of requiredArtifacts) {
    const filePath = path.join(distDir, fileName);
    const digest = await sha256File(filePath);
    lines.push(`${digest}  ${fileName}`);
  }

  const content = `${lines.join('\n')}\n`;

  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
