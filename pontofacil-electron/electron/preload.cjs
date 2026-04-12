const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    platform: process.platform,
    auth: {
        setAuth: (data) => ipcRenderer.invoke('set-auth', data),
        getAuth: () => ipcRenderer.invoke('get-auth'),
        clearAuth: () => ipcRenderer.invoke('clear-auth'),
    },
    files: {
        save: (defaultName, content, filters) => ipcRenderer.invoke('save-file', { defaultName, content, filters }),
    }
});
