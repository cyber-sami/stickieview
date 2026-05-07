# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo visibility

This repo is **currently private** but will be made **public once the app ships**. Write all code as if it's already public — no hardcoded keys, tokens, test license keys, internal URLs, or anything that would be embarrassing/dangerous in the open.

## What is Stickieview

Cross-platform desktop sticky note dashboard. Electron shell + React/Vite renderer. Fully offline, no database. Notes persist as plain JSON files in `~/Stickieview/`. App config (license, settings) stored via `electron-store`.

## Dev commands

```bash
npm install
npm run dev        # starts Vite dev server + Electron concurrently
npm run build      # Vite build → electron-builder packages to dist-electron/
npm run preview    # runs Electron against already-built renderer
```

## Architecture

Two Electron processes with a strict context-bridge boundary:

**Main process** (`electron/main.js`)
- Creates the BrowserWindow (1280×800, min 800×600)
- Handles all IPC handlers: `save-board`, `load-boards`, `delete-board`, `get/set-storage-path`, `save/get/remove-license`, `get/set-config`, `set-launch-at-startup`, `open-external`
- Storage root: `~/Stickieview/` — one JSON file per board, created on first launch
- Uses `electron-store` for app config and `electron-auto-launch` for startup toggle

**Preload** (`electron/preload.js`)
- Exposes `window.stickyAPI` via `contextBridge` — the only way renderer touches the filesystem

**Renderer** (`src/`)
- `boardStore.js` (Zustand) — single source of truth for boards, notes, license state, and config. Initialized via `loadFromDisk()` on app start. Auto-saves with 500 ms debounce.
- `App.jsx` — top-level layout: Toolbar (with TabBar) + Board canvas
- Components: `TabBar`, `Board`, `StickyNote`, `Toolbar`, `LicenseModal`, `UpgradePrompt`, `SettingsPanel`
- `useBoard.js` hook — thin wrapper over store for component convenience

## Freemium gate

`FREE_TAB_LIMIT = 3` enforced in `TabBar.jsx`. When hit, the "+" button renders `UpgradePrompt` instead of creating a tab. License key format: `SV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}`. V1 validates format only (no server call). `isLicensed` flag and key stored in electron-store, read from store on startup.

## Board JSON schema

```json
{
  "id": "uuid",
  "name": "Main",
  "background": "corkboard",
  "createdAt": "ISO date",
  "notes": [
    { "id": "uuid", "x": 120, "y": 200, "width": 200, "height": 160,
      "color": "yellow", "content": "text", "zIndex": 3, "rotation": -2.1 }
  ]
}
```

## UI conventions

- Fonts: `Caveat` (note content, handwriting feel), `DM Sans` (UI chrome)
- Note colors: yellow `#FFF176`, pink `#F8BBD0`, blue `#B3E5FC`, green `#C8E6C9`, purple `#E1BEE7`, orange `#FFE0B2`, white `#FAFAFA`
- Drag via raw `mousedown/mousemove/mouseup` — never HTML5 drag API
- z-index managed manually; clicking a note calls `bringToFront()`
- Background themes: `corkboard`, `whiteboard`, `blackboard`, `graph`, `linen` — CSS-only, saved per board

## Build order (when scaffolding from scratch)

1. Electron shell (main.js, preload.js, window)
2. Vite + React wired into Electron renderer
3. IPC handlers + electron-store
4. Zustand store
5. Board + StickyNote components (drag, edit, delete)
6. TabBar with FREE_TAB_LIMIT guard
7. Background picker
8. UpgradePrompt + LicenseModal
9. SettingsPanel
10. Polish (animations, fonts, shadows)

## Packaging

`electron-builder.yml` outputs to `dist-electron/`. Targets: Linux (AppImage + deb), Windows (NSIS), macOS (dmg). App ID: `app.stickieview`.
