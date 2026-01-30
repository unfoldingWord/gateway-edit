#!/usr/bin/env bash
# before running do: chmod +x make-macos-installer.sh
set -euo pipefail

APP_DIR="gatewayedit-desktop"
APP_NAME="GatewayEdit"
APP_ID="com.unfoldingWord.gatewayedit" # change to your reverse-DNS id

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -R ./mac-build/* "$APP_DIR"
cd "$APP_DIR"

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

# Install & package (creates a .app in ./out/)
yarn install
APP_NAME="$APP_NAME" APP_ID="$APP_ID" \
  npm_package_build_productName="$APP_NAME" npm_package_build_appId="$APP_ID" \
  yarn dist:mac

# Create DMG from the pre-packaged app at ./out/GatewayEdit-darwin-arm64
APP_NAME="$APP_NAME" APP_ID="$APP_ID" \
  npm_package_build_productName="$APP_NAME" npm_package_build_appId="$APP_ID" \
  yarn dmg:mac

echo
echo "Done."
echo "App bundle: $APP_DIR/out/$APP_NAME-darwin-arm64/"
echo "DMG:        $APP_DIR/dist/ (look for a .dmg)"
