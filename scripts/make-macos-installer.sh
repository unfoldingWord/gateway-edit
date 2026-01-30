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
    "electron-builder": "^24.13.3",
    "canvas": "^2.11.2"
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

# Create a DMG background image with instruction text using Node canvas (no JXA/Cocoa)
mkdir -p build

# Install deps (canvas is native; may download prebuilds or compile)
yarn install

node - <<'NODE'
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

function render(outFile, w, h, scale) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = 'rgb(247, 247, 247)';
  ctx.fillRect(0, 0, w, h);

  // text (bigger + darker so it's unmissable)
  ctx.fillStyle = 'rgb(25, 25, 25)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // scale font with the image size so @2x is truly retina
  ctx.font = `700 ${Math.round(24 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;

  const text = 'Drag GatewayEdit to Applications';

  // place text a bit higher to avoid Finder quirks near the bottom edge
  const y = Math.round(h - (95 * scale));
  ctx.fillText(text, Math.round(w / 2), y);

  const outPath = path.join('build', outFile);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('Wrote', outPath, `${w}x${h}`);
}

// 1x + 2x (Retina) variants
render('dmg-background.png', 540, 380, 1);
render('dmg-background@2x.png', 1080, 760, 2);
NODE

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
    title: productName,

    // Finder will use @2x automatically if present alongside the 1x file
    background: "build/dmg-background.png",

    // Classic “drag app to Applications” layout
    window: { width: 540, height: 380 },
    iconSize: 128,
    contents: [
      { x: 140, y: 190, type: "file" },
      { x: 400, y: 190, type: "link", path: "/Applications" }
    ]
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
NODE

# Build
APP_NAME="$APP_NAME" APP_ID="$APP_ID" yarn dist:mac

echo
echo "Done."
echo "Look in: $APP_DIR/dist/ (you should see a .dmg)"
