# Stickieview — Claude Code Build Prompt (v2)

Build a cross-platform desktop sticky note dashboard app called **Stickieview** using **Electron + React + Vite**.

---

## Stack

- **Electron** (desktop shell, cross-platform: Linux/Windows/Mac)
- **React 18 + Vite** (UI renderer in the Electron renderer process)
- **Zustand** for in-memory state management
- **Plain fs/JSON files** for persistence (one JSON file per board/tab, stored in `~/Stickieview/`)
- **electron-store** for app config/settings (license key, preferences)
- **electron-builder** for packaging (.AppImage, .exe, .dmg)
- No database. No internet required. Fully offline after purchase validation.

---

## Project Structure

```
stickieview/
├── electron/
│   ├── main.js           # Electron main process
│   └── preload.js        # Context bridge (IPC)
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── TabBar.jsx
│   │   ├── StickyNote.jsx
│   │   ├── Board.jsx
│   │   ├── Toolbar.jsx
│   │   ├── LicenseModal.jsx
│   │   └── UpgradePrompt.jsx
│   ├── hooks/
│   │   └── useBoard.js
│   ├── store/
│   │   └── boardStore.js
│   └── main.jsx
├── package.json
├── vite.config.js
└── electron-builder.yml
```

---

## Freemium Model

### Free tier
- Up to **3 dashboard tabs**
- All features fully unlocked within those tabs (colors, drag, resize, backgrounds, etc.)
- No expiry, no nag screens — genuinely useful for free

### Paid tier — $9.99 one-time
- **Unlimited tabs**
- Subtle "⭐ Supporter" badge shown in the toolbar (not intrusive)
- Unlocked via a license key entered in-app

### License key flow
1. User buys on Gumroad/LemonSqueezy → receives a license key by email
2. In app: click "Unlock Unlimited" button (shown when tab limit is reached, or in settings)
3. User enters key in `LicenseModal`
4. App sends key to a validation endpoint (or validates locally — see below)
5. On success: key is saved to electron-store config, `isLicensed = true`

### License validation (keep it simple for v1)
Use **local validation only for now** — no server needed:
- Generate keys with a simple algorithm (e.g. UUID v4 with a known prefix: `SV-XXXX-XXXX-XXXX`)
- Store valid keys in a JSON file on your server or as a Gumroad webhook
- For v1: just check that the key format matches `SV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}` and store it
- Add real server validation later if needed

```js
// licenseUtils.js
const LICENSE_PREFIX = 'SV-';
const LICENSE_REGEX = /^SV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function validateLicenseKey(key) {
  return LICENSE_REGEX.test(key.trim().toUpperCase());
}

export function saveLicense(key) {
  // via IPC → electron-store in main process
  window.stickyAPI.saveLicense(key.trim().toUpperCase());
}
```

---

## Features

### 1. Tab Bar
- Shows named dashboard tabs
- **Free users: max 3 tabs**
- When at limit: "+" button shows `UpgradePrompt` instead of creating a tab
- Click to switch boards
- Double-click tab name to rename
- Right-click tab → context menu: Rename / Delete (with confirmation)
- Each tab = separate JSON file in storage folder

```jsx
// TabBar.jsx logic
const FREE_TAB_LIMIT = 3;
const canAddTab = isLicensed || boards.length < FREE_TAB_LIMIT;

function handleAddTab() {
  if (canAddTab) {
    createNewBoard();
  } else {
    setShowUpgradePrompt(true);
  }
}
```

### 2. UpgradePrompt component
A small, friendly modal/popover shown when free user hits the tab limit:

```
┌─────────────────────────────────────────┐
│  📌 You've used all 3 free boards        │
│                                          │
│  Unlock unlimited boards for just        │
│  $9.99 — one time, forever.              │
│                                          │
│  [Enter license key]  [Get Stickieview+] │
└─────────────────────────────────────────┘
```

- "Get Stickieview+" opens `https://stickieview.app/upgrade` in browser
- "Enter license key" opens LicenseModal
- Dismissable with Escape or clicking outside

