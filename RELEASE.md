# CouchDB Client v1.0.0 Release Runbook

This runbook defines the exact process for producing and publishing CouchDB Client desktop release artifacts.

## 1) Prerequisites

| Item | Required Version / Notes |
|------|--------------------------|
| Node.js | 18+ |
| Yarn | 1.x |
| Repo state | Clean `git status` before release |
| macOS host | Required for `.dmg` packaging |
| Windows packaging from macOS | Supported via Wine through `electron-builder` |
| Code signing | Not configured for v1.0.0 (unsigned release) |

## 2) Build Commands

Run from repo root unless noted.

### Install dependencies

```bash
cd frontend && yarn install
cd ../electron && yarn install
cd ../backend && yarn install
```

### Build frontend bundle

```bash
cd frontend
yarn build
```

### Build desktop artifacts

```bash
cd ../electron
yarn build:mac:arm64
yarn build:mac:x64
yarn build:win:x64
```

Or run all in one command:

```bash
cd electron
yarn build:release
```

For a local Mac-only installer that avoids hosted runtime services:

```bash
cd /Users/hasan/development/client
yarn build:mac:local:arm64
```

Use `yarn build:mac:local:x64` for Intel Mac output.

## 3) Expected Artifacts

After release build, `electron/dist` must contain:

- `CouchDB Client-1.0.0-arm64.dmg`
- `CouchDB Client-1.0.0-arm64-mac.zip`
- `CouchDB Client-1.0.0-x64.dmg`
- `CouchDB Client-1.0.0-x64-mac.zip`
- `CouchDB Client Setup 1.0.0.exe`
- `CouchDB Client 1.0.0.exe`
- `CHECKSUMS.txt`

## 4) Checksums

Generate checksums:

```bash
cd electron
yarn checksums:release
```

Verify checksums:

```bash
cd electron/dist
shasum -a 256 -c CHECKSUMS.txt
```

If verification fails, rebuild artifacts and regenerate `CHECKSUMS.txt`.

## 5) White-Page Regression Checks

Confirm relative asset paths in frontend build:

```bash
rg -n 'href="./|src="./' frontend/build/index.html
```

Confirm packaged app includes frontend assets:

```bash
npx asar list "electron/dist/mac-arm64/CouchDB Client.app/Contents/Resources/app.asar" | rg "frontend-build/index.html|frontend-build/static|frontend-build/fonts"
```

Smoke-run packaged app (mac build):

```bash
open "electron/dist/mac-arm64/CouchDB Client.app"
```

Expected behavior: app opens to Connection screen (not a white page).

## 6) GitHub Release Publishing

### Tag and push

```bash
git tag -a v1.0.0 -m "CouchDB Client v1.0.0"
git push origin main
git push origin v1.0.0
```

### Create release with GitHub CLI (recommended)

```bash
gh release create v1.0.0 \
  "electron/dist/CouchDB Client-1.0.0-arm64.dmg" \
  "electron/dist/CouchDB Client-1.0.0-arm64-mac.zip" \
  "electron/dist/CouchDB Client-1.0.0-x64.dmg" \
  "electron/dist/CouchDB Client-1.0.0-x64-mac.zip" \
  "electron/dist/CouchDB Client Setup 1.0.0.exe" \
  "electron/dist/CouchDB Client 1.0.0.exe" \
  "electron/dist/CHECKSUMS.txt" \
  --title "CouchDB Client v1.0.0" \
  --notes-file RELEASE_NOTES_v1.0.0.md
```

If you publish from UI, upload the same assets and paste the same notes.

## 7) Known Caveats (v1.0.0)

- Binaries are unsigned.
- macOS Gatekeeper and Windows SmartScreen warnings are expected.
- Local desktop builds include an embedded CouchDB proxy, so they do not require the hosted backend for CouchDB operations.

## 8) Release Notes Template

Use this as `RELEASE_NOTES_v1.0.0.md`:

```md
## CouchDB Client v1.0.0

### Highlights
- First desktop release for macOS and Windows.
- Fixed desktop white-page startup issue by bundling frontend assets directly into packaged app.
- Removed external runtime asset dependencies (local fonts and no external analytics scripts).

### Downloads
- macOS Apple Silicon: `CouchDB Client-1.0.0-arm64.dmg`
- macOS Intel: `CouchDB Client-1.0.0-x64.dmg`
- Windows Installer: `CouchDB Client Setup 1.0.0.exe`
- Windows Portable: `CouchDB Client 1.0.0.exe`
- Checksums: `CHECKSUMS.txt`

### Install Notes
- macOS: If blocked by Gatekeeper, right-click app and choose Open.
- Windows: SmartScreen warning may appear for unsigned binaries.

### Security / Signing Notice
- This release is unsigned and not notarized yet.
- Signed/notarized releases are planned in a future milestone.

### Known Limitations
- Standalone desktop mode includes an embedded CouchDB proxy and does not require the hosted backend for CouchDB operations.
```
