#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

for required_dir in node_modules frontend/node_modules electron/node_modules; do
  if [ ! -d "$required_dir" ]; then
    echo "Missing $required_dir"
    echo "This local build does not install from the internet. Run yarn installs once, then retry."
    exit 1
  fi
done

export REACT_APP_BACKEND_URL=""
export GENERATE_SOURCEMAP=false
export CSC_IDENTITY_AUTO_DISCOVERY=false
export ELECTRON_BUILDER_CACHE="${ELECTRON_BUILDER_CACHE:-$HOME/Library/Caches/electron-builder}"

echo "Building offline/local frontend bundle..."
yarn --cwd frontend build

echo "Building macOS Apple Silicon DMG..."
yarn --cwd electron build:mac:arm64

echo "Building Windows x64 EXE installer and portable EXE..."
yarn --cwd electron build:win:x64

echo "Writing local installer checksums..."
CHECKSUM_ARTIFACTS="CouchDB Client-1.0.0-arm64.dmg,CouchDB Client-1.0.0-arm64-mac.zip,CouchDB Client Setup 1.0.0.exe,CouchDB Client 1.0.0.exe" yarn --cwd electron checksums:release

echo "Local installer artifacts are ready in $ROOT_DIR/electron/dist"