### 3. LicenseModal component
Clean modal for entering license key:
- Input field for key (auto-uppercase, auto-format with dashes)
- "Activate" button
- Success state: "✅ Activated! Unlimited boards unlocked."
- Error state: "❌ Invalid key. Check your email from Gumroad."
- After success: modal closes, supporter badge appears in toolbar

### 4. Sticky Notes
- Click "Add Note" in toolbar → creates note at random position
- Absolutely positioned on canvas, freely draggable
- Drag via mousedown/mousemove/mouseup (NOT HTML5 drag API)
- Click body to edit (contenteditable div)
- Escape or click outside to stop editing
- Each note has:
  - Color header strip (6 colors + white)
  - Text body (Caveat font, handwriting feel)
  - "×" delete button (top-right, visible on hover)
  - Resize handle (bottom-right corner, CSS resize or custom)
  - Slight random rotation on creation (±3deg)
- Clicking a note brings it to front (z-index management)
- Notes store: id, x, y, width, height, color, content, zIndex, rotation

### 5. Background Themes
Background picker in toolbar — 5 options:
- **corkboard** — warm tan cork texture (CSS dot pattern)
- **whiteboard** — white with subtle grid lines
- **blackboard** — dark green with noise texture
- **graph** — white with blue grid (major + minor lines)
- **linen** — off-white with subtle crosshatch

Background saved per board/tab.

### 6. Toolbar
Fixed top bar (44px height):
- Left: App logo + name
- Center: Tab bar
- Right: [+ Add Note] [🎨 Background] [⚙️ Settings] [⭐ Supporter badge if licensed]

### 7. Settings Panel
Simple slide-out or modal:
- Storage folder path (default: ~/Stickieview/, changeable)
- Toggle: Launch at startup
- License section: show current key (masked), or "Activate license" button
- About: version, GitHub link

---

## Data Persistence

### Board files: `~/Stickieview/{board-name}.json`
```json
{
  "id": "uuid",
  "name": "Main",
  "background": "corkboard",
  "createdAt": "ISO date",
  "notes": [
    {
      "id": "uuid",
      "x": 120,
      "y": 200,
      "width": 200,
      "height": 160,
      "color": "yellow",
      "content": "Ship the thing 🚀",
      "zIndex": 3,
      "rotation": -2.1
    }
  ]
}
```

### App config: electron-store (`config.json`)
```json
{
  "licenseKey": "SV-XXXX-XXXX-XXXX",
  "isLicensed": true,
  "storagePath": "/home/user/Stickieview",
  "launchAtStartup": false,
  "lastActiveBoard": "uuid"
}
```

Auto-save: debounced 500ms after any change.

---

## IPC Bridge (preload.js)

```js
window.stickyAPI = {
  // Boards
  saveBoard: (filename, data) => ipcRenderer.invoke('save-board', filename, data),
  loadBoards: () => ipcRenderer.invoke('load-boards'),
  deleteBoard: (filename) => ipcRenderer.invoke('delete-board', filename),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  setStoragePath: (path) => ipcRenderer.invoke('set-storage-path', path),

  // License
  saveLicense: (key) => ipcRenderer.invoke('save-license', key),
  getLicense: () => ipcRenderer.invoke('get-license'),
  removeLicense: () => ipcRenderer.invoke('remove-license'),

  // Settings
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  setLaunchAtStartup: (enabled) => ipcRenderer.invoke('set-launch-at-startup', enabled),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
}
```

---

## Electron Main Process (main.js)

- Window: 1280×800 default, min 800×600, resizable
- Storage: `path.join(os.homedir(), 'Stickieview')`
- Create folder on first launch
- Handle all IPC handlers for fs, electron-store, shell
- Auto-launch: use `electron-auto-launch` package
- `app.setLoginItemSettings()` for startup toggle

---

## Zustand Store

```js
// boardStore.js
{
  // State
  boards: [],
  activeBoard: null,
  isLicensed: false,
  config: {},

  // Board actions
  addBoard, removeBoard, renameBoard, setActiveBoard, setBackground,

  // Note actions
  addNote, updateNote, removeNote,
  updateNotePosition,   // called on drag end
  updateNoteSize,       // called on resize end
  bringToFront,         // update zIndex

  // License
  setLicensed,

  // Init
  loadFromDisk,         // called on app start
}
```

