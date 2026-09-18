# Room Configurator Frontend

A React + Vite + TypeScript application that provides the UI for a 3D room
configurator. It consumes the [`three-configurator`](../../Library/three-configurator)
library for all scene, 2D floor-plan and 3D rendering logic, and adds the
panels, furniture catalog, texture/color pickers and view controls on top.

Built with React 18, Vite, TypeScript, Tailwind CSS, MUI and HeroUI.

## Prerequisites

This app does **not** import `three-configurator` from npm — it resolves it
from the local library build via a Vite alias (see
[`vite.config.ts`](vite.config.ts)):

```
three-configurator → ../../Library/three-configurator/dist-obfuscated/three-configurator.es.js
```

So you must build the library first:

```bash
cd ../../Library/three-configurator
npm install
npm run build:prod        # produces dist-obfuscated/ that this app aliases to
```

Then install this app's dependencies:

```bash
npm install
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (with HTTPS via basic-ssl) at `https://localhost:5173`. Source is **not** obfuscated in dev. |
| `npm run dev:all` | Start all three projects together: the **library** (watch/rebuild), the **backend** API, and this **frontend** dev server. See below. |
| `npm run dev:lib` | Start only the `three-configurator` library in watch mode (rebuilds `dist/` on change). |
| `npm run dev:backend` | Start only the floor-plan-detection FastAPI backend on `http://localhost:9000`. |
| `npm run build` | **Standard production build** into `dist/`. No obfuscation. |
| `npm run build:prod` | Same build, but with `--mode obfuscated` so the app's own source is obfuscated. |
| `npm run lint` | Run ESLint over the `.ts`/`.tsx` sources. |
| `npm run preview` | Preview a production build locally. |

## Running everything together (`dev:all`)

From this folder, one command starts all three projects via
[`concurrently`](https://www.npmjs.com/package/concurrently):

```bash
npm run dev:all
```

| Tag | Project | Command | URL |
| --- | --- | --- | --- |
| `lib` | `three-configurator` | `npm run watch` (Vite `build --watch`) | — (rebuilds `dist/`) |
| `api` | `floor-plan-detection-service` | `uvicorn app.main:app --port 9000 --reload` | `http://localhost:9000` |
| `web` | this app | `vite --host` | `https://localhost:5173` |

Notes:

- **In dev, the app aliases `three-configurator` to the library's plain `dist/`**
  build (not `dist-obfuscated/`) — see [`vite.config.ts`](vite.config.ts). That's
  faster, gives source maps, and is kept fresh by the `lib` watch process.
  Production builds still consume `dist-obfuscated/`. So the library must have
  been built at least once (`cd ../../Library/three-configurator && npm run build`).
- **The backend requires a Python environment with its dependencies installed
  and `uvicorn` on `PATH`** (see
  [floor-plan-detection-service README](../../Backend/floor-plan-detection-service/app/README.md)).
  If the env isn't active, the `api` process will fail to start — `lib` and `web`
  keep running regardless (the script intentionally does **not** use
  `--kill-others`). The frontend calls the API at `http://localhost:9000/api/v1/detect`.
- The library matches port-free; the backend uses `9000` and the web app `5173`
  (Vite picks the next free port if `5173` is taken).

### Obfuscation

Obfuscation is wired into [`vite.config.ts`](vite.config.ts) and only runs when
Vite is started in `obfuscated` mode (i.e. `npm run build:prod`). A normal
`npm run build` and the dev server are left untouched. `node_modules` and the
already-obfuscated library output are excluded.

A custom `copy-configurator-assets` Vite plugin copies the library's image
assets from `../../Library/three-configurator/public/image` into
`dist/assets/image` after each production build, because the library loads
those assets relative to its bundled JS.

## Project structure

```
src/
├── App.tsx              # Root component
├── main.tsx             # Entry point
├── ThemeContext.tsx     # Theme provider
└── components/          # UI panels and views
    ├── MainContainer.tsx
    ├── TopPanel.tsx / LeftPanel.tsx / RightPanel.tsx
    ├── TwoD.tsx / ThreeD.tsx / DesignArea.tsx
    ├── FurnitureGrid.tsx / FurnitureList.tsx / ModelPanel.tsx
    ├── TextureAndColorPanel.tsx / ReplacePanel.tsx
    └── ViewPanel.tsx / CustomViewPanel.tsx / ExistingViewPanel.tsx
```
