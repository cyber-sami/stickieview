const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('stickyAPI', {
  // Boards
  saveBoard: (filename, data) => ipcRenderer.invoke('save-board', filename, data),
  loadBoards: () => ipcRenderer.invoke('load-boards'),
  deleteBoard: (filename) => ipcRenderer.invoke('delete-board', filename),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  setStoragePath: (p) => ipcRenderer.invoke('set-storage-path', p),

  // License
  saveLicense: (key) => ipcRenderer.invoke('save-license', key),
  getLicense: () => ipcRenderer.invoke('get-license'),
  removeLicense: () => ipcRenderer.invoke('remove-license'),

  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  setLaunchAtStartup: (enabled) => ipcRenderer.invoke('set-launch-at-startup', enabled),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
})
