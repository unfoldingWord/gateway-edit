#!/usr/bin/env bash
# before running do: chmod +x make-macos-installer.sh
# add parameter `--qa` for develop mode
set -euo pipefail

APP_DIR="gatewayedit-desktop"
APP_NAME="GatewayEdit"
APP_ID="com.unfoldingWord.gatewayedit" # change to your reverse-DNS id

QA_MODE=false
ARCH="arm64"             # default: Apple Silicon
UNIVERSAL=false           # build a universal .app/.dmg (arm64+x64)
INSTALL_AFTER=false       # mount dmg and copy app to /Applications

for arg in "$@"; do
  case "$arg" in
    --qa) QA_MODE=true ;;
    --x64|--intel) ARCH="x64" ;;                    # Intel target
    --arm64|--apple-silicon) ARCH="arm64" ;;        # Apple Silicon target (explicit)
    --arch=*) ARCH="${arg#--arch=}" ;;              # --arch=x64|arm64
    --universal) UNIVERSAL=true ;;                  # Universal target (arm64+x64)
    --install) INSTALL_AFTER=true ;;                # Install into /Applications (local machine)
  esac
done

if [[ "$UNIVERSAL" != "true" ]]; then
  if [[ "$ARCH" != "arm64" && "$ARCH" != "x64" ]]; then
    echo "ERROR: Unsupported arch '$ARCH'. Use --x64/--intel, --arm64/--apple-silicon, --arch=x64|arm64, or --universal"
    exit 1
  fi
fi

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

# Pass arch through to electron-builder (via yarn script args)
# - yarn <script> -- <args> forwards args to the underlying command
EB_ARCH_ARGS=()
if [[ "$UNIVERSAL" == "true" ]]; then
  # electron-builder will build/merge both architectures into a universal app
  EB_ARCH_ARGS+=(--universal)
else
  if [[ "$ARCH" == "x64" ]]; then
    EB_ARCH_ARGS+=(--x64)
  else
    EB_ARCH_ARGS+=(--arm64)
  fi
fi

APP_NAME="$APP_NAME" APP_ID="$APP_ID" \
  npm_package_build_productName="$APP_NAME" npm_package_build_appId="$APP_ID" \
  yarn dist:mac -- "${EB_ARCH_ARGS[@]}"

# Create DMG from the pre-packaged app at ./out/<name>-darwin-<arch|universal>
APP_NAME="$APP_NAME" APP_ID="$APP_ID" \
  npm_package_build_productName="$APP_NAME" npm_package_build_appId="$APP_ID" \
  yarn dmg:mac -- "${EB_ARCH_ARGS[@]}"

# Ensure the DMG filename includes architecture (electron-builder often omits it for dmg)
shopt -s nullglob
dmg_files=(./dist/*.dmg)
if (( ${#dmg_files[@]} == 0 )); then
  echo "ERROR: No DMG produced in ./dist"
  exit 1
fi

ARCH_LABEL="$ARCH"
if [[ "$UNIVERSAL" == "true" ]]; then
  ARCH_LABEL="universal"
fi

for dmg in "${dmg_files[@]}"; do
  base="$(basename "$dmg")"
  if [[ "$base" == *"$ARCH_LABEL"* ]]; then
    continue
  fi

  # Insert "-<arch>" before ".dmg"
  new_base="${base%.dmg}-$ARCH_LABEL.dmg"
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

# Optional: Install by mounting the DMG and copying the .app to /Applications
if [[ "$INSTALL_AFTER" == "true" ]]; then
  shopt -s nullglob
  dmg_candidates=(../../dist/*.dmg)
  shopt -u nullglob

  if (( ${#dmg_candidates[@]} == 0 )); then
    echo "ERROR: No DMG found in ../../dist to install"
    exit 1
  fi

  dmg_to_install=""
  # Prefer the just-built arch label
  for f in "${dmg_candidates[@]}"; do
    if [[ "$(basename "$f")" == *"$ARCH_LABEL"* ]]; then
      dmg_to_install="$f"
      break
    fi
  done
  # Fallback to the first DMG
  if [[ -z "$dmg_to_install" ]]; then
    dmg_to_install="${dmg_candidates[0]}"
  fi

  echo
  echo "Installing from DMG:"
  echo "  $dmg_to_install"

  MOUNT_DIR="$(mktemp -d "/tmp/${APP_NAME}.dmg.mount.XXXXXX")"
  cleanup() {
    set +e
    hdiutil detach "$MOUNT_DIR" -quiet >/dev/null 2>&1 || true
    rm -rf "$MOUNT_DIR" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT

  hdiutil attach "$dmg_to_install" -nobrowse -mountpoint "$MOUNT_DIR" -quiet

  app_in_dmg="$(find "$MOUNT_DIR" -maxdepth 2 -name "*.app" -print -quit)"
  if [[ -z "$app_in_dmg" ]]; then
    echo "ERROR: Could not find a .app inside the mounted DMG"
    exit 1
  fi

  echo "Copying to /Applications (may prompt for permission)..."
  rm -rf "/Applications/$(basename "$app_in_dmg")"
  ditto "$app_in_dmg" "/Applications/$(basename "$app_in_dmg")"

  echo "Installed:"
  echo "  /Applications/$(basename "$app_in_dmg")"
fi

echo
echo "Done."
if [[ "$UNIVERSAL" == "true" ]]; then
  echo "Target arch: universal (arm64 + x64)"
  echo "App bundle: $APP_DIR/out/$APP_NAME-darwin-universal/"
else
  echo "Target arch: $ARCH"
  echo "App bundle: $APP_DIR/out/$APP_NAME-darwin-$ARCH/"
fi
echo "DMG:        $APP_DIR/dist/ (look for a .dmg)"
echo "DMG copied to: ../../dist/"
ls -als ../../dist
