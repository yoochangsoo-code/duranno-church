const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runAgyPrompt: (payload) => ipcRenderer.invoke('run-agy-prompt', payload),
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', { filename, content }),
});
