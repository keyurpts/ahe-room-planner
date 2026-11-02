[three-configurator](../index.md) / FloorplanManager

# Class: FloorplanManager

Defined in: [Components/FloorplanManager.ts:11](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L11)

Manages coordination between the 2D editor and the 3D viewer.
Handles initialization, view switching and data synchronization.

## Constructors

### Constructor

```ts
new FloorplanManager(): FloorplanManager;
```

#### Returns

`FloorplanManager`

## Accessors

### on2DModeChange

#### Set Signature

```ts
set on2DModeChange(callback): void;
```

Defined in: [Components/FloorplanManager.ts:182](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L182)

**`Description`**

Registers a callback function that is triggered whenever the active
2D interaction mode changes.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | ((`mode`) => `void`) \| `undefined` | The callback function invoked with the new `RoomEditorMode` (or `null` if none is active). Allows registering a callback function to monitor mode transitions in the 2D viewer. The registered function receives the new mode, or `null` if the viewer exits active modes. |

##### Returns

`void`

## Methods

### addPredefinedShape()

```ts
addPredefinedShape(shapeType): void;
```

Defined in: [Components/FloorplanManager.ts:481](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L481)

**`Description`**

Adds a predefined shape template to the 2D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `shapeType` | `Predefined2DShapes` | The predefined shape template to add (e.g. `Predefined2DShapes.RECTANGLE`, `Predefined2DShapes.SQUARE`, `Predefined2DShapes.L_SHAPE`, or `Predefined2DShapes.TRIANGLE`). |

#### Returns

`void`

This method loads a predefined room shape (such as a square, rectangle,
triangle, or L-shape) and adds it onto the 2D viewer.

***

### clear2DLayout()

```ts
clear2DLayout(): void;
```

Defined in: [Components/FloorplanManager.ts:382](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L382)

**`Description`**

Clears all walls, doors, windows and rooms from the 2D viewer.

#### Returns

`void`

This method resets the 2D viewer by deleting all drawn walls, doors,
windows and room spaces.

***

### clearFloorPlanBackgroundImage()

```ts
clearFloorPlanBackgroundImage(): void;
```

Defined in: [Components/FloorplanManager.ts:434](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L434)

**`Description`**

Removes the background image from the 2D floorplan viewer.

#### Returns

`void`

This method clears the background image loaded into the 2D viewer.

***

### deleteSelectedEntity()

```ts
deleteSelectedEntity(): void;
```

Defined in: [Components/FloorplanManager.ts:369](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L369)

**`Description`**

Deletes the currently selected item (such as a wall, window, or door)
from the 2D viewer.

#### Returns

`void`

This method removes the selected element from the 2D layout.

***

### dispose()

```ts
dispose(): void;
```

Defined in: [Components/FloorplanManager.ts:319](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L319)

**`Description`**

Cleans up and releases all resources used by the floorplan manager.

#### Returns

`void`

This method frees up memory by destroying the 2D viewer, the 3D viewer,
and cleaning up all active event listeners. Call this method when the
component is removed or destroyed.

***

### enableDimensions()

```ts
enableDimensions(visible): boolean;
```

Defined in: [Components/FloorplanManager.ts:220](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L220)

**`Description`**

Enables or disables the visibility of dimension annotations in the 2D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `visible` | `boolean` | `true` to display dimension annotations, `false` to hide them. |

#### Returns

`boolean`

Returns a boolean indicating the resulting visibility state.

This method toggles the visibility of wall lengths and other dimension
measurements drawn in the 2D viewer.

***

### enableGrid()

```ts
enableGrid(visible): boolean;
```

Defined in: [Components/FloorplanManager.ts:236](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L236)

**`Description`**

Enables or disables the grid overlay in the 2D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `visible` | `boolean` | `true` to display the grid overlay, `false` to hide it. |

#### Returns

`boolean`

Returns a boolean indicating the resulting visibility state.

This method toggles the visibility of helper grid lines in the 2D viewer.

***

### enableSnapping()

```ts
enableSnapping(enabled): boolean;
```

Defined in: [Components/FloorplanManager.ts:203](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L203)

**`Description`**

Enables or disables snapping behavior while drawing in the 2D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `enabled` | `boolean` | `true` to enable snapping alignment, `false` to disable it. |

#### Returns

`boolean`

Returns a boolean indicating the active snapping state.

This method enables or disables axis snapping (horizontal and vertical
line snapping) while drawing in the 2D viewer.

***

### exportJson()

```ts
exportJson(): any;
```

Defined in: [Components/FloorplanManager.ts:447](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L447)

**`Description`**

Downloads the current floorplan layout as a JSON file.

#### Returns

`any`

This method saves your current 2D layout design to a file and downloads
it to your computer as `floorplan.json`.

***

### fitToView()

```ts
fitToView(): void;
```

Defined in: [Components/FloorplanManager.ts:395](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L395)

**`Description`**

Centers and scales the 2D layout to fit the screen.

#### Returns

`void`

This method adjusts the zoom and position of the 2D viewer so that the
entire drawn layout fits within the visible viewer.

***

### getConfiguratorCore()

```ts
getConfiguratorCore(): ConfiguratorCore | undefined;
```

Defined in: [Components/FloorplanManager.ts:338](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L338)

**`Description`**

Returns the underlying 3D engine core instance.

#### Returns

[`ConfiguratorCore`](ConfiguratorCore.md) \| `undefined`

The main 3D engine manager instance, or `undefined` if not initialized.

This method provides direct access to the underlying 3D viewer
(ConfiguratorCore). This allows you to perform advanced 3D operations
such as modifying lights, controlling the 3D camera, or loading custom
3D models.

***

### highlightWalls()

```ts
highlightWalls(active, theme): void;
```

Defined in: [Components/FloorplanManager.ts:289](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L289)

