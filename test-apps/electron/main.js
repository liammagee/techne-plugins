/**
 * Techne Plugins Test App - Electron Main Process
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Root directory for techne-plugins
const ROOT = path.resolve(__dirname, '../..');

let mainWindow = null;

// Enable hot reload in dev mode
if (process.argv.includes('--dev')) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(ROOT, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
    console.log('[main.js] Hot reload enabled');
  } catch (err) {
    console.log('[main.js] electron-reload not available');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#1a1a2e',
    title: 'Techne Plugins Test App'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('read-file-content', async (event, filePath) => {
  try {
    const fullPath = path.join(ROOT, 'tests/fixtures', filePath);
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'File not found' };
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-files', async () => {
  try {
    const fixturesDir = path.join(ROOT, 'tests/fixtures');
    if (!fs.existsSync(fixturesDir)) {
      return { files: [], totalFiles: 0 };
    }

    const files = [];
    const entries = fs.readdirSync(fixturesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        files.push({
          path: entry.name,
          name: entry.name
        });
      }
    }

    return { files, totalFiles: files.length };
  } catch (err) {
    console.error('[main.js] get-files error:', err);
    return { files: [], totalFiles: 0 };
  }
});

ipcMain.handle('list-plugins', async () => {
  try {
    const pluginsDir = path.join(ROOT, 'plugins');
    const plugins = [];

    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('techne-')) {
        const pluginPath = path.join(pluginsDir, entry.name, 'plugin.js');
        if (fs.existsSync(pluginPath)) {
          plugins.push({
            id: entry.name,
            entry: `plugins/${entry.name}/plugin.js`
          });
        }
      }
    }

    return plugins;
  } catch (err) {
    console.error('[main.js] list-plugins error:', err);
    return [];
  }
});

ipcMain.handle('generate-document-summaries', async (event, { content, filePath }) => {
  // Mock implementation for testing
  return {
    success: true,
    paragraph: 'This is a test summary paragraph generated for testing purposes.',
    sentence: 'Test summary sentence.'
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('[main.js] Techne Plugins Test App started');
