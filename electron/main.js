const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')
const os = require('os')

let Store
let store
let AutoLaunch
let autoLaunch

async function loadDeps() {
  const storeMod = await import('electron-store')
  Store = storeMod.default
  store = new Store({
    defaults: {
      licenseKey: null,
      isLicensed: false,
      storagePath: path.join(os.homedir(), 'Stickieview'),
      launchAtStartup: false,
      lastActiveBoard: null,
    },
  })

  try {
    const alMod = await import('electron-auto-launch')
    AutoLaunch = alMod.default
    autoLaunch = new AutoLaunch({ name: 'Stickieview' })
  } catch {
    // auto-launch optional
  }
}

function getStoragePath() {
  return store ? store.get('storagePath') : path.join(os.homedir(), 'Stickieview')
}

function ensureStorageDir() {
  const dir = getStoragePath()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Stickieview',
  })

  const isDev = process.env.NODE_ENV !== 'production'
  if (isDev && !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  await loadDeps()
  ensureStorageDir()
  createWindow()
  if (app.isPackaged) setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Boards ─────────────────────────────────────────────────────────────────

ipcMain.handle('load-boards', () => {
  const dir = getStoragePath()
  ensureStorageDir()
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  return files.map(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))
    } catch {
      return null
    }
  }).filter(Boolean)
})

ipcMain.handle('save-board', (_, filename, data) => {
  const dir = getStoragePath()
  ensureStorageDir()
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2), 'utf-8')
  return true
})

ipcMain.handle('delete-board', (_, filename) => {
  const dir = getStoragePath()
  const filePath = path.join(dir, filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  return true
})

ipcMain.handle('get-storage-path', () => getStoragePath())

ipcMain.handle('set-storage-path', (_, newPath) => {
  store.set('storagePath', newPath)
  ensureStorageDir()
  return true
})

// ── License ─────────────────────────────────────────────────────────────────

ipcMain.handle('save-license', (_, key) => {
  store.set('licenseKey', key)
  store.set('isLicensed', true)
  return true
})

ipcMain.handle('get-license', () => ({
  licenseKey: store.get('licenseKey'),
  isLicensed: store.get('isLicensed'),
}))

ipcMain.handle('remove-license', () => {
  store.set('licenseKey', null)
  store.set('isLicensed', false)
  return true
})

// ── Config ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-config', () => store.store)

ipcMain.handle('set-config', (_, key, value) => {
  store.set(key, value)
  return true
})

ipcMain.handle('set-launch-at-startup', async (_, enabled) => {
  if (!autoLaunch) return false
  try {
    if (enabled) await autoLaunch.enable()
    else await autoLaunch.disable()
    store.set('launchAtStartup', enabled)
    return true
  } catch {
    return false
  }
})

// ── Shell ───────────────────────────────────────────────────────────────────

ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url)
})

// ── License validation ───────────────────────────────────────────────────────

ipcMain.handle('validate-license', async (_, key) => {
  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key, instance_name: 'Stickieview' }),
    })
    const data = await res.json()
    const valid = data?.activated === true || data?.data?.activated === true
    return { valid, data }
  } catch (err) {
    return { valid: false, error: err.message }
  }
})

// ── Auto-updater ─────────────────────────────────────────────────────────────

function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-available')
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', () => {
    // silently ignore — don't crash the app over update failures
  })

  autoUpdater.checkForUpdates()
}

ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate()
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

// ── Window controls ──────────────────────────────────────────────────────────

ipcMain.handle('window-minimize', () => mainWindow?.minimize())
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.handle('window-close', () => mainWindow?.close())
