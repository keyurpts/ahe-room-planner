[three-configurator](../index.md) / ConfiguratorCore

# Class: ConfiguratorCore

Defined in: [ConfiguratorCore.ts:90](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L90)

Core class for the 3D configurator
Handles scene setup, model management, and state export

## Constructors

### Constructor

```ts
new ConfiguratorCore(options): ConfiguratorCore;
```

Defined in: [ConfiguratorCore.ts:535](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L535)

Creates a new ConfiguratorCore instance

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | `ConfiguratorOptions` | Configuration options |

#### Returns

`ConfiguratorCore`

## Properties

### measurementState

```ts
measurementState: {
  isActive: boolean;
  isWallsOnly: boolean;
};
```

Defined in: [ConfiguratorCore.ts:370](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L370)

Public state object for distance measurement to be accessed and updated by the frontend.

#### isActive

```ts
isActive: boolean = false;
```

#### isWallsOnly

```ts
isWallsOnly: boolean = false;
```

## Methods

### apply3DConfig()

```ts
apply3DConfig(config): Promise<Record<string, Object3D<Object3DEventMap>>>;
```

Defined in: [ConfiguratorCore.ts:9683](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9683)

Alias for import3DConfig.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `string` \| `Record`\<`string`, `any`\> |

#### Returns

`Promise`\<`Record`\<`string`, `Object3D`\<`Object3DEventMap`\>\>\>

***

### applyColorToAllFloors()

```ts
applyColorToAllFloors(hexColor): void;
```

Defined in: [ConfiguratorCore.ts:7481](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7481)

**`Description`**

Applies a specific color to all floors in the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hexColor` | `string` | The hex color string (e.g., `"#ffffff"`) to apply to all floors. |

#### Returns

`void`

This method immediately applies the specified color to all floor surfaces
in the room, clearing any custom textures that were previously applied.

***

### applyColorToAllWalls()

```ts
applyColorToAllWalls(hexColor): void;
```

Defined in: [ConfiguratorCore.ts:7243](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7243)

**`Description`**

Applies a specific paint color to all walls in the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hexColor` | `string` | The hex color string (e.g., `"#ffffff"`) to apply to all walls. |

#### Returns

`void`

This method immediately applies the specified color to all visible walls in the 3D viewer.

***

### applyMaterialToModel()

```ts
applyMaterialToModel(materialData): Promise<void>;
```

Defined in: [ConfiguratorCore.ts:5545](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5545)

**`Description`**

Applies custom material properties (such as color, roughness, metalness,
and texture) to the currently selected model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `materialData` | \{ `color?`: `string` \| `number`; `metalness?`: `number`; `price?`: `string` \| `number`; `roughness?`: `number`; `side?`: `Side`; `texture?`: `string`; \} | An object containing the material properties to apply: - `color` (string | number, optional): Hex color or decimal representation. - `metalness` (number, optional): The metalness value (typically between `0` and `1`). - `roughness` (number, optional): The roughness value (typically between `0` and `1`). - `side` (Side, optional): Three.js Side configuration (e.g. FrontSide, BackSide, DoubleSide). - `texture` (string, optional): Web URL or file path pointing to the texture image. - `price` (string | number, optional): Price value to store in the model's metadata. |
| `materialData.color?` | `string` \| `number` | - |
| `materialData.metalness?` | `number` | - |
| `materialData.price?` | `string` \| `number` | - |
| `materialData.roughness?` | `number` | - |
| `materialData.side?` | `Side` | - |
| `materialData.texture?` | `string` | - |

#### Returns

`Promise`\<`void`\>

This method applies custom material properties (like colors, roughness,
metalness, and textures) to the active selected model in the workspace.

***

### applyTextureToAllFloors()

```ts
applyTextureToAllFloors(texturePreset): void;
```

Defined in: [ConfiguratorCore.ts:7577](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7577)

**`Description`**

Applies a specific texture to all floors in the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `texturePreset` | \{ `repeatX?`: `number`; `repeatY?`: `number`; `url`: `string`; \} | An object containing: - `url` (string): The web URL or file path pointing to the texture image file. - `repeatX` (number, optional): The horizontal scaling/repeat factor. - `repeatY` (number, optional): The vertical scaling/repeat factor. |
| `texturePreset.repeatX?` | `number` | - |
| `texturePreset.repeatY?` | `number` | - |
| `texturePreset.url` | `string` | - |

#### Returns

`void`

This method immediately applies the specified texture and scaling/repeat
settings to all floor surfaces in the room.

***

### applyTextureToAllWalls()

```ts
applyTextureToAllWalls(texturePreset): void;
```

Defined in: [ConfiguratorCore.ts:7319](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7319)

**`Description`**

