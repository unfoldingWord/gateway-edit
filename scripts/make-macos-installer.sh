#!/usr/bin/env bash
# before running do: chmod +x make-macos-installer.sh
# add parameter `--qa` for develop mode, or for architecture `--arm64`, `--x64`, or `--universal`
set -euo pipefail
set -x

APP_DIR="gatewayedit-desktop"
APP_NAME="GatewayEditElectronite"
APP_ID="com.unfoldingWord.gatewayedit" # change to your reverse-DNS id

export APP_NAME
export APP_ID

QA_MODE=false
ARCH="universal" # default: universal macOS build
for arg in "$@"; do
  case "$arg" in
    --qa) QA_MODE=true ;;
    --x64|--intel) ARCH="x64" ;;                    # Intel target
    --arm64|--apple-silicon) ARCH="arm64" ;;        # Apple Silicon target
    --universal) ARCH="universal" ;;                # Universal target
    --arch=*) ARCH="${arg#--arch=}" ;;              # --arch=x64|arm64|universal
  esac
done

if [[ "$ARCH" != "arm64" && "$ARCH" != "x64" && "$ARCH" != "universal" ]]; then
  echo "ERROR: Unsupported arch '$ARCH'. Use --x64/--intel, --arm64/--apple-silicon, --universal, or --arch=x64|arm64|universal"
  exit 1
fi

echo "Using target arch: $ARCH"

if [[ "$QA_MODE" == "true" ]]; then
  APP_NAME="${APP_NAME}QA"
  echo "Doing QA build to $APP_NAME"

  export APP_NAME
  export APP_ID
fi

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -R ./shared-build/* "$APP_DIR"
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

const productName = process.env.APP_NAME || "GatewayEditElectron";

pkg.build = {
  productName,
  appId: process.env.APP_ID || "com.example.gatewayedit",
  mac: {
    category: "public.app-category.productivity",
    target: [
      {
        target: "dmg",
        arch: [
          process.env.TARGET_ARCH || "universal"
        ]
      }
    ]
  },
  dmg: {
    title: process.env.APP_NAME || "GatewayEditElectron"
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
NODE

# Install & package (creates a .app in ./out/)
yarn install

# get package script to use (these are defined in scripts/mac-build/package.json)
PACKAGE_SCRIPT=""
if [[ "$ARCH" == "x64" ]]; then
  PACKAGE_SCRIPT="dist:mac-x64"
elif [[ "$ARCH" == "arm64" ]]; then
  PACKAGE_SCRIPT="dist:mac-arm64"
else
  PACKAGE_SCRIPT="dist:mac-universal"
fi

APP_NAME="$APP_NAME" APP_ID="$APP_ID" TARGET_ARCH="$ARCH" \
  npm_package_build_productName="$APP_NAME" npm_package_build_appId="$APP_ID" \
  yarn ${PACKAGE_SCRIPT}

# get installer script to use
INSTALLER_SCRIPT=""
if [[ "$ARCH" == "x64" ]]; then
  INSTALLER_SCRIPT="dmg:mac-x64"
elif [[ "$ARCH" == "arm64" ]]; then
  INSTALLER_SCRIPT="dmg:mac-arm64"
else
  INSTALLER_SCRIPT="dmg:mac-universal"
fi

# Create DMG from the pre-packaged app at ./out/<name>-darwin-<arch>
APP_NAME="$APP_NAME" APP_ID="$APP_ID" TARGET_ARCH="$ARCH" \
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
  echo "Base name is $base and dmg is $dmg"

  if [[ "$base" == *"-darwin-$ARCH.dmg" ]]; then
    echo "DMG already has target platform/arch suffix: $base"
    continue
  elif [[ "$base" == *"-$ARCH.dmg" ]]; then
    # Convert "...-<arch>.dmg" to "...-darwin-<arch>.dmg"
    new_base="${base%-$ARCH.dmg}-darwin-$ARCH.dmg"
    echo "Renaming DMG from $dmg to $new_base"
  else
    # Insert "-darwin-<arch>" before ".dmg"
    new_base="${base%.dmg}-darwin-$ARCH.dmg"
    echo "Renaming DMG from $dmg to $new_base"
  fi

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
echo "App bundle output: $APP_DIR/out/"
echo "DMG:        $APP_DIR/dist/ (look for a .dmg)"
echo "DMG copied to: ../../dist/"
ls -als ../../dist
