# before running do: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# add parameter --qa for develop mode
param(
    [switch]$qa,
    [string]$arch = "x64" # default: x64
)

$APP_DIR = "gatewayedit-desktop"
$APP_NAME = "GatewayEdit"
$APP_ID = "com.unfoldingWord.gatewayedit" # change to your reverse-DNS id

Write-Host "APP_DIR: $APP_DIR"
Write-Host "APP_NAME: $APP_NAME"
Write-Host "APP_ID: $APP_ID"
Write-Host "arch: $arch"

$QA_MODE = $qa.IsPresent

if ($arch -ne "x64" -and $arch -ne "arm64") {
    Write-Error "Unsupported arch '$arch'. Use --arch x64 or arm64"
    exit 1
}

Write-Host "Using target arch: $arch"

if ($QA_MODE) {
    $APP_NAME = "${APP_NAME}Develop"
    Write-Host "Doing QA build to $APP_NAME"
    $env:APP_NAME = $APP_NAME
    $env:APP_ID = $APP_ID
}

Remove-Item -Recurse -Force $APP_DIR -ErrorAction Ignore
New-Item -ItemType Directory -Force $APP_DIR | Out-Null
Copy-Item -Recurse ./win-build/* $APP_DIR
Set-Location $APP_DIR

# If --qa is passed, point the wrapper app at the QA URL
if ($QA_MODE) {
@'
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
'@ | node
}

# Add electron-builder config (product name, app id, nsis output)
@'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const productName = process.env.APP_NAME || "GatewayEdit";

pkg.build = {
  productName,
  appId: process.env.APP_ID || "com.example.gatewayedit",
  win: {
    target: ["nsis"]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
'@ | node

# Install & package (creates installer in ./dist/)
yarn install

# get package script to use
$PACKAGE_SCRIPT = ""
if ($arch -eq "x64") {
    $PACKAGE_SCRIPT = "dist:win-x64"
} else {
    $PACKAGE_SCRIPT = "dist:win-arm64"
}

$env:APP_NAME = $APP_NAME
$env:APP_ID = $APP_ID
$env:npm_package_build_productName = $APP_NAME
$env:npm_package_build_appId = $APP_ID

yarn $PACKAGE_SCRIPT

$electronite_app_dir = "./out/$APP_NAME-win32-$arch"
Write-Host "electronite_app_dir: $electronite_app_dir"
ls $electronite_app_dir
$env:electronite_app_dir = $electronite_app_dir

# Ensure the installer filename includes architecture
$installer_files = Get-ChildItem  $electronite_app_dir/*.exe
if ($installer_files.Count -eq 0) {
    Write-Error "No installer produced in ./dist"
    exit 1
}

# foreach ($installer in $installer_files) {
#     $base = $installer.Name
#     if ($base -like "*$arch*") {
#         continue
#     }
#
#     # Insert "-<arch>" before ".exe"
#     $new_base = $base -replace '\.exe$', "-$arch.exe"
#     $new_path = Join-Path ./dist $new_base
#
#     # Avoid clobbering if it already exists
#     if (Test-Path $new_path) {
#         Write-Warning "$new_path already exists; leaving $installer as-is"
#         continue
#     }
#
#     Move-Item -Force $installer.FullName $new_path
# }

# get package script to use
$INSTALLER_SCRIPT = ""
if ($arch -eq "x64") {
    $INSTALLER_SCRIPT = "nsis:win-x64"
} else {
    $INSTALLER_SCRIPT = "dist:win-arm64"
}

$env:APP_NAME = $APP_NAME
$env:APP_ID = $APP_ID
$env:npm_package_build_productName = $APP_NAME
$env:npm_package_build_appId = $APP_ID

yarn $INSTALLER_SCRIPT

# Copy installer files to ../../dist
New-Item -ItemType Directory -Force ../../dist | Out-Null
Copy-Item -Force ./dist/*.exe ../../dist/

Write-Host ""
Write-Host "Done."
Write-Host "Target arch: $arch"
Write-Host "Installer:   $APP_DIR/dist/ (look for a .exe)"
Write-Host "Installer copied to: ../../dist/"
Get-ChildItem ../../dist | Format-Table -AutoSize

cd ..