Applies a specific texture to all walls in the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `texturePreset` | \{ `repeatX?`: `number`; `repeatY?`: `number`; `url`: `string`; \} | An object containing: - `url` (string): The web URL or file path pointing to the texture image file. - `repeatX` (number, optional): The horizontal scaling/repeat factor. - `repeatY` (number, optional): The vertical scaling/repeat factor. |
| `texturePreset.repeatX?` | `number` | - |
| `texturePreset.repeatY?` | `number` | - |
| `texturePreset.url` | `string` | - |

#### Returns

`void`

This method immediately applies the specified texture to all visible walls in the 3D viewer.

***

### applyTextureToModel()

```ts
applyTextureToModel(
   texUrl, 
   id?, 
   price?, 
   targetModel?): void;
```

Defined in: [ConfiguratorCore.ts:5374](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5374)

**`Description`**

Applies a texture from a URL to the currently selected model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `texUrl` | `string` | The web URL or file path pointing to the texture image. |
| `id?` | `string` | - |
| `price?` | `string` \| `number` | (Optional) The price associated with the applied texture to update the model metadata. |
| `targetModel?` | `Object3D`\<`Object3DEventMap`\> | - |

#### Returns

`void`

This method applies a texture to the currently selected model in the 3D viewer.

***

### clearAllMeasurements()

```ts
clearAllMeasurements(): void;
```

Defined in: [ConfiguratorCore.ts:6592](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6592)

**`Description`**

Removes all active measurement helpers (lines, labels, inputs) from the viewer.

#### Returns

`void`

Removes all currently visible distance measurements from the viewer.

***

### clearConfigureHistory()

```ts
clearConfigureHistory(): void;
```

Defined in: [ConfiguratorCore.ts:9143](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9143)

Clears the undo and redo history for configuration operations.

#### Returns

`void`

***

### clearDesign2DHistory()

```ts
clearDesign2DHistory(): void;
```

Defined in: [ConfiguratorCore.ts:8489](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8489)

Clears the undo and redo history for 3D design operations.

#### Returns

`void`

***

### clearHoverHighlight()

```ts
clearHoverHighlight(): void;
```

Defined in: [ConfiguratorCore.ts:6782](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6782)

**`Description`**

Removes the current hover highlight from any 3D model in the 3D viewer.

#### Returns

`void`

This method clears the hover status by performing the following actions:
- Removes the wireframe box highlight of the hovered model from the 3D viewer.
- Emits a `modelHovered` event with `null` to notify the frontend that no object is currently hovered.

***

### createPermanentGroup()

```ts
createPermanentGroup(customName?): boolean;
```

Defined in: [ConfiguratorCore.ts:7862](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7862)

Creates a permanent group from the current furniture items.
The items are grouped together and the new group becomes selected.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `customName?` | `string` | Optional name for the new group. |

#### Returns

`boolean`

true if the group was created, otherwise false.

***

### deleteModel()

```ts
deleteModel(): boolean;
```

Defined in: [ConfiguratorCore.ts:4897](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L4897)

**`Description`**

Deletes the currently selected 3D model from the workspace.

#### Returns

`boolean`

`true` if the selected model was successfully deleted, `false` if no model was selected.

This method deletes the selected 3D model from the 3D viewer. It detaches
movement controls and cleans up the model's bounding box outlines and collision helpers.

***

### dispose()

```ts
dispose(): void;
```

Defined in: [ConfiguratorCore.ts:5132](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5132)

**`Description`**

Cleans up all configurator resources.

#### Returns

`void`

This method properly destroys the configurator instance, frees up system
resources, and cleans up internal memory. You should call this method when
unmounting the 3D configurator component.

***

### duplicateModel()

```ts
duplicateModel(): boolean;
```

Defined in: [ConfiguratorCore.ts:4781](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L4781)

**`Description`**

Duplicates the currently selected 3D model in the workspace.

#### Returns

`boolean`

`true` if the duplicate process was started successfully, `false` if no model was selected.

This method creates a duplicate of the currently selected 3D model. The new
duplicate will float and follow the mouse cursor in preview mode, allowing
you to click and place it in the 3D viewer.

***

### enableKeyboardShortcuts()

```ts
enableKeyboardShortcuts(enabled): void;
```

Defined in: [ConfiguratorCore.ts:7797](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7797)

Enables or disables keyboard shortcuts for model operations (duplicate, delete).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `enabled` | `boolean` | True to enable keyboard shortcuts, false to disable. |

#### Returns

`void`

***

### enablePostProcessing()

```ts
enablePostProcessing(enable): void;
```

Defined in: [ConfiguratorCore.ts:7785](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7785)

