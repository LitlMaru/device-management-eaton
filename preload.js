  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      invoke: (...args) => ipcRenderer.invoke(...args),
    }
  });

  contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
  });

  contextBridge.exposeInMainWorld("env", {
    HOST: process.env.HOST || "http://localhost",
    PORT: process.env.PORT || 3000,
    PEPE: "HOLA"
  });

  console.log("preload preloaded")