# API Reference: FloorplanManager

The `FloorplanManager` acts as the primary coordinator for the library, managing both the 2D viewer and the 3D viewer.

## Methods

### `init`

Initializes both the 2D viewer and the 3D viewer inside their respective container elements.

#### Syntax

```typescript
public init(container2D: HTMLDivElement, container3D: HTMLDivElement): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `container2D` | `HTMLDivElement` | The HTML element where the 2D viewer is rendered. |
| `container3D` | `HTMLDivElement` | The HTML element where the 3D viewer is rendered. |

#### Description

This method must be called after the `FloorplanManager` is instantiated and both the 2D and 3D container `div` elements are created. Because the viewer works in one mode at a time, these container divs should toggle visibility dynamically (e.g. showing one and hiding the other).

#### React Example

```tsx
import { useEffect, useRef, useState } from "react";
import { FloorplanManager } from "three-configurator";

export default function Dashboard() {
  const ref2D = useRef<HTMLDivElement | null>(null);
  const ref3D = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");

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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header Section */}
      <header style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
        <button onClick={() => setViewMode("2D")}>2D</button>
        <button
          onClick={() => setViewMode("3D")}
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

---

### `switchTo3D`

Switches the view from 2D viewer to the 3D viewer.

#### Syntax

```typescript
public async switchTo3D(isRoomDetected?: (isDetected: boolean) => void): Promise<boolean>
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `isRoomDetected` | `(isDetected: boolean) => void` | *(Optional)* Callback function that receives `true` if a complete room layout is detected, and `false` otherwise. |

#### Description

Call this method when switching to 3D mode (e.g., on a "3D" button click) to render the 2D viewer layout in the 3D viewer and control the visibility of the 3D viewer container element.
- Returns a `Promise<boolean>` that resolves to:
  - `true` if the view successfully switches to 3D.
  - `false` if there is no drawing data to display.

#### Example

```typescript
const success = await floorplanManager.switchTo3D((hasRoom) => {
  if (!hasRoom) {
    console.log("No complete room layouts were detected; building walls only.");
  }
});

