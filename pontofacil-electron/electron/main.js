import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { fork } from 'child_process';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if running in production (packaged) or development
const isDev = process.env.NODE_ENV === 'development';

let backendProcess = null;

function startBackend() {
  const backendDir = isDev 
    ? path.join(__dirname, '..', '..', 'backend')
    : path.join(process.resourcesPath, 'backend');

  const serverPath = path.join(backendDir, 'src', 'server.js');

  console.log('Starting backend from:', serverPath);

  backendProcess = fork(serverPath, [], {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' }
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });
}

// Initialize electron-store
const store = new Store();

function createWindow() {
  const win = new BrowserWindow({
    width: 1728,
    height: 1000,
    minWidth: 1728,
    minHeight: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: 'Ponto Fácil',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false, // Prevent white flash on startup
  });

  // Show window after content is ready (prevents visual flash)
  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// IPC Handlers for Secure Auth Storage
ipcMain.handle('set-auth', (_event, { token, user }) => {
  store.set('auth', { token, user });
  return true;
});

ipcMain.handle('get-auth', () => {
  return store.get('auth');
});

ipcMain.handle('clear-auth', () => {
  store.delete('auth');
  return true;
});

// IPC Handler for File Saving
ipcMain.handle('save-file', async (_event, { defaultName, content, filters }) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Salvar Relatório',
    defaultPath: defaultName,
    filters: filters || [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (filePath) {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Error saving file:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, cancelled: true };
});

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

