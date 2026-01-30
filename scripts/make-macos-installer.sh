#!/usr/bin/env bash
# before running do: chmod +x make-macos-installer.sh
# add parameter `--qa` for develop mode
set -euo pipefail

APP_DIR="gatewayedit-desktop"
APP_NAME="GatewayEdit"
APP_ID="com.unfoldingWord.gatewayedit" # change to your reverse-DNS id

QA_MODE=false
for arg in "$@"; do
  case "$arg" in
    --qa) QA_MODE=true ;;
  esac
done

if [[ "$QA_MODE" == "true" ]]; then
  APP_NAME="${APP_NAME}Develop"
  echo "Doing QA build to $APP_NAME"

  export APP_NAME
  export APP_ID
fi

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -R ./mac-build/* "$APP_DIR"
cd "$APP_DIR"

# If --qa is passed, point the wrapper app at the QA URL
if [[ "$QA_MODE" == "true" ]]; then
  node - <<'NODE'
  const fs = require('fs');



  const file = 'main.js';
  const qaUrl = 'https://develop--gateway-edit.netlify.app/';

  if (!fs.existsSync(file)) {
    console.error(`ERROR: ${file} not found (cannot set START_URL for --qa).`);
    process.exit(1);
  }

  const src = fs.readFileSync(file, 'utf8');
  const updated = src.replace(
    /const\s+START_URL\s*=\s*(['"])[^'"]*\1\s*;/,
    `const START_URL = '${qaUrl}';`
  );

  if (updated === src) {
    console.error('ERROR: Could not find a "const START_URL = ...;" assignment in main.js');
    process.exit(1);
  }

  fs.writeFileSync(file, updated, 'utf8');
  console.log(`QA mode enabled: START_URL set to ${qaUrl}`);
NODE
fi

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

# Copy DMG files to ../../dist
mkdir -p ../../dist
cp -f ./dist/*.dmg ../../dist/

echo
echo "Done."
echo "App bundle: $APP_DIR/out/$APP_NAME-darwin-arm64/"
echo "DMG:        $APP_DIR/dist/ (look for a .dmg)"
echo "DMG copied to: ../../dist/"
ls -als ../../dist
