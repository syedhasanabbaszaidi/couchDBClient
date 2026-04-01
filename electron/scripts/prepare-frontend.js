const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '../../frontend/build');
const targetDir = path.resolve(__dirname, '../frontend-build');

function removeDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Frontend build not found at ${sourceDir}`);
  console.error('Run `yarn build` in the frontend directory first.');
  process.exit(1);
}

removeDir(targetDir);
copyDir(sourceDir, targetDir);

console.log(`Copied frontend build to ${targetDir}`);
