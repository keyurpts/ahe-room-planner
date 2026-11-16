[three-configurator](../index.md) / Design2D

# Class: Design2D

Defined in: [Components/Design2D.ts:88](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L88)

Design2D class handles the 2D floorplan editor using Konva.js.
It manages layers for grid, floorplan elements, and interactions.

## Constructors

### Constructor

```ts
new Design2D(container): Design2D;
```

Defined in: [Components/Design2D.ts:342](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L342)

Initializes the 2D designer within the provided container.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container` | `HTMLDivElement` | The HTML element to host the Konva stage. |

#### Returns

`Design2D`

## Properties

### On2DModeChange?

```ts
optional On2DModeChange?: (mode) => void;
```

Defined in: [Components/Design2D.ts:216](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L216)

Callback for mode changes

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mode` | `RoomEditorMode` \| `null` |

#### Returns

`void`

## Methods

### activeSnapping()

```ts
activeSnapping(enabled): boolean;
```

Defined in: [Components/Design2D.ts:4724](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4724)

Enables or disables axis snapping (horizontal/vertical line snapping).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `enabled` | `boolean` | Whether axis snapping should be enabled |

#### Returns

`boolean`

The current state of axis snapping

***

### addPredefinedShape()

```ts
addPredefinedShape(shapeType, isPreview): void;
```

Defined in: [Components/Design2D.ts:6535](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L6535)

Adds a predefined shape layout to the canvas as a draggable preview group.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `shapeType` | `Predefined2DShapes` | The predefined shape JSON string (representing L-Shape, Rectangle, Triangle, or Square). |
| `isPreview` | `boolean` | - |

#### Returns

`void`

***

### clearAIBackgroundImage()

```ts
clearAIBackgroundImage(): void;
```

Defined in: [Components/Design2D.ts:6275](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L6275)

Clears the AI background image from the floorplan.

#### Returns

`void`

***

### clearAll()

```ts
clearAll(): void;
```

Defined in: [Components/Design2D.ts:5832](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L5832)

Clears all 2D drawings from the canvas.

#### Returns

`void`

***

### createGrid()

```ts
createGrid(): void;
```

Defined in: [Components/Design2D.ts:4663](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4663)

Creates a large grid for visual reference.

#### Returns

`void`

***

### deleteSelectedEntity()

```ts
deleteSelectedEntity(): void;
```

Defined in: [Components/Design2D.ts:5750](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L5750)

Deletes the currently selected entity.
Supports selected walls, window, and door.

#### Returns

`void`

***

### dispose()

```ts
dispose(): void;
```

Defined in: [Components/Design2D.ts:4769](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4769)

Cleans up resources when the component is destroyed.

#### Returns

`void`

***

### draw()

```ts
draw(): void;
```

Defined in: [Components/Design2D.ts:4626](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4626)

Renders the entire floorplan to the stage.

#### Returns

`void`

***

### drawFromJson()

```ts
drawFromJson(jsonData): void;
```

Defined in: [Components/Design2D.ts:5547](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L5547)

Draws the layout based on the provided JSON data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `jsonData` | `any` | The JSON object containing detections with drawing points for walls. |

#### Returns

`void`

***

### enableGrid()

```ts
enableGrid(visible): boolean;
```

Defined in: [Components/Design2D.ts:4709](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4709)

Enables or disables the grid visibility.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `visible` | `boolean` | Whether the grid should be visible |

#### Returns

`boolean`

The current state of grid visibility

***

### enableJunctionDragging()

```ts
enableJunctionDragging(enabled): boolean;
```

Defined in: [Components/Design2D.ts:4745](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4745)

Enables or disables junction dragging (in EDIT mode).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `enabled` | `boolean` | Whether junction dragging should be enabled |

#### Returns

`boolean`

The current state of junction dragging

***

### enableWallDragging()

```ts
enableWallDragging(enabled): boolean;
```

Defined in: [Components/Design2D.ts:4735](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4735)

Enables or disables wall dragging (in EDIT mode).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `enabled` | `boolean` | Whether wall dragging should be enabled |

#### Returns

`boolean`

The current state of wall dragging

***

### exportJson()

```ts
exportJson(): any;
```

Defined in: [Components/Design2D.ts:6446](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L6446)

Exports the current Konva stage as a JSON file download.

#### Returns

`any`

***

### fitLayout()

```ts
fitLayout(): void;
```

Defined in: [Components/Design2D.ts:5689](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L5689)

Automatically scales and centers the drawing to fit the canvas view.

#### Returns

`void`

***

### get2ddata()

```ts
get2ddata(): Promise<{
  houseBoundary: Room | null;
  layer: any;
  roomsLayer: any;
  unit_conversion_factor: number;
}>;
```

Defined in: [Components/Design2D.ts:4810](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4810)

