const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

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
      sandbox: false, // must be false to allow preload script to run
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadURL(START_URL);

  win.webContents.on('did-finish-load', () => {
    console.log('App Version:', app.getVersion());
    console.log('Electronite Version:', process.versions.electron);
  });

  // Keep users inside the system browser for external links if you want:
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  process.env.APP_VERSION = app.getVersion();
  process.env.ELECTRONITE_VERSION = process.versions.electron;
  createWindow();
});

app.on('window-all-closed', () => {
  // Standard macOS behavior: keep app open until user quits
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
