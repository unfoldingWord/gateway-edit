const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('env', {
  APP_VERSION: process.env.APP_VERSION ?? 'N/A',
  ELECTRONITE_VERSION: process.versions.electron,
});