Enables or disables the post-processing manager pass.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `enable` | `boolean` | Whether to enable post-processing. |

#### Returns

`void`

***

### enableVR()

```ts
enableVR(): void;
```

Defined in: [ConfiguratorCore.ts:6629](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6629)

**`Description`**

Initiates a Virtual Reality (VR) session.

#### Returns

`void`

Enables Virtual Reality (VR) mode, allowing users to experience the 3D room
design in an immersive environment on supported VR headsets.

***

### enableWallColoringMode()

```ts
enableWallColoringMode(active): void;
```

Defined in: [ConfiguratorCore.ts:7163](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7163)

**`Description`**

Enables or disables the interactive wall painting mode.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `active` | `boolean` | Set to `true` to enable wall painting; set to `false` to disable it. |

#### Returns

`void`

This method sets the wall coloring mode. When active, clicking on any wall
in the room will apply the currently selected wall color.

***

### enableWallHiding()

```ts
enableWallHiding(enabled): void;
```

Defined in: [ConfiguratorCore.ts:7819](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7819)

**`Description`**

Enables or disables the automatic wall hiding feature.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `enabled` | `boolean` | Pass `true` to enable automatic wall hiding; pass `false` to disable it and make all walls visible. |

#### Returns

`void`

This method toggles whether walls that obstruct the view into the room are
automatically hidden or faded out. When disabled (`false`), all walls and
their associated fixtures (such as doors and windows) are immediately restored to full visibility.

***

### enableWallMaterialResetMode()

```ts
enableWallMaterialResetMode(active): void;
```

Defined in: [ConfiguratorCore.ts:7206](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7206)

**`Description`**

Enables or disables the interactive wall material reset mode.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `active` | `boolean` | Set to `true` to enable wall material reset mode; set to `false` to disable it. |

#### Returns

`void`

This method sets the wall material reset mode. When active, clicking on any
wall face in the room will revert its material/color back to the wall's original base material.

***

### enableWallTextureMode()

```ts
enableWallTextureMode(active): void;
```

Defined in: [ConfiguratorCore.ts:7184](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7184)

**`Description`**

Enables or disables the interactive wall texturing mode.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `active` | `boolean` | Set to `true` to enable wall texturing; set to `false` to disable it. |

#### Returns

`void`

This method sets the wall texturing mode. When active, clicking on any wall
in the room will apply the texture selected with `SetSelectedWallTexture`.

***

### export3DConfig()

```ts
export3DConfig(): Record<string, any>;
```

Defined in: [ConfiguratorCore.ts:9200](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9200)

Exports the 3D configuration of selectable objects in the scene.

Traverses the first-level children of the scene:
- If an object has userData.selectable = "true" and !userData.isGroup,
  stores its transformation matrix against its userData.metadata.id.
- If an object has userData.selectable = "true" and userData.isGroup === true,
  stores its transformation matrix, name, and children array against its userData.metadata.id.

#### Returns

`Record`\<`string`, `any`\>

An object containing the exported 3D configuration mapped against metadata IDs.

***

### get3DModes()

```ts
get3DModes(): CurrentMode;
```

Defined in: [ConfiguratorCore.ts:992](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L992)

Retrieves the currently active 3D mode.

#### Returns

`CurrentMode`

The current 3D mode.

***

### getCurrentOpeningDimensions()

```ts
getCurrentOpeningDimensions(): {
  door: {
     height: number;
     width: number;
  };
  window: {
     height: number;
     width: number;
     windowFloorDistance: number;
  };
};
```

Defined in: [ConfiguratorCore.ts:8160](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8160)

**`Description`**

Gets the current geometry dimensions of doors and windows  in the 3D viewer.

#### Returns

```ts
{
  door: {
     height: number;
     width: number;
  };
  window: {
     height: number;
     width: number;
     windowFloorDistance: number;
  };
}
```

Current door and window dimensions in design units.

 Return the current opening width and height

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `door` | \{ `height`: `number`; `width`: `number`; \} | [ConfiguratorCore.ts:8161](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8161) |
| `door.height` | `number` | [ConfiguratorCore.ts:8161](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8161) |
| `door.width` | `number` | [ConfiguratorCore.ts:8161](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8161) |
| `window` | \{ `height`: `number`; `width`: `number`; `windowFloorDistance`: `number`; \} | [ConfiguratorCore.ts:8162](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8162) |
| `window.height` | `number` | [ConfiguratorCore.ts:8162](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8162) |
| `window.width` | `number` | [ConfiguratorCore.ts:8162](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8162) |
| `window.windowFloorDistance` | `number` | [ConfiguratorCore.ts:8162](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8162) |

***

### getModelId()

```ts
getModelId(): string | null;
```

