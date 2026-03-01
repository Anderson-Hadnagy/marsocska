const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: true,
        titleBarStyle: 'hidden',
        transparent: true,
        resizable: true,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

  win.loadFile('index.html');
}

const { ipcMain } = require('electron');

ipcMain.on('minimize', (event) => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.on('maximize', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('close', () => {
  BrowserWindow.getFocusedWindow().close();
});

app.whenReady().then(createWindow);