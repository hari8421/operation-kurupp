// Operation Kurup: Electron Desktop Application Launcher (Mac & Windows)
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Operation Kurup: The Great Kerala Manhunt',
    backgroundColor: '#0c120c',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load public index
  mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
