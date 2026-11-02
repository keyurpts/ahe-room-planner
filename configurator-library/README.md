# Three Configurator

The Three Configurator is a modular, extensible library that combines a 3D viewer and a 2D viewer into a unified workspace. It allows developers to build interactive space configurators where users can design room layouts, position furniture models (GLTF/GLB) and swap textures/materials in real time.

## Features

- **2D Floor Planning**: Focus on the architectural layout of the room.
  - **Draw Walls**: Easily draw walls to create custom room layouts.
  - **Place Doors and Windows**: Seamlessly insert and position structural elements like doors and windows directly onto walls.
  - **Edit & Delete Structures**: Modify wall dimensions, and remove selected walls, doors, and windows from the 2D viewer.
  - **Precision Snapping**: Align and connect walls and structural elements accurately.
  - **Export and Import Layout**: Save (export) the current 2D layout or load (import) an existing layout using structured JSON data.
- **3D Visualization and Configuration**: Experience designs in a fully interactive environment.
  - **View & Navigate 3D Layout**: View a fully interactive 3D representation of the layout drawn in 2D mode, and explore the room using various intuitive camera controls.
  - **Place Models**: Seamlessly position furniture, kitchen components, and bathroom models directly into the 3D viewer.
  - **Customize Objects**: Modify placed models by changing materials and textures, or by performing copy, delete, and replace operations.
  - **Show Measurements**: Display accurate distance measurements from model to model or from a model to the nearest wall.
  - **Realistic Lighting & VR Support**: Render high-quality lighting that enhances visual realism, with Virtual Reality (VR) rendering for immersive walkthroughs.

## Installation

```bash
npm install ../path/to/three-configurator
```

## Instantiation of FloorplanManager

The `FloorplanManager` class acts as the primary coordinator for the library, managing both the 2D and 3D viewers.

### Step 1: Import the FloorplanManager
Import the coordinator class into your component file:

```typescript
import { FloorplanManager } from "three-configurator";
```

### Step 2: Instantiate the Coordinator
Create a single persistent instance of the manager class:

```typescript
const floorplanManager = new FloorplanManager();
```

### Step 3: Initialize the HTML Containers
Create the 2D and 3D `div` containers in your application and pass their references to the `init()` method:

```typescript
floorplanManager.init(container2D, container3D);
```

> [!IMPORTANT]
> **Data & View Persistence**: To switch views, you should toggle the visibility of these containers (e.g. using `display: none` and `display: block`), instead of unmounting or destroying the DOM elements. This ensures that the 2D drawing data and 3D states remain intact.

### Switching Modes

```typescript
// Switch from 2D to 3D
const success = await floorplanManager.switchTo3D((hasRoom) => {
  if (!hasRoom) {
    console.log("No complete room layouts were detected.");
  }
});

if (success) {
  // Show 3D container, hide 2D container
}

// Switch from 3D back to 2D
floorplanManager.switchTo2D();
// Show 2D container, hide 3D container
```

## Basic Usage Example (React)

```tsx
import { useEffect, useRef, useState } from "react";
import { FloorplanManager } from "three-configurator";

export default function App() {
  const ref2D = useRef<HTMLDivElement | null>(null);
  const ref3D = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const managerRef = useRef<FloorplanManager | null>(null);

  useEffect(() => {
    if (ref2D.current && ref3D.current) {
      const manager = new FloorplanManager();
      manager.init(ref2D.current, ref3D.current);
      managerRef.current = manager;

      return () => {
        manager.dispose();
      };
    }
  }, []);

  const handleToggleView = async (mode: "2D" | "3D") => {
    if (!managerRef.current) return;
    if (mode === "3D") {
      const success = await managerRef.current.switchTo3D();
      if (success) setViewMode("3D");
    } else {
      managerRef.current.switchTo2D();
      setViewMode("2D");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
        <button onClick={() => handleToggleView("2D")} disabled={viewMode === "2D"}>2D View</button>
        <button onClick={() => handleToggleView("3D")} disabled={viewMode === "3D"} style={{ marginLeft: "10px" }}>3D View</button>
      </header>

      <main style={{ flex: 1, position: "relative" }}>
        <div ref={ref2D} style={{ width: "100%", height: "100%", display: viewMode === "2D" ? "block" : "none" }} />
        <div ref={ref3D} style={{ width: "100%", height: "100%", display: viewMode === "3D" ? "block" : "none" }} />
      </main>
    </div>
  );
}
```

## Scripts

The library includes the following npm scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | **Standard build.** Generates ESM, CommonJS, and UMD bundles plus type declarations in `dist/`. |
| `npm run build:prod` | **Production build.** Runs `build`, then obfuscates the output into `dist-obfuscated/` and copies the type declarations and image assets alongside it. |
| `npm run watch` | Rebuilds on file changes. |
| `npm run preview` | Previews the production build locally. |

## Building for Production

For a normal, readable build:

```bash
npm run build
```

This generates `three-configurator.{es,cjs,umd}.js` and type declarations in `dist/`.

To produce an obfuscated build for distribution:

```bash
npm run build:prod
```

This writes the obfuscated bundles to `dist-obfuscated/`.

## License

Prototech Solutions
