# Integration Guide

This guide demonstrates how to integrate the **Three Configurator** library into a React application.

## 1. Basic Initialization

To initialize the configurator, instantiate the `FloorplanManager` and call its `init` method with references to the 2D and 3D container elements.

```tsx
import { useEffect, useRef } from "react";
import { FloorplanManager } from "three-configurator";

export default function Configurator() {
  const ref2D = useRef<HTMLDivElement | null>(null);
  const ref3D = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref2D.current && ref3D.current) {
      const manager = new FloorplanManager();
      manager.init(ref2D.current, ref3D.current);

      return () => {
        manager.dispose();
      };
    }
  }, []);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div ref={ref2D} style={{ width: "50%", height: "100%" }} />
      <div ref={ref3D} style={{ width: "50%", height: "100%" }} />
    </div>
  );
}
```
Below is the visual outcome of the initialization code:

<img src="/initial.png" alt="Configurator Split View" @click="zoom" style="cursor: zoom-in;" />


## 2. Implementing 2D / 3D View Switching

The configurator runs in one mode at a time. You can toggle between modes using `switchTo2D()` and `switchTo3D()`.

```tsx
import { useEffect, useRef, useState } from "react";
import { FloorplanManager } from "three-configurator";

export default function Dashboard() {
    const ref2D = useRef<HTMLDivElement | null>(null);
    const ref3D = useRef<HTMLDivElement | null>(null);
    const managerRef = useRef<FloorplanManager | null>(null);
    const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");

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

    const handleSwitchTo2D = () => {
        if (managerRef.current) {
            managerRef.current.switchTo2D();
            setViewMode("2D");
        }
    };

    const handleSwitchTo3D = async () => {
        if (managerRef.current) {
            const success = await managerRef.current.switchTo3D();
            if (success) {
                setViewMode("3D");
            } else {
                alert("Cannot switch to 3D: Please draw something.");
            }
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            {/* Header Section */}
            <header style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                <button onClick={handleSwitchTo2D}>2D</button>
                <button
                    onClick={handleSwitchTo3D}
                    style={{ marginLeft: "10px" }}
                >
                    3D
                </button>
            </header>

            {/* Main Section */}
            <main style={{ flex: 1, position: "relative" }}>
                <div ref={ref2D} style={{ width: "100%", height: "100%", display: viewMode === "2D" ? "block" : "none" }} />
                <div ref={ref3D} style={{ width: "100%", height: "100%", display: viewMode === "3D" ? "block" : "none" }} />
            </main>
        </div>
    );
}
```

Below is the visual outcome of the view switching code:

<img src="/2d-3d.png" alt="Configurator Toggle View" @click="zoom" style="cursor: zoom-in;" />


## 3. Drawing Walls in 2D Viewer

To trigger wall drawing mode in the 2D viewer, call `set2DMode`:

```tsx
<button onClick={() => managerRef.current?.set2DMode("draw", true)}>
  Draw Wall
</button>
```

Below is the outcome of the wall drawing in 2D and 3D views:

<div style="display: flex; gap: 10px; margin-top: 15px;">
  <img src="/draw-2d.png" alt="2D Draw Mode" @click="zoom" style="width: 49%; cursor: zoom-in; object-fit: contain;" />
  <img src="/draw-3d.png" alt="3D Draw Mode" @click="zoom" style="width: 49%; cursor: zoom-in; object-fit: contain;" />
</div>

## 4. Placing Windows in 2D Viewer

To trigger window placement mode in the 2D viewer, add a button that calls `set2DMode`:

```tsx
<button onClick={() => managerRef.current?.set2DMode("window", true)}>
  Add Window
</button>
```

Below is the outcome of placing windows in the 2D viewer:

<img src="/window-2d.png" alt="2D Window Placement" @click="zoom" style="cursor: zoom-in;" />

## 5. Placing Doors in 2D Viewer

To trigger door placement mode in the 2D viewer, add a button that calls `set2DMode`:

```tsx
<button onClick={() => managerRef.current?.set2DMode("door", true)}>
  Add Door
</button>
```

Below is the outcome of placing doors in the 2D viewer:

