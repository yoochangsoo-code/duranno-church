const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runAgyPrompt: (prompt) => ipcRenderer.invoke('run-agy-prompt', prompt),
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', { filename, content }),
});
