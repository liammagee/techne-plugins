/**
 * Techne Plugins Test App - Electron Preload Script
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Two-way IPC communication
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // One-way communication (Main -> Renderer)
  on: (channel, listener) => {
    const subscription = (event, ...args) => listener(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  // Renderer -> Main (one-way)
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),

  // Convenience methods for common operations
  readFile: (filePath) => ipcRenderer.invoke('read-file-content', filePath),
  getFiles: () => ipcRenderer.invoke('get-files'),
  listPlugins: () => ipcRenderer.invoke('list-plugins'),
  generateSummaries: (content, filePath) =>
    ipcRenderer.invoke('generate-document-summaries', { content, filePath })
});

console.log('[preload.js] electronAPI exposed');