if (success) {
  // Show 3D container, hide 2D container
} else {
  alert("Cannot switch to 3D: Please draw some walls first.");
}
```

---

### `switchTo2D`

Switches the view from the 3D viewer back to the 2D viewer.

#### Syntax

```typescript
public switchTo2D(): void
```

#### Description

Call this method when switching to 2D mode (e.g., on a "2D" button click) to exit the 3D view.

#### Example

```typescript
floorplanManager.switchTo2D();
// Show 2D container, hide 3D container
```

---

### `is2DDataPresent`

Checks if there is any drawing data currently present in the 2D layout.

#### Syntax

```typescript
public async is2DDataPresent(): Promise<boolean>
```

#### Description

This method checks if any elements (e.g. walls, layouts) have been drawn in the 2D viewer.
- Returns a `Promise<boolean>` that resolves to `true` if design content is present, and `false` otherwise.

#### Example

```typescript
const hasData = await floorplanManager.is2DDataPresent();
if (hasData) {
  console.log("Layout is not empty.");
}
```

---

### `set2DMode`

Sets the active drawing or interaction mode in the 2D viewer.

#### Syntax

```typescript
public set2DMode(mode: RoomEditorMode | string, active: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `mode` | `RoomEditorMode \| string` | The interaction mode to select. Supported modes: `"draw"`, `"edit"`, `"door"`, or `"window"`. |
| `active` | `boolean` | `true` to enable the mode, `false` to disable/deactivate it. |

#### Description

This method toggles active drawing states such as drawing walls, inserting doors/windows, or editing existing layout in the 2D viewer.

#### Example

```typescript
// Enable wall drawing mode
floorplanManager.set2DMode("draw", true);

// Disable drawing mode
floorplanManager.set2DMode("draw", false);
```

---

### `on2DModeChange`

Registers a callback function that is triggered whenever the active 2D interaction mode changes.

#### Syntax

```typescript
public set on2DModeChange(callback: ((mode: RoomEditorMode | null) => void) | undefined)
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `callback` | `((mode: RoomEditorMode \| null) => void) \| undefined` | The callback function invoked with the new `RoomEditorMode` (or `null` if none is active). |

#### Description

Allows registering a callback function to monitor mode transitions in the 2D viewer. The registered function receives the new mode, or `null` if the viewer exits active modes.

#### Example

```typescript
import { RoomEditorMode } from "three-configurator";

floorplanManager.on2DModeChange = (mode) => {
  if (mode === RoomEditorMode.DRAW) {
    console.log("User is now drawing walls.");
  } else {
    console.log("Drawing mode exited.");
  }
};
```

---

### `getConfiguratorCore`

Returns the underlying 3D engine core instance.

#### Syntax

```typescript
public getConfiguratorCore(): ConfiguratorCore | undefined
```

#### Returns

| Type | Description |
| :--- | :--- |
| `ConfiguratorCore \| undefined` | The main 3D engine manager instance, or `undefined` if not initialized. |

#### Description

This method provides direct access to the underlying 3D viewer (`ConfiguratorCore`). This allows you to perform advanced 3D operations such as modifying lights, controlling the 3D camera, or loading custom 3D models.

#### Example

```typescript
const core = floorplanManager.getConfiguratorCore();
if (core) {
  // Perform custom 3D viewer modifications
  console.log("3D core engine is active:", core);
}
```

---

### `addPredefinedShape`

Adds a predefined shape template to the 2D viewer.

#### Syntax

```typescript
public addPredefinedShape(shapeType: Predefined2DShapes): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `shapeType` | `Predefined2DShapes` | The predefined shape template to add (e.g. `Predefined2DShapes.RECTANGLE`, `Predefined2DShapes.SQUARE`, `Predefined2DShapes.L_SHAPE`, or `Predefined2DShapes.TRIANGLE`). |

#### Description

This method loads a predefined room shape (such as a square, rectangle, triangle, or L-shape) and adds it onto the 2D viewer.

#### Example

```typescript
import { Predefined2DShapes } from "three-configurator";

// Add a predefined L-shape template into the viewer
floorplanManager.addPredefinedShape(Predefined2DShapes.L_SHAPE);
```

---

### `deleteSelectedEntity`

Deletes the currently selected item (such as a wall, window, or door) from the 2D viewer.

#### Syntax

```typescript
public deleteSelectedEntity(): void
```

#### Description

This method removes the selected element from the 2D layout.

#### Example

```typescript
// Delete the currently selected wall, window, or door
floorplanManager.deleteSelectedEntity();
```

---

### `clear2DLayout`

Clears all walls, doors, windows and rooms from the 2D viewer.

#### Syntax

```typescript
public clear2DLayout(): void
```

#### Description

This method resets the 2D viewer by deleting all drawn walls, doors, windows and room spaces.

#### Example

```typescript
// Clear the entire 2D viewer
floorplanManager.clear2DLayout();
```

---

### `importJson`

Loads a previously saved design back into the 2D viewer.

#### Syntax

```typescript
public importJson(json: string): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `json` | `string` | The raw JSON string produced by `ExportJson`. |

#### Description

This method imports a design from a raw JSON string (which was exported using `ExportJson`) and restores it on the 2D viewer.

#### Example

```typescript
// Load a saved floorplan design string back into the viewer
floorplanManager.importJson(savedDesignJsonString);
```

---

### `exportJson`

Downloads the current floorplan layout as a JSON file.

#### Syntax

```typescript
public exportJson(): void
```

#### Description

This method saves your current 2D layout design to a file and downloads it to your computer as `floorplan.json`.

#### Example

```typescript
// Export and download the current design as a JSON file
floorplanManager.exportJson();
```

---

### `fitToView`

Centers and scales the 2D layout to fit the screen.

#### Syntax

```typescript
public fitToView(): void
```

#### Description

This method adjusts the zoom and position of the 2D viewer so that the entire drawn layout fits within the visible viewer.

#### Example

```typescript
// Fit the current drawing layout to the viewport
floorplanManager.fitToView();
```

---

### `set2DUnitScale`

Sets the size of a single grid square in centimeters.

#### Syntax

```typescript
public set2DUnitScale(cmValue: number): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `cmValue` | `number` | The length of one grid square in centimeters. |

#### Description

This method changes the measurement scale of the 2D viewer. All wall lengths, door sizes and window sizes will automatically update to match the new grid size.

#### Example

```typescript
// Set each grid square to represent 50 cm
floorplanManager.set2DUnitScale(50);
```

---

### `enableGrid`

Enables or disables the grid overlay in the 2D viewer.

#### Syntax

```typescript
public enableGrid(visible: boolean): boolean
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `visible` | `boolean` | `true` to display the grid overlay, `false` to hide it. |

#### Description

This method toggles the visibility of helper grid lines in the 2D viewer. It returns a boolean indicating the resulting visibility state.

#### Example

```typescript
const isGridVisible = floorplanManager.enableGrid(true);
```

---

### `enableDimensions`

Enables or disables the visibility of dimension annotations in the 2D viewer.

#### Syntax

```typescript
public enableDimensions(visible: boolean): boolean
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `visible` | `boolean` | `true` to display dimension annotations, `false` to hide them. |

#### Description

This method toggles the visibility of wall lengths and other dimension measurements drawn in the 2D viewer. It returns a boolean indicating the resulting visibility state.

#### Example

```typescript
const areDimensionsVisible = floorplanManager.enableDimensions(true);
```

---

### `enableSnapping`

Enables or disables snapping behavior while drawing in the 2D viewer.

#### Syntax

```typescript
public enableSnapping(enabled: boolean): boolean
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `enabled` | `boolean` | `true` to enable snapping alignment, `false` to disable it. |

#### Description

This method enables or disables axis snapping (horizontal and vertical line snapping) while drawing in the 2D viewer. It returns a boolean indicating the active snapping state.

#### Example

```typescript
const isSnappingEnabled = floorplanManager.enableSnapping(true);
```

---

### `enableBackgroundImage`

Toggles the visibility of the background image in the 2D viewer.

#### Syntax

```typescript
public enableBackgroundImage(show: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `show` | `boolean` | `true` to make the background image visible, `false` to hide it. |

#### Description

This method controls the visibility of the background image in the 2D viewer.

#### Example

```typescript
floorplanManager.enableBackgroundImage(true);
```

---

### `loadLayoutFromJson`

Loads and draws a floorplan layout from the provided JSON data.

#### Syntax

```typescript
public loadLayoutFromJson(jsonData: any): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `jsonData` | `any` | The JSON object containing the floorplan layout data. |

#### Description

This method loads floorplan layout from the provided JSON data, draws the walls on the 2D viewer, and automatically creates room spaces and dimension annotations.


#### JSON Input Structure Example

<div style="margin-top: 16px; margin-bottom: 16px; max-height: 500px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px;">

```json
{
  "total_detections": 6,
  "counts": {
    "Window": 1,
    "Door": 1,
    "Wall": 4
  },
  "detections": [
    {
      "id": "window-1",
      "label": "Window",
      "confidence": 0.7993,
      "bbox": {
        "x1": 570,
        "y1": 114.2,
        "x2": 808.2,
        "y2": 146
      },
      "drawing_points": [
        {
          "x": 570,
          "y": 130.1
        },
        {
          "x": 808.2,
          "y": 130.1
        }
      ],
      "adjacent": [
        "wall-2"
      ]
    },
    {
      "id": "door-1",
      "label": "Door",
      "confidence": 0.78,
      "bbox": {
        "x1": 493.9,
        "y1": 973.3,
        "x2": 630.6,
        "y2": 1003.6
      },
      "drawing_points": [
        {
          "x": 493.9,
          "y": 988.4
        },
        {
          "x": 630.6,
          "y": 988.4
        }
      ],
      "adjacent": [
        "wall-1"
      ]
    },
    {
      "id": "wall-1",
      "label": "Wall",
      "confidence": 0.7368,
      "bbox": {
        "x1": 233.2,
        "y1": 982.4,
        "x2": 1165.7,
        "y2": 992.4
      },
      "drawing_points": [
        {
          "x": 248.3,
          "y": 987.4
        },
        {
          "x": 1151.2,
          "y": 987.4
        }
      ],
      "adjacent": [
        "door-1",
        "wall-3",
        "wall-4"
      ]
    },
    {
      "id": "wall-2",
      "label": "Wall",
      "confidence": 0.7226,
      "bbox": {
        "x1": 236.5,
        "y1": 125.3,
        "x2": 1171.9,
        "y2": 135.3
      },
      "drawing_points": [
        {
          "x": 248.3,
          "y": 130.3
        },
        {
          "x": 1171.9,
          "y": 130.3
        }
      ],
      "adjacent": [
        "window-1",
        "wall-3",
        "wall-4"
      ]
    },
    {
      "id": "wall-3",
      "label": "Wall",
      "confidence": 0.731,
      "bbox": {
        "x1": 243.3,
        "y1": 112.8,
        "x2": 253.3,
        "y2": 1001.5
      },
      "drawing_points": [
        {
          "x": 248.3,
          "y": 130.3
        },
        {
          "x": 248.3,
          "y": 987.4
        }
      ],
      "adjacent": [
        "wall-1",
        "wall-2"
      ]
    },
    {
      "id": "wall-4",
      "label": "Wall",
      "confidence": 0.7135,
      "bbox": {
        "x1": 1146.2,
        "y1": 115.6,
        "x2": 1156.2,
        "y2": 1001.8
      },
      "drawing_points": [
        {
          "x": 1151.2,
          "y": 130.3
        },
        {
          "x": 1151.2,
          "y": 987.4
        }
      ],
      "adjacent": [
        "wall-1",
        "wall-2"
      ]
    }
  ],
  "img_size": [
    1122,
    1402
  ]
}
```

</div>


#### Example

```typescript
const detectionData = {
  // ... (use JSON structure as shown above)
};

floorplanManager.loadLayoutFromJson(detectionData);
```

---

### `setFloorPlanBackgroundImage`

Sets a background image behind the 2D floorplan layout.

#### Syntax

```typescript
public setFloorPlanBackgroundImage(imageUrl: string, layoutJson: any, isDarkTheme: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `imageUrl` | `string` | The URL of the background image to display. |
| `layoutJson` | `any` | The JSON object containing the floorplan layout data. |
| `isDarkTheme` | `boolean` | `true` if the viewer is in dark theme mode, `false` otherwise. |

#### Description

This method processes the provided image and displays it in the background of the 2D viewer. It crops the image automatically to match the boundaries of the layout data and adjusts the colors of the image for dark/light themes.

#### Example

```typescript
const imageUrl = "https://example.com/blueprint.png";
const layoutData = { /* ... */ };

floorplanManager.setFloorPlanBackgroundImage(imageUrl, layoutData, true);
```

---

### `clearFloorPlanBackgroundImage`

Removes the background image from the 2D floorplan viewer.

#### Syntax

```typescript
public clearFloorPlanBackgroundImage(): void
```

#### Description

This method clears the background image loaded into the 2D viewer.

#### Example

```typescript
// Remove the background blueprint image from the viewer
floorplanManager.clearFloorPlanBackgroundImage();
```

---

### `setDrawingOverlayVisibility`

Shows or hides all drawn elements in the 2D viewer.

#### Syntax

```typescript
public setDrawingOverlayVisibility(visible: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `visible` | `boolean` | `true` to make the drawn layers visible, `false` to hide them. |

#### Description

This method toggles the visibility of drawn elements (such as walls, rooms, etc,.) in the 2D viewer.

#### Example

```typescript
// Hide all drawn elements
floorplanManager.setDrawingOverlayVisibility(false);
```

---

### `highlightWalls`

Highlights all walls that are not currently selected or hovered.

#### Syntax

```typescript
public highlightWalls(active: boolean, theme: string): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `active` | `boolean` | `true` to highlight walls, `false` to restore default wall colors. |
| `theme` | `string` | The active theme (`"dark"` or `"light"`). Passing `"dark"` highlights the walls in white, while `"light"` highlights them in black. |

#### Description

This method changes the color of all walls that are not currently selected or hovered. The color updates automatically based on the selected theme (white for dark theme, black for light theme) to ensure they are visible.

#### Example

```typescript
// Highlight walls in dark theme
floorplanManager.highlightWalls(true, "dark");
```

---

### `dispose`

Cleans up and releases all resources used by the floorplan manager.

#### Syntax

```typescript
public dispose(): void
```

#### Description

This method frees up memory by destroying the 2D viewer, the 3D viewer, and cleaning up all active event listeners. Call this method when the component is removed or destroyed.

#### Example

```typescript
// Clean up all resources when destroying the viewer
floorplanManager.dispose();
```
