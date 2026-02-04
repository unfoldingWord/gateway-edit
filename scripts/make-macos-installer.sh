#!/usr/bin/env bash
# before running do: chmod +x make-macos-installer.sh
# add parameter `--qa` for develop mode, or for architecture `--arm64` or `--x64`
set -euo pipefail
set -x

APP_DIR="gatewayedit-desktop"
APP_NAME="GatewayEdit"
APP_ID="com.unfoldingWord.gatewayedit" # change to your reverse-DNS id

QA_MODE=false
ARCH="arm64" # default: Apple Silicon
for arg in "$@"; do
  case "$arg" in
    --qa) QA_MODE=true ;;
    --x64|--intel) ARCH="x64" ;;                    # Intel target
    --arm64|--apple-silicon) ARCH="arm64" ;;        # Apple Silicon target (explicit)
    --arch=*) ARCH="${arg#--arch=}" ;;              # --arch=x64|arm64
  esac
done

if [[ "$ARCH" != "arm64" && "$ARCH" != "x64" ]]; then
  echo "ERROR: Unsupported arch '$ARCH'. Use --x64/--intel, --arm64/--apple-silicon, or --arch=x64|arm64"
  exit 1
fi

# Force the command architecture for install/build steps
ARCH_CMD=()
if [[ "$ARCH" == "x64" ]]; then
  ARCH_CMD=(arch -x86_64)
else
  ARCH_CMD=(arch -arm64)
fi

echo "Using target arch: $ARCH"

if [[ "$QA_MODE" == "true" ]]; then
  APP_NAME="${APP_NAME}Develop"
  echo "Doing QA build to $APP_NAME"

  export APP_NAME
  export APP_ID
fi

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -R ./mac-build/* "$APP_DIR"
cp -R ./shared-build/* "$APP_DIR"
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

# get package script to use
PACKAGE_SCRIPT=""
if [[ "$ARCH" == "x64" ]]; then
  PACKAGE_SCRIPT="dist:mac-x64"
else
  PACKAGE_SCRIPT="dist:mac-arm64"
fi

APP_NAME="$APP_NAME" APP_ID="$APP_ID" \
  npm_package_build_productName="$APP_NAME" npm_package_build_appId="$APP_ID" \
  yarn ${PACKAGE_SCRIPT}

# get installer script to use
INSTALLER_SCRIPT=""
if [[ "$ARCH" == "x64" ]]; then
  INSTALLER_SCRIPT="dmg:mac-x64"
else
  INSTALLER_SCRIPT="dmg:mac-arm64"
fi

# Create DMG from the pre-packaged app at ./out/<name>-darwin-<arch>
APP_NAME="$APP_NAME" APP_ID="$APP_ID" \
  npm_package_build_productName="$APP_NAME" npm_package_build_appId="$APP_ID" \
  yarn ${INSTALLER_SCRIPT}

# Ensure the DMG filename includes architecture (electron-builder often omits it for dmg)
shopt -s nullglob
dmg_files=(./dist/*.dmg)
if (( ${#dmg_files[@]} == 0 )); then
  echo "ERROR: No DMG produced in ./dist"
  exit 1
fi

for dmg in "${dmg_files[@]}"; do
  base="$(basename "$dmg")"
  if [[ "$base" == *"$ARCH"* ]]; then
    continue
  fi

  # Insert "-<arch>" before ".dmg"
  new_base="${base%.dmg}-$ARCH.dmg"
  new_path="./dist/$new_base"

  # Avoid clobbering if it already exists
  if [[ -e "$new_path" ]]; then
    echo "WARNING: $new_path already exists; leaving $dmg as-is"
    continue
  fi

  mv -f "$dmg" "$new_path"
done
shopt -u nullglob

# Copy DMG files to ../../dist
mkdir -p ../../dist
cp -f ./dist/*.dmg ../../dist/

echo
echo "Done."
echo "Target arch: $ARCH"
echo "App bundle: $APP_DIR/out/$APP_NAME-darwin-$ARCH/"
echo "DMG:        $APP_DIR/dist/ (look for a .dmg)"
echo "DMG copied to: ../../dist/"
ls -als ../../dist
