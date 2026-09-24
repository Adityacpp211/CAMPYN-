const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronPlatform', {
  isDesktop: true,
  platform: process.platform,
});