**`Description`**

Highlights all walls that are not currently selected or hovered.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `active` | `boolean` | `true` to highlight walls, `false` to restore default wall colors. |
| `theme` | `string` | The active theme (`"dark"` or `"light"`). Passing `"dark"` highlights the walls in white, while `"light"` highlights them in black. |

#### Returns

`void`

This method changes the color of all walls that are not currently selected
or hovered. The color updates automatically based on the selected theme
(white for dark theme, black for light theme) to ensure they are visible.

***

### importJson()

```ts
importJson(json): void | undefined;
```

Defined in: [Components/FloorplanManager.ts:463](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L463)

**`Description`**

Loads a previously saved design back into the 2D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | `any` | The raw JSON string produced by `exportJson`. |

#### Returns

`void` \| `undefined`

This method imports a design from a raw JSON string (which was exported
using `exportJson`) and restores it on the 2D viewer.

***

### init()

```ts
init(container2D, container3D): void;
```

Defined in: [Components/FloorplanManager.ts:35](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L35)

**`Description`**

Initializes both the 2D viewer and the 3D viewer
inside their respective container elements.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container2D` | `HTMLDivElement` | The HTML element where the 2D viewer is rendered. |
| `container3D` | `HTMLDivElement` | The HTML element where the 3D viewer is rendered. |

#### Returns

`void`

This method must be called after the FloorplanManager is instantiated
and both the 2D and 3D container div elements are created.

The viewer works in one mode at a time, so the 2D and 3D containers
should toggle visibility dynamically, showing one and hiding the other.

***

### is2DDataPresent()

```ts
is2DDataPresent(): Promise<boolean>;
```

Defined in: [Components/FloorplanManager.ts:100](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L100)

**`Description`**

Checks if there is any drawing data currently present in the 2D layout.

#### Returns

`Promise`\<`boolean`\>

Returns a `Promise<boolean>` that resolves to `true` if design content
is present, and `false` otherwise.

This method checks if any elements (e.g. walls, layouts) have been drawn
in the 2D viewer.

***

### loadLayoutFromJson()

```ts
loadLayoutFromJson(jsonData): void;
```

Defined in: [Components/FloorplanManager.ts:355](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L355)

**`Description`**

Loads and draws a floorplan layout from the provided JSON data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `jsonData` | `any` | The JSON object containing the floorplan layout data. |

#### Returns

`void`

This method loads floorplan layout from the provided JSON data, draws the
walls on the 2D viewer, and automatically creates room spaces and dimension
annotations.

***

### set2DMode()

```ts
set2DMode(mode, active): void;
```

Defined in: [Components/FloorplanManager.ts:142](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L142)

**`Description`**

Sets the active drawing or interaction mode in the 2D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mode` | `string` | The interaction mode to select. Supported modes: "draw", "edit", "door", or "window". |
| `active` | `boolean` | `true` to enable the mode, `false` to disable/deactivate it. |

#### Returns

`void`

This method toggles active drawing states such as drawing walls,
inserting doors/windows, or editing existing layout in the 2D viewer.

***

### set2DUnitScale()

```ts
set2DUnitScale(cmValue): void;
```

Defined in: [Components/FloorplanManager.ts:268](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L268)

**`Description`**

Sets the size of a single grid square in centimeters.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cmValue` | `number` | The length of one grid square in centimeters. |

#### Returns

`void`

This method changes the measurement scale of the 2D viewer. All wall
lengths, door sizes and window sizes will automatically update to match
the new grid size.

***

### setDrawingOverlayVisibility()

```ts
setDrawingOverlayVisibility(visible): void;
```

Defined in: [Components/FloorplanManager.ts:305](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L305)

**`Description`**

Shows or hides all drawn elements in the 2D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `visible` | `boolean` | `true` to make the drawn layers visible, `false` to hide them. |

#### Returns

`void`

This method toggles the visibility of drawn elements (such as walls,
rooms, etc,.) in the 2D viewer.

***

### setFloorPlanBackgroundImage()

```ts
setFloorPlanBackgroundImage(
   imageUrl, 
   layoutJson, 
   isDarkTheme): void;
```

Defined in: [Components/FloorplanManager.ts:418](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L418)

**`Description`**

Sets a background image behind the 2D floorplan layout.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `imageUrl` | `string` | The URL of the background image to display. |
| `layoutJson` | `any` | The JSON object containing the floorplan layout data. |
| `isDarkTheme` | `boolean` | `true` if the viewer is in dark theme mode, `false` otherwise. |

#### Returns

`void`

This method processes the provided image and displays it in the background
of the 2D viewer. It crops the image automatically to match the boundaries
of the layout data and adjusts the colors of the image for dark/light themes.

***

### switchTo2D()

```ts
switchTo2D(): void;
```

Defined in: [Components/FloorplanManager.ts:122](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L122)

**`Description`**

Switches the view from the 3D viewer back to the 2D viewer.

#### Returns

`void`

Call this method when switching to 2D mode (e.g., on a "2D" button click)
to exit the 3D view.

***

### switchTo3D()

```ts
switchTo3D(isRoomDetected?): Promise<boolean>;
```

Defined in: [Components/FloorplanManager.ts:59](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/Components/FloorplanManager.ts#L59)

**`Description`**

Switches the view from the 2D viewer to the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `isRoomDetected?` | (`isDetected`) => `void` | Optional callback that receives `true` if a complete room layout is detected, and `false` otherwise. |

#### Returns

`Promise`\<`boolean`\>

Returns `true` if the view successfully switches to 3D.
Returns `false` if there is no drawing data to display.

Call this method when switching to 3D mode (e.g., on a "3D" button click)
to render the 2D viewer layout in the 3D viewer and control the visibility
of the 3D viewer container element.