Defined in: [ConfiguratorCore.ts:6241](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6241)

**`Description`**

Retrieves the ID of the currently selected model in the workspace.

#### Returns

`string` \| `null`

The unique ID of the selected model, or `null` if no model is currently selected.

This method retrieves the unique identifier (`id`) attached to the currently
selected model. It returns `null` if nothing is selected or if the selected
model does not have an ID in its metadata.

***

### getModelMetadata()

```ts
getModelMetadata(): any;
```

Defined in: [ConfiguratorCore.ts:6263](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6263)

**`Description`**

Retrieves the metadata of the currently selected model.

#### Returns

`any`

The metadata object of the selected model, or `null` if no model is selected
or if it has no metadata.

This method retrieves the metadata (such as name, category, price, or applied
materials/textures) of the currently selected model.

***

### getModelRotation()

```ts
getModelRotation(): 
  | {
  x: number;
  y: number;
  z: number;
}
  | null;
```

Defined in: [ConfiguratorCore.ts:6341](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6341)

**`Description`**

Gets the rotation of the currently selected model in degrees.

#### Returns

  \| \{
  `x`: `number`;
  `y`: `number`;
  `z`: `number`;
\}
  \| `null`

An object containing `x`, `y`, and `z` rotation components in degrees,
or `null` if no model is selected.

This method retrieves the current rotation of the selected model along
the X, Y, and Z axes. The values returned are rounded to the nearest degree.

***

### getModelsSummary()

```ts
getModelsSummary(): {
  grandTotal: number;
  models: {
     id: string;
     name: string;
     quantity: number;
     unitPrice: number;
  }[];
};
```

Defined in: [ConfiguratorCore.ts:6644](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6644)

**`Description`**

Gets a summary of all placed models including their name, quantity, price and total price.

#### Returns

```ts
{
  grandTotal: number;
  models: {
     id: string;
     name: string;
     quantity: number;
     unitPrice: number;
  }[];
}
```

An object containing grouped model details (`models`) and the overall
`grandTotal` price.

 Calculates and gets a summary of all models currently placed in the 3D viewer,
including their names, quantities, individual prices, and the grand total price.

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `grandTotal` | `number` | [ConfiguratorCore.ts:6644](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6644) |
| `models` | \{ `id`: `string`; `name`: `string`; `quantity`: `number`; `unitPrice`: `number`; \}[] | [ConfiguratorCore.ts:6644](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6644) |

***

### getRoomAnnotationMode()

```ts
getRoomAnnotationMode(): AnnotationMode;
```

Defined in: [ConfiguratorCore.ts:8390](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8390)

Gets the current room annotation display mode.

#### Returns

`AnnotationMode`

The active annotation mode.

***

### getSelectableObjectHierarchy()

```ts
getSelectableObjectHierarchy(): HierarchyNode[];
```

Defined in: [ConfiguratorCore.ts:8061](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8061)

Returns the hierarchy of selectable objects in the scene.

Furniture items are added as top-level objects, while selectable groups
include their child objects. The room model and non-selectable objects
are excluded.

#### Returns

`HierarchyNode`[]

An array of selectable object hierarchy nodes.

***

### getUndoRedoPayload()

```ts
getUndoRedoPayload(): Undo_Redo_Payload;
```

Defined in: [ConfiguratorCore.ts:9160](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9160)

Get the undo-redo-satck size

#### Returns

`Undo_Redo_Payload`

payload

***

### getWallHeight()

```ts
getWallHeight(): number;
```

Defined in: [ConfiguratorCore.ts:8129](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8129)

**`Description`**

Gets the current wall height applied to the walls in the 3D viewer.

#### Returns

`number`

Current wall height in design units.
 This method returns the current wall height applied to the walls in the 3D viewer.
The returned value can be used to display the current wall height in the UI.

***

### hoverModelByIdAndName()

```ts
hoverModelByIdAndName(id, name): boolean;
```

Defined in: [ConfiguratorCore.ts:6750](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6750)

**`Description`**

Highlights a specific model in the 3D viewer using its ID and name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the model to highlight. |
| `name` | `string` | The name of the model to highlight. |

#### Returns

`boolean`

`true` if the model was found and successfully highlighted, or `false` otherwise.
 Finds and highlights a specific 3D model in the 3D viewer using its ID and name.

When a matching model is found, this method:
- Clears any currently active hover highlights in the 3D viewer.
- Draws a wireframe box highlight around the matched model to visually indicate
  a hover state.
- Emits a `modelHovered` event containing the hovered model's metadata to notify
  your frontend interface.

Returns `false` if no matching model is found, or if the model is marked
as non-selectable.

***

### import3DConfig()

```ts
import3DConfig(config): Promise<Record<string, Object3D<Object3DEventMap>>>;
```