---

## UI Design

**Aesthetic: Warm, tactile, physical workspace feel**

**Fonts:**
- Note content: `'Caveat'` (Google Fonts) — handwriting feel
- UI chrome: `'DM Sans'` — clean, modern

**Note colors:**
```css
--note-yellow: #FFF176;
--note-pink:   #F8BBD0;
--note-blue:   #B3E5FC;
--note-green:  #C8E6C9;
--note-purple: #E1BEE7;
--note-orange: #FFE0B2;
--note-white:  #FAFAFA;
```

**Note style:**
```css
.sticky-note {
  border-radius: 3px;
  box-shadow: 3px 4px 14px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1);
  position: absolute;
  cursor: grab;
  user-select: none;
}
.sticky-note.dragging { cursor: grabbing; box-shadow: 8px 12px 24px rgba(0,0,0,0.3); }
```

**Toolbar:**
```css
.toolbar {
  height: 44px;
  background: rgba(240, 230, 215, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
```

**Background CSS:**
```css
/* Corkboard */
.bg-corkboard {
  background-color: #c4956a;
  background-image: url("data:image/svg+xml,...cork dot pattern...");
}

/* Whiteboard */
.bg-whiteboard {
  background-color: #fff;
  background-image:
    linear-gradient(#e5e5e5 1px, transparent 1px),
    linear-gradient(90deg, #e5e5e5 1px, transparent 1px);
  background-size: 30px 30px;
}

/* Blackboard */
.bg-blackboard { background-color: #2d4a3e; }

/* Graph paper */
.bg-graph {
  background-color: #f8faff;
  background-image:
    linear-gradient(rgba(99,140,200,0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,140,200,0.3) 1px, transparent 1px),
    linear-gradient(rgba(99,140,200,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,140,200,0.08) 1px, transparent 1px);
  background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
}

/* Linen */
.bg-linen {
  background-color: #f5f0e8;
  background-image: repeating-linear-gradient(
    45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px,
    transparent 1px, transparent 6px
  );
}
```

---

## package.json (key deps)

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "zustand": "^4",
    "electron-store": "^8",
    "electron-auto-launch": "^5",
    "uuid": "^9"
  },
  "devDependencies": {
    "electron": "^28",
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "electron-builder": "^24",
    "concurrently": "^8",
    "wait-on": "^7"
  },
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build && electron-builder",
    "preview": "electron ."
  },
  "main": "electron/main.js"
}
```

---

## electron-builder.yml

```yaml
appId: app.stickieview
productName: Stickieview
directories:
  output: dist-electron
files:
  - dist/**
  - electron/**
  - node_modules/**
linux:
  target:
    - AppImage
    - deb
  category: Utility
  icon: assets/icon.png
win:
  target: nsis
  icon: assets/icon.ico
mac:
  target: dmg
  icon: assets/icon.icns
```

---

## Build Order for Claude Code

Build in this order:

1. **Electron shell** — main.js, preload.js, basic window
2. **Vite + React setup** — verify renderer loads in Electron
3. **IPC handlers** — file save/load, config, license
4. **Zustand store** — boards, notes, license state
5. **Board + Note components** — render, drag, edit, delete
6. **Tab bar** — switching, adding (with FREE_TAB_LIMIT guard)
7. **Background picker** — 5 themes
8. **UpgradePrompt + LicenseModal** — freemium gate
9. **Settings panel** — storage path, startup toggle, license info
10. **Polish** — animations, fonts, shadows, transitions

---

## README.md

Include:
```
# Stickieview

A fast, local, offline sticky note dashboard for your desktop.

## Dev setup
npm install
npm run dev

## Build
npm run build
# Output: dist-electron/

## Storage
Notes are saved as JSON in ~/Stickieview/
Sync with Syncthing, Dropbox, or any file sync tool.

## License
Free: up to 3 boards
Stickieview+ ($9.99 one-time): unlimited boards
Buy at: https://stickieview.app/upgrade
```
