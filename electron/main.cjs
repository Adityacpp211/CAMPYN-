const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: "CAMPÈS — Système d'Information Universitaire",
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    show: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const distIndex = path.resolve(__dirname, '..', 'dist', 'index.html');
  console.log('[Electron] Loading application from:', distIndex);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Window finished loading dist/index.html successfully');
  });

  mainWindow.loadFile(distIndex);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Remove default top menu for clean sleek monochromatic window design
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
