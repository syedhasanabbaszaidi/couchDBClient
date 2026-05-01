#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ARCH="${1:-$(uname -m)}"
case "$ARCH" in
  arm64|aarch64)
    MAC_ARCH="arm64"
    CHECKSUM_ARTIFACTS="CouchDB Client-1.0.0-arm64.dmg,CouchDB Client-1.0.0-arm64-mac.zip"
    ;;
  x64|x86_64|amd64)
    MAC_ARCH="x64"
    CHECKSUM_ARTIFACTS="CouchDB Client-1.0.0-x64.dmg,CouchDB Client-1.0.0-x64-mac.zip"
    ;;
  all|both|universal)
    MAC_ARCH="all"
    CHECKSUM_ARTIFACTS="CouchDB Client-1.0.0-arm64.dmg,CouchDB Client-1.0.0-arm64-mac.zip,CouchDB Client-1.0.0-x64.dmg,CouchDB Client-1.0.0-x64-mac.zip"
    ;;
  *)
    echo "Unsupported Mac arch: $ARCH"
    echo "Use one of: arm64, x64, all"
    exit 1
    ;;
esac

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

if [ "$MAC_ARCH" = "all" ]; then
  echo "Building macOS Apple Silicon DMG..."
  yarn --cwd electron build:mac:arm64
  echo "Building macOS Intel DMG..."
  yarn --cwd electron build:mac:x64
else
  echo "Building macOS $MAC_ARCH DMG..."
  yarn --cwd electron "build:mac:$MAC_ARCH"
fi

echo "Writing local Mac checksums..."
CHECKSUM_ARTIFACTS="$CHECKSUM_ARTIFACTS" yarn --cwd electron checksums:release

echo "Local Mac artifacts are ready in $ROOT_DIR/electron/dist"