Defined in: [ConfiguratorCore.ts:9345](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9345)

Imports a 3D configuration into the scene.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `string` \| `Record`\<`string`, `any`\> | The 3D configuration object or JSON string. |

#### Returns

`Promise`\<`Record`\<`string`, `Object3D`\<`Object3DEventMap`\>\>\>

A map of loaded models and groups mapped by their keys.

***

### isModelSelected()

```ts
isModelSelected(): boolean;
```

Defined in: [ConfiguratorCore.ts:7850](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7850)

**`Description`**

Checks if a model is currently selected and has active transformation controls attached to it.

#### Returns

`boolean`

Returns `true` if a model is selected and transformation controls are active; otherwise, returns `false`.
 This method checks the current state of the workspace. It returns `true` if
a model is selected and the move/rotate/scale handles are currently active and attached to it.

***

### load3DConfig()

```ts
load3DConfig(config): Promise<Record<string, Object3D<Object3DEventMap>>>;
```

Defined in: [ConfiguratorCore.ts:9674](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9674)

Alias for import3DConfig.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `string` \| `Record`\<`string`, `any`\> |

#### Returns

`Promise`\<`Record`\<`string`, `Object3D`\<`Object3DEventMap`\>\>\>

***

### loadEnvironmentMap()

```ts
loadEnvironmentMap(envUrl, intensity?): Promise<void>;
```

Defined in: [ConfiguratorCore.ts:5836](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5836)

**`Description`**

Loads and applies an HDR environment map (HDRI) to the 3D viewer.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `envUrl` | `string` | `undefined` | The web URL or file path pointing to the HDR/environment map file. |
| `intensity?` | `number` | `1.0` | (Optional) The brightness/intensity of the environment lighting. Defaults to `1.0`. |

#### Returns

`Promise`\<`void`\>

This method loads a High-Dynamic-Range image (HDRI) and applies it to the
3D viewer to provide realistic lighting and reflections across the 3D models.

***

### loadModel()

```ts
loadModel(
   url, 
   isPreview, 
   position?, 
   rotation?, 
   callbacks?, 
   isSelectable?, 
metadata?): Promise<Object3D<Object3DEventMap> | null>;
```

Defined in: [ConfiguratorCore.ts:4640](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L4640)

**`Description`**

