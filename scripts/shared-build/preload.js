const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('env', {
  APP_VERSION: process.env.APP_VERSION,
  ELECTRONITE_VERSION: process.env.ELECTRONITE_VERSION,
});