Exports the 2D floorplan layout, detected rooms, house boundaries, and unit scale.

#### Returns

`Promise`\<\{
  `houseBoundary`: `Room` \| `null`;
  `layer`: `any`;
  `roomsLayer`: `any`;
  `unit_conversion_factor`: `number`;
\}\>

A promise resolving to the floorplan data.

***

### getHouseBoundary()

```ts
getHouseBoundary(wallData?): Promise<Room | null>;
```

Defined in: [Components/Design2D.ts:4799](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4799)

Detects the outer boundary of the complete house.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `wallData?` | `WallUserData`[] | Optional array of structured wall data. |

#### Returns

`Promise`\<`Room` \| `null`\>

The house boundary room or null.

***

### getUndoRedoPayload()

```ts
getUndoRedoPayload(): Undo_Redo_Payload;
```

Defined in: [Components/Design2D.ts:6619](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L6619)

Get the undo-redo-satck size

#### Returns

`Undo_Redo_Payload`

payload

***

### highlightWalls()

```ts
highlightWalls(active, theme): void;
```

Defined in: [Components/Design2D.ts:1143](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L1143)

Applies or removes a highlight colour across all walls in their default state.

Walls currently selected (PREVIEW_STROKE) or hovered (HOVER_STROKE) are
intentionally skipped so their system colours are not overwritten.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `active` | `boolean` | true to enable highlight, false to restore default wall colour |
| `theme` | `string` | "dark" → white highlight, any other value → black highlight |

#### Returns

`void`

***

### loadKonvaJson()

```ts
loadKonvaJson(json): void;
```

Defined in: [Components/Design2D.ts:6469](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L6469)

Loads a previously exported Konva stage JSON, replaces
all layers on the current stage, and re-binds internal
references that were destroyed during the process.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | `any` | Raw JSON string produced by `exportJson` |

#### Returns

`void`

***

### redo()

```ts
redo(): void;
```

Defined in: [Components/Design2D.ts:405](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L405)

Redo

#### Returns

`void`

***

### setAIBackgroundImage()

```ts
setAIBackgroundImage(
   imageUrl, 
   layoutJson, 
   isDarkTheme): void;
```

Defined in: [Components/Design2D.ts:6205](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L6205)

Sets the AI background image for the floorplan.
Processes the image using an offscreen canvas, applies cropping based on layout detection,
and dynamically updates pixels to support both light and dark themes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `imageUrl` | `string` |
| `layoutJson` | `any` |
| `isDarkTheme` | `boolean` |

#### Returns

`void`

***

### setDrawingLayersVisibility()

```ts
setDrawingLayersVisibility(visible): void;
```

Defined in: [Components/Design2D.ts:1180](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L1180)

Shows or hides the layers that render the user's drawing
(walls, room fills, room labels, and interactive elements),
independent of the background image layer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `visible` | `boolean` | Whether the drawing layers should be visible |

#### Returns

`void`

***

### setKonvaUnitScale()

```ts
setKonvaUnitScale(cmValue): void;
```

Defined in: [Components/Design2D.ts:4390](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4390)

Sets the unit converison factor

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cmValue` | `number` | The number of centimeters represented by one grid. |

#### Returns

`void`

***

### setMode()

```ts
setMode(
   mode, 
   active, 
   isExplicit?): void;
```

Defined in: [Components/Design2D.ts:4279](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4279)

Switches the interaction mode and cleans up temporary drawing helpers.
Also triggers the 'On2DModeChange' callback whenever the mode is activated
or deactivated, allowing consumers to react to mode updates.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `mode` | `RoomEditorMode` | `undefined` | The RoomEditorMode to set or toggle |
| `active` | `boolean` | `undefined` | Whether to activate or deactivate the mode |
| `isExplicit` | `boolean` | `false` | - |

#### Returns

`void`

***

### setUndoRedoLimit()

```ts
setUndoRedoLimit(limit): void;
```

Defined in: [Components/Design2D.ts:6611](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L6611)

set undo-redo limit to stack

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `limit` | `number` | - |

#### Returns

`void`

***

### toggleBackgroundImage()

```ts
toggleBackgroundImage(show): void;
```

Defined in: [Components/Design2D.ts:4648](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4648)

Toggles the visibility of the background floorplan image.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `show` | `boolean` | Whether to show the background image |

#### Returns

`void`

***

### toggleDimensions()

```ts
toggleDimensions(visible): boolean;
```

Defined in: [Components/Design2D.ts:4755](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L4755)

Toggles the visibility of wall dimensions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `visible` | `boolean` | Whether dimensions should be visible |

#### Returns

`boolean`

The new visibility state of the dimensions.

***

### undo()

```ts
undo(): void;
```

Defined in: [Components/Design2D.ts:395](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design2D.ts#L395)

Undo

#### Returns

`void`
