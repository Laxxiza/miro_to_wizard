const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startScript: (column, filePath, args) => ipcRenderer.invoke('start-script', column, filePath, args),
    onLogUpdate: (callback) => ipcRenderer.on('log-update', (event, filePath, message) => callback(filePath, message)),
    checkUpdates: () => ipcRenderer.invoke('check-updates'),
    updateApp: (callback) => ipcRenderer.on('update-app', (event, isUpdate, text) => callback(isUpdate, text))
});
