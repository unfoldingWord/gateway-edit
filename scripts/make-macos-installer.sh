#!/usr/bin/env bash
set -euo pipefail

APP_DIR="gatewayedit-desktop"
APP_NAME="GatewayEdit"
APP_ID="com.unfoldingWord.gatewayedit" # change to your reverse-DNS id

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

cat > package.json <<'JSON'
{
  "name": "gatewayedit-desktop",
  "version": "1.0.0",
  "private": true,
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dist:mac": "electron-builder --mac dmg"
  },
  "dependencies": {},
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^24.13.3"
  }
}
JSON

cat > main.js <<'JS'
const { app, BrowserWindow, shell } = require('electron');

const START_URL = 'https://gatewayedit.com/';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      // Reasonable defaults for a URL-wrapper
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadURL(START_URL);

  // Keep users inside the system browser for external links if you want:
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Standard macOS behavior: keep app open until user quits
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
JS

# Add electron-builder config (product name, app id, dmg output)
node - <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const productName = process.env.APP_NAME || "GatewayEdit";

pkg.build = {
  productName,
  appId: process.env.APP_ID || "com.example.gatewayedit",
  mac: {
    category: "public.app-category.productivity",
    target: ["dmg"]
  },
  dmg: {
    title: process.env.APP_NAME || "GatewayEdit"
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
NODE

# Install & build
yarn install
APP_NAME="$APP_NAME" APP_ID="$APP_ID" yarn dist:mac

echo
echo "Done."
echo "Look in: $APP_DIR/dist/ (you should see a .dmg)"