Loads a 3D model from a GLB/GLTF file URL and inserts it into the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` | The URL of the model to load. |
| `isPreview` | `boolean` | If set to `true`, the model will follow the mouse cursor until clicked to place it. |
| `position?` | `Vector3` | (Optional) The initial position of the model. |
| `rotation?` | `Euler` | (Optional) The initial rotation of the model. |
| `callbacks?` | `ModelLoadCallbacks` | (Optional) Callback functions triggered during loading. |
| `isSelectable?` | `boolean` | (Optional) If set to `true`, users can click to select and move the model. Defaults to `false`. |
| `metadata?` | \{ `category?`: `string`; `format?`: `string`; `id?`: `string`; `name?`: `string`; `price?`: `string`; \} | (Optional) Custom details to attach to the model. |
| `metadata.category?` | `string` | - |
| `metadata.format?` | `string` | - |
| `metadata.id?` | `string` | - |
| `metadata.name?` | `string` | - |
| `metadata.price?` | `string` | - |

#### Returns

`Promise`\<`Object3D`\<`Object3DEventMap`\> \| `null`\>

This method loads a 3D model and inserts it into the 3D viewer. It allows
you to place the model directly at a set position, or load it in preview
mode where it floats with the mouse cursor until placed.

***

### modelView()

```ts
modelView(camView): void;
```

Defined in: [ConfiguratorCore.ts:5757](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5757)

**`Description`**

Sets the model's camera view based on the specified direction.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `camView` | `string` | The desired camera view direction: "top", "bottom", "front", "back", "left", "right", or "home". |

#### Returns

`void`

This method adjusts the camera view direction relative to the model.
Defaults to the "front" view if the provided value is invalid.

***

### redo()

```ts
redo(): void;
```

Defined in: [ConfiguratorCore.ts:2569](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L2569)

Handles the redo operation based on the current 3D mode.

#### Returns

`void`

***

### replaceModel()

```ts
replaceModel(newUri, metadata?): Promise<boolean>;
```

Defined in: [ConfiguratorCore.ts:6377](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6377)

**`Description`**

Replaces the currently selected model in the workspace with a new model
from a URL, preserving the original model's position, rotation, and scale.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `newUri` | `string` | The web URL or file path pointing to the new GLB/GLTF model. |
| `metadata?` | \{ `format?`: `string`; `id?`: `string`; `name?`: `string`; `price?`: `string`; \} | (Optional) Custom details to attach to the new model (such as product name, ID, price, and format). |
| `metadata.format?` | `string` | - |
| `metadata.id?` | `string` | - |
| `metadata.name?` | `string` | - |
| `metadata.price?` | `string` | - |

#### Returns

`Promise`\<`boolean`\>

Resolves to `true` if the replacement succeeded, or `false` if it failed

This method swaps the active selected model with a new one. It automatically
keeps track of the original model's transformation parameters (position,
rotation, scale) and applies them to the incoming model. If the load fails,
the system automatically restores the old model.

***

### resetFloor()

```ts
resetFloor(): void;
```

Defined in: [ConfiguratorCore.ts:7749](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7749)

**`Description`**

Resets all floors in the 3D viewer to their original colors and textures.

#### Returns

`void`

This method immediately reverts any custom colors or textures applied to
the floors in the 3D viewer, restoring them to their original default material state.

***

### resetMaterial()

```ts
resetMaterial(): void;
```

Defined in: [ConfiguratorCore.ts:5657](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5657)

**`Description`**

Resets the selected model's material to its original state.

#### Returns

`void`

This method reverts any applied material properties on the currently
selected model back to its original material configuration.

***

### resetTexture()

```ts
resetTexture(): void;
```

Defined in: [ConfiguratorCore.ts:5706](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5706)

**`Description`**

Resets the selected model's texture to its original state.

#### Returns

`void`

This method reverts any applied texture on the currently selected model
back to its original texture.

***

### resetWalls()

```ts
resetWalls(): void;
```

Defined in: [ConfiguratorCore.ts:7423](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7423)

**`Description`**

Resets all walls in the 3D viewer to their original colors and textures.

#### Returns

`void`

This method immediately reverts any custom colors or textures applied to
any walls in the 3D viewer, restoring them to their original default material state.

***

### rotateModel()

```ts
rotateModel(axis, angle): boolean;
```

Defined in: [ConfiguratorCore.ts:6303](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6303)

**`Description`**

Rotates the currently selected model around a specified axis.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `axis` | `"x"` \| `"y"` \| `"z"` | The axis to rotate around. |
| `angle` | `number` | The rotation angle in degrees. |

#### Returns

`boolean`

`true` if the rotation was applied successfully, or `false` if it failed

This method rotates the currently selected model around the specified axis
(`"x"`, `"y"`, or `"z"`). If the rotation causes a collision, it is automatically reverted.

***

### selectModelByIdAndName()

```ts
selectModelByIdAndName(id, name): boolean;
```

Defined in: [ConfiguratorCore.ts:6705](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6705)

**`Description`**

Selects a model in the 3D viewer using its ID and name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the model to select. |
| `name` | `string` | The name of the model to select. |

#### Returns

`boolean`

`true` if the model was found and successfully selected, or `false` otherwise.
 Finds and selects a specific 3D model in the 3D viewer using its ID and name.

When a matching model is found, this method:
- Sets the matched model as the active selection.
- Activates the transform controls (gizmo) on the selected model so the user
  can move or rotate it.
- Updates and draws distance measurements from this model to surrounding
  walls and objects (if measurement mode is active).
- Emits a `modelSelected` event containing the selected model's metadata
  to notify your frontend interface.

Returns `false` if no matching model is found, or if the model is marked
as non-selectable.

***

### set3DModes()

```ts
set3DModes(mode): void;
```

Defined in: [ConfiguratorCore.ts:981](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L981)

Sets the current 3D mode.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mode` | `CurrentMode` | The 3D mode to activate. |

#### Returns

`void`

***

### setBackgroundColor()

```ts
setBackgroundColor(backgroundColor): void;
```

Defined in: [ConfiguratorCore.ts:5233](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5233)

**`Description`**

Sets the background color of the 3D viewer scene.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `backgroundColor` | `number` | The color value represented as a hexadecimal number (e.g., `0xffffff` for white, `0x000000` for black). |

#### Returns

`void`

This method updates the background color of the 3D canvas scene dynamically.

***

### setCameraType()

```ts
setCameraType(type): void;
```

Defined in: [ConfiguratorCore.ts:6797](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6797)

Sets the camera type between perspective and orthographic projection views.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `CameraTypes` | The view mode to activate (either `"perspective"` or `"orthographic"`). |

#### Returns

`void`

***

### setCollisionStatus()

```ts
setCollisionStatus(isActive): void;
```

Defined in: [ConfiguratorCore.ts:9175](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9175)

Enables or disables collision detection when models are manipulated (moved or rotated).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `isActive` | `boolean` | `true` to enable collision checking and automatic revert; `false` to allow freely overlapping placement. |

#### Returns

`void`

***

### setRoomAnnotationMode()

```ts
setRoomAnnotationMode(mode): void;
```

Defined in: [ConfiguratorCore.ts:8381](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8381)

Sets the room annotation display mode.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mode` | `AnnotationMode` | The room annotation display mode. |

#### Returns

`void`

***

### setTransformMode()

```ts
setTransformMode(mode): void;
```

Defined in: [ConfiguratorCore.ts:6193](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6193)

**`Description`**

Sets the active transformation mode for the transform gizmo.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mode` | `TransformControlsMode` | The gizmo mode to set: - `"translate"`: Show translation arrows to move the model. - `"rotate"`: Show rotation rings to rotate the model. - `"scale"`: Show scaling handles to resize the model. |

#### Returns

`void`

This method changes the tool mode of the transform controls. It only takes
effect if the active control mode is set to `"transform"` (using
`switchControlMode`) and a model is currently selected.

***

### setTransformSize()

```ts
setTransformSize(size): void;
```

Defined in: [ConfiguratorCore.ts:6210](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6210)

**`Description`**

Sets the size of the transformation controls gizmo.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `size` | `number` | A positive number determining the size scale of the transformation gizmo. Defaults to `1`. |

#### Returns

`void`

This method adjusts the scale and size of the active transform controls gizmo in the 3D viewport.

***

### setUndoRedoLimit()

```ts
setUndoRedoLimit(limit): void;
```

Defined in: [ConfiguratorCore.ts:9151](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L9151)

set undo-redo limit to stack

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `limit` | `number` | - |

#### Returns

`void`

***

### setWallColor()

```ts
setWallColor(color): void;
```

Defined in: [ConfiguratorCore.ts:7150](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7150)

**`Description`**

Sets the active paint color for painting walls in the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `color` | `string` | The hex color string (e.g., `"#ffffff"`) to set as the active paint color. |

#### Returns

`void`

Sets the color that will be applied to wall faces when wall coloring mode is active.

***

### setWallTexture()

```ts
setWallTexture(texturePreset): void;
```

Defined in: [ConfiguratorCore.ts:7231](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7231)

**`Description`**

Sets the active texture image for texturing walls in the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `texturePreset` | \{ `repeatX?`: `number`; `repeatY?`: `number`; `url`: `string`; \} | An object containing: - `url` (string): The web URL or file path pointing to the texture image file. - `repeatX` (number, optional): The horizontal scaling/repeat factor. - `repeatY` (number, optional): The vertical scaling/repeat factor. |
| `texturePreset.repeatX?` | `number` | - |
| `texturePreset.repeatY?` | `number` | - |
| `texturePreset.url` | `string` | - |

#### Returns

`void`

This method configures the texture image and scale factors that will be
applied to wall faces when wall texturing mode is active.

***

### showAllMeasurements()

```ts
showAllMeasurements(): void;
```

Defined in: [ConfiguratorCore.ts:6567](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6567)

**`Description`**

Shows all measurements for all placed models in the 3D viewer.

#### Returns

`void`

This method shows distance measurements from all placed models (plus the
active preview model, if present) to surrounding elements in the 3D viewer.

***

### switchControlMode()

```ts
switchControlMode(type): void;
```

Defined in: [ConfiguratorCore.ts:5908](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L5908)

**`Description`**

Switches the active camera or model interaction control mode.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `ORBIT` \| `TRACKBALL` \| `POINTER_LOCK` \| `TRANSFORM` | The type of control mode to activate: - `"orbit"`: Default orbital rotation, zoom, and panning. - `"trackball"`: Free rotation controls. - `"pointerlock"`: First-person keyboard/mouse navigation. - `"transform"`: Gizmo controls to translate, rotate, or scale the selected model. |

#### Returns

`void`

This method switches the active interaction control mode. When switching
to `"transform"`, it attaches transformation gizmo controls to the selected
model so users can reposition it.

***

### takeSnapshot()

```ts
takeSnapshot(): string;
```

Defined in: [ConfiguratorCore.ts:7015](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7015)

**`Description`**

Captures a snapshot of the current 3D viewer with an adjusted view.

#### Returns

`string`

The base64 data URL of the captured PNG image.

This method adjusts the camera view to fit the model and captures it as a
PNG image data URL.

***

### toggleMeasurement()

```ts
toggleMeasurement(): boolean | undefined;
```

Defined in: [ConfiguratorCore.ts:6528](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6528)

**`Description`**

Toggles distance measurements from the currently active model (or preview model) to surrounding objects or walls.

#### Returns

`boolean` \| `undefined`

`true` if measurements were successfully drawn and applied, or `false` if no active model was found.

This method calculates and visualizes the distance from the currently
selected model (or the floating preview model) to surrounding objects
or walls in the 3D viewer.

To configure the behavior of the distance measurements, update the public
`measurementState` property on the instance before calling this method:

```
configuratorCore.measurementState = {
  isActive: boolean;    // Enables or disables the measurement calculations
  isWallsOnly: boolean; // Measures only to walls (true) or to all obstacles (false)
};
```
If `measurementState.isActive` is set to `false`, calling `toggleMeasurement()` clears all existing measurement helpers and returns `false`.

***

### toggleTransformAxis()

```ts
toggleTransformAxis(axis, visible): void;
```

Defined in: [ConfiguratorCore.ts:6225](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L6225)

**`Description`**

Shows or hides a specific translation/rotation/scaling axis on the transform gizmo.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `axis` | `"x"` \| `"y"` \| `"z"` | The target axis to configure. |
| `visible` | `boolean` | Set to `true` to make the axis visible; set to `false` to hide it. |

#### Returns

`void`

This method allows toggling the visibility of individual transform handles
(X, Y, or Z axes) on the active transform gizmo.

***

### undo()

```ts
undo(): void;
```

Defined in: [ConfiguratorCore.ts:2555](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L2555)

Handles the undo operation based on the current 3D mode.

#### Returns

`void`

***

### ungroupSelectedGroup()

```ts
ungroupSelectedGroup(): boolean;
```

Defined in: [ConfiguratorCore.ts:7985](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L7985)

Disbands/ungroups the currently selected permanent group or target group.

#### Returns

`boolean`

true if group was successfully disbanded, false otherwise.

***

### updateDoorHeight()

```ts
updateDoorHeight(height): boolean;
```

Defined in: [ConfiguratorCore.ts:8218](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8218)

**`Description`**

Updates the height of all doors in the 3D viewer to the specified value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `height` | `number` | The new door height in design units. |

#### Returns

`boolean`

`true` if successful, or `false` if the specified height violates boundary constraints relative to wall height.
 Updates the height of all doors in the 3D viewer to the specified height.

***

### updateDoorWidth()

```ts
updateDoorWidth(width): boolean;
```

Defined in: [ConfiguratorCore.ts:8244](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8244)

**`Description`**

Updates the width of all doors in the 3D viewer to the specified value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `width` | `number` | The new door width in design units. |

#### Returns

`boolean`

`true` if successful, or `false` if the width is less than 0 or exceeds `Opening3DConstraints.MAX_DOOR_WIDTH`.
 Updates the width of all doors in the 3D viewer to the specified width.

***

### updateWallHeight()

```ts
updateWallHeight(height): boolean;
```

Defined in: [ConfiguratorCore.ts:8348](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8348)

**`Description`**

Updates the height of all 3D wall meshes in the 3D viewer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `height` | `number` | The new wall height in design units. |

#### Returns

`boolean`

`true` if the height was successfully updated, or `false` if the height is invalid (e.g., non-positive or insufficient for current door/window dimensions).
 Updates the height of all walls in the 3D viewer to the specified height. The existing wall configuration, including wall metadata, doors, windows, and boundary information, is preserved while the wall geometry is rebuilt and trimmed.

***

### updateWindowFloorDistance()

```ts
updateWindowFloorDistance(distance): boolean;
```

Defined in: [ConfiguratorCore.ts:8318](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8318)

**`Description`**

Updates the distance between the floor and the bottom edge of all windows.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `distance` | `number` | The new distance between the floor and the bottom edge of the windows in design units. |

#### Returns

`boolean`

`true` if successful, or `false` if the distance is negative or causes the top of the window to exceed wall height constraints.
 Updates the vertical position of all windows by setting their distance from the floor to the specified value in design units.

***

### updateWindowHeight()

```ts
updateWindowHeight(height): boolean;
```

Defined in: [ConfiguratorCore.ts:8270](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8270)

**`Description`**

Updates the height of all windows in the 3D viewer to the specified value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `height` | `number` | The new window height in design units. |

#### Returns

`boolean`

`true` if successful, or `false` if the height violates boundary constraints relative to wall height.
 Updates the height of all windows in the 3D viewer to the specified height.

***

### updateWindowWidth()

```ts
updateWindowWidth(width): boolean;
```

Defined in: [ConfiguratorCore.ts:8294](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/ConfiguratorCore.ts#L8294)

**`Description`**

Updates the width of all windows in the 3D viewer to the specified value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `width` | `number` | The new window width in design units. |

#### Returns

`boolean`

`true` if successful, or `false` if the width is less than 0 or exceeds `Opening3DConstraints.MAX_WINDOW_WIDTH`.
 Updates the width of all windows in the 3D viewer to the specified width.