<img src="/door-2d.png" alt="2D Door Placement" @click="zoom" style="cursor: zoom-in;" />


## 6. Changing Wall Color

To change the wall color in 3D mode, obtain the underlying `ConfiguratorCore` instance from the `FloorplanManager` and use the `applyColorToAllWalls` method:

```tsx
const configuratorCore = managerRef.current?.getConfiguratorCore();
if (configuratorCore) {
  configuratorCore.applyColorToAllWalls("#8ae2dbff");
}
```

Below is the outcome of changing the wall color in the 3D viewer:

<img src="/wall-color.png" alt="Painting Walls" @click="zoom" style="cursor: zoom-in;" />

## 7. Changing Wall Texture

To apply a texture to all room walls in 3D mode, obtain the `ConfiguratorCore` instance and call the `applyTextureToAllWalls` method:

```tsx
const configuratorCore = managerRef.current?.getConfiguratorCore();
if (configuratorCore) {
  configuratorCore.applyTextureToAllWalls({
    url: "/texture.png",
    repeatX: 1.0,
    repeatY: 1.0
  });
}
```

Below is the outcome of applying a texture in the 3D viewer:

<img src="/wall-texture.png" alt="Applying Texture to Walls" @click="zoom" style="cursor: zoom-in;" />

## 8. Changing Floor Texture

To apply a texture to all floors in 3D mode, obtain the `ConfiguratorCore` instance and call the `applyTextureToAllFloors` method:

```tsx
const configuratorCore = managerRef.current?.getConfiguratorCore();
if (configuratorCore) {
  configuratorCore.applyTextureToAllFloors({
    url: "/texture.png",
    repeatX: 1.0,
    repeatY: 1.0
  });
}
```

Below is the outcome of applying a texture to the floors in the 3D viewer:

<img src="/floor-texture.png" alt="Applying Texture to Floors" @click="zoom" style="cursor: zoom-in;" />

## 9. Loading 3D Models

To load and interactively place 3D models in the room:

```tsx
const configuratorCore = managerRef.current?.getConfiguratorCore();
if (configuratorCore) {
  configuratorCore.loadModel(
    "/chair_1.glb", // URL to the GLB model file
    true,           // isPreview: Enables interactive drag-to-place preview
    undefined,      // position
    undefined,      // rotation
    undefined,      // callbacks
    true,           // isSelectable
    { category: "furniture", name: "Chair", id: "chair_1" } // metadata
  );
}
```

Below is the outcome of placing various 3D models in the room using the interactive panel:

<img src="/load-model.png" alt="3D Model Loading" @click="zoom" style="cursor: zoom-in;" />

## 10. Model Manipulation (Translate & Rotate Modes)

To switch the transform controls mode of selected 3D models between translation (movement) and rotation:

```tsx
import { TransformControlsMode } from "three-configurator";

const configuratorCore = managerRef.current?.getConfiguratorCore();
if (configuratorCore) {
  // Switch to Translate mode
  configuratorCore.setTransformMode(TransformControlsMode.TRANSLATE);

  // Switch to Rotate mode 
  configuratorCore.setTransformMode(TransformControlsMode.ROTATE);
}
```

Below is the outcome of manipulating a model in translate and rotate modes within the 3D viewer:

<div style="display: flex; gap: 10px; margin-top: 15px;">
  <img src="/translate-mode.png" alt="Transform Translate Mode" @click="zoom" style="width: 49%; cursor: zoom-in; object-fit: contain;" />
  <img src="/rotate-mode.png" alt="Transform Rotate Mode" @click="zoom" style="width: 49%; cursor: zoom-in; object-fit: contain;" />
</div>



<script setup>
const zoom = (e) => {
  const el = document.createElement('div');
  el.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:grid;place-items:center;cursor:zoom-out;';
  el.innerHTML = `<span style="position:absolute;top:20px;right:30px;color:#fff;font-size:40px;font-weight:bold;cursor:pointer;">&times;</span><img src="${e.target.src}" style="max-width:90%;max-height:90%;object-fit:contain;box-shadow:0 0 20px rgba(0,0,0,0.5);">`;
  el.onclick = () => el.remove();
  document.body.appendChild(el);
}
</script>

