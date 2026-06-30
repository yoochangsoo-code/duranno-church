const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runAgyPrompt: (payload) => ipcRenderer.invoke('run-agy-prompt', payload),
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', { filename, content }),
  
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),
  startBatchProcess: (config) => ipcRenderer.send('start-batch-process', config),
  cancelBatchProcess: () => ipcRenderer.send('cancel-batch-process'),
  onProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('process-progress', subscription);
    return () => ipcRenderer.removeListener('process-progress', subscription);
  },
  onFinished: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('process-finished', subscription);
    return () => ipcRenderer.removeListener('process-finished', subscription);
  },
  onError: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('process-error', subscription);
    return () => ipcRenderer.removeListener('process-error', subscription);
  }
});
