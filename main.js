const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        devTools: true,
        width: 1200,
        height: 800,
        frame: true,
        titleBarStyle: 'hidden',
        transparent: true,
        resizable: false,
        fullscreenable: false,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

  win.loadFile('index.html');
}


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