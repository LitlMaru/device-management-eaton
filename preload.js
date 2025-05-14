const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchData: () => ipcRenderer.invoke('fetch-data'),
  saveData: (data) => ipcRenderer.send('save-data', data)
});