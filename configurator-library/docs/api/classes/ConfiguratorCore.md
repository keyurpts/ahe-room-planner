[three-configurator](../index.md) / ConfiguratorCore

# Class: ConfiguratorCore

Defined in: [ConfiguratorCore.ts:91](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L91)

Core class for the 3D configurator
Handles scene setup, model management, and state export

## Constructors

### Constructor

```ts
new ConfiguratorCore(options): ConfiguratorCore;
```

Defined in: [ConfiguratorCore.ts:478](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L478)

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

Defined in: [ConfiguratorCore.ts:316](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L316)

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

### applyColorToAllFloors()

```ts
applyColorToAllFloors(hexColor): void;
```

Defined in: [ConfiguratorCore.ts:6878](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6878)

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

Defined in: [ConfiguratorCore.ts:6760](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6760)

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

Defined in: [ConfiguratorCore.ts:5286](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5286)

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

Defined in: [ConfiguratorCore.ts:6922](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6922)

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

Defined in: [ConfiguratorCore.ts:6794](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6794)

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
applyTextureToModel(texUrl, price?): void;
```

Defined in: [ConfiguratorCore.ts:5190](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5190)

**`Description`**

Applies a texture from a URL to the currently selected model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `texUrl` | `string` | The web URL or file path pointing to the texture image. |
| `price?` | `string` \| `number` | (Optional) The price associated with the applied texture to update the model metadata. |

#### Returns

`void`

This method applies a texture to the currently selected model in the 3D viewer.

***

### clearAllMeasurements()

```ts
clearAllMeasurements(): void;
```

Defined in: [ConfiguratorCore.ts:6069](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6069)

**`Description`**

Removes all active measurement helpers (lines, labels, inputs) from the viewer.

#### Returns

`void`

Removes all currently visible distance measurements from the viewer.

***

### clearHoverHighlight()

```ts
clearHoverHighlight(): void;
```

Defined in: [ConfiguratorCore.ts:6277](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6277)

**`Description`**

Removes the current hover highlight from any 3D model in the 3D viewer.

#### Returns

`void`

This method clears the hover status by performing the following actions:
- Removes the wireframe box highlight of the hovered model from the 3D viewer.
- Emits a `modelHovered` event with `null` to notify the frontend that no object is currently hovered.

***

### deleteModel()

```ts
deleteModel(): boolean;
```

Defined in: [ConfiguratorCore.ts:4818](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L4818)

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

Defined in: [ConfiguratorCore.ts:4950](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L4950)

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

Defined in: [ConfiguratorCore.ts:4664](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L4664)

**`Description`**

Duplicates the currently selected 3D model in the workspace.

#### Returns

`boolean`

`true` if the duplicate process was started successfully, `false` if no model was selected.

This method creates a duplicate of the currently selected 3D model. The new
duplicate will float and follow the mouse cursor in preview mode, allowing
you to click and place it in the 3D viewer.

***

### enablePostProcessing()

```ts
enablePostProcessing(enable): void;
```

Defined in: [ConfiguratorCore.ts:7000](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L7000)

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

Defined in: [ConfiguratorCore.ts:6107](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6107)

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

Defined in: [ConfiguratorCore.ts:6676](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6676)

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

Defined in: [ConfiguratorCore.ts:7014](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L7014)

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

Defined in: [ConfiguratorCore.ts:6725](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6725)

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

Defined in: [ConfiguratorCore.ts:6706](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6706)

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

### getModelId()

```ts
getModelId(): string | null;
```

Defined in: [ConfiguratorCore.ts:5756](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5756)

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

Defined in: [ConfiguratorCore.ts:5778](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5778)

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

Defined in: [ConfiguratorCore.ts:5838](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5838)

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

Defined in: [ConfiguratorCore.ts:6140](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6140)

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
| `grandTotal` | `number` | [ConfiguratorCore.ts:6140](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6140) |
| `models` | \{ `id`: `string`; `name`: `string`; `quantity`: `number`; `unitPrice`: `number`; \}[] | [ConfiguratorCore.ts:6140](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6140) |

***

### getPlacedModels()

```ts
getPlacedModels(): Object3D<Object3DEventMap>[];
```

Defined in: [ConfiguratorCore.ts:6117](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6117)

**`Description`**

Gets all placed 3D models in the 3D viewer.

#### Returns

`Object3D`\<`Object3DEventMap`\>[]

An array of all 3D models currently placed in the workspace (excluding the room model).
 Gets all placed 3D models in the 3D viewer.

***

### hoverModelByIdAndName()

```ts
hoverModelByIdAndName(id, name): boolean;
```

Defined in: [ConfiguratorCore.ts:6246](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6246)

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

### isModelSelected()

```ts
isModelSelected(): boolean;
```

Defined in: [ConfiguratorCore.ts:7045](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L7045)

**`Description`**

Checks if a model is currently selected and has active transformation controls attached to it.

#### Returns

`boolean`

Returns `true` if a model is selected and transformation controls are active; otherwise, returns `false`.
 This method checks the current state of the workspace. It returns `true` if
a model is selected and the move/rotate/scale handles are currently active and attached to it.

***

### loadEnvironmentMap()

```ts
loadEnvironmentMap(envUrl, intensity?): Promise<void>;
```

Defined in: [ConfiguratorCore.ts:5477](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5477)

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

Defined in: [ConfiguratorCore.ts:4568](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L4568)

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

Defined in: [ConfiguratorCore.ts:5397](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5397)

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

### replaceModel()

```ts
replaceModel(newUri, metadata?): Promise<boolean>;
```

Defined in: [ConfiguratorCore.ts:5874](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5874)

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

Defined in: [ConfiguratorCore.ts:6981](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6981)

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

Defined in: [ConfiguratorCore.ts:5339](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5339)

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

Defined in: [ConfiguratorCore.ts:5367](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5367)

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

Defined in: [ConfiguratorCore.ts:6852](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6852)

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

Defined in: [ConfiguratorCore.ts:5800](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5800)

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

Defined in: [ConfiguratorCore.ts:6201](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6201)

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

### setBackgroundColor()

```ts
setBackgroundColor(backgroundColor): void;
```

Defined in: [ConfiguratorCore.ts:5049](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5049)

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

Defined in: [ConfiguratorCore.ts:6292](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6292)

Sets the camera type between perspective and orthographic projection views.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `"perspective"` \| `"orthographic"` | The view mode to activate (either `"perspective"` or `"orthographic"`). |

#### Returns

`void`

***

### setTransformMode()

```ts
setTransformMode(mode): void;
```

Defined in: [ConfiguratorCore.ts:5707](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5707)

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

Defined in: [ConfiguratorCore.ts:5725](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5725)

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

### setWallColor()

```ts
setWallColor(color): void;
```

Defined in: [ConfiguratorCore.ts:6662](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6662)

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

Defined in: [ConfiguratorCore.ts:6747](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6747)

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

Defined in: [ConfiguratorCore.ts:6044](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6044)

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

Defined in: [ConfiguratorCore.ts:5551](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5551)

**`Description`**

Switches the active camera or model interaction control mode.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `"orbit"` \| `"trackball"` \| `"pointerlock"` \| `"transform"` | The type of control mode to activate: - `"orbit"`: Default orbital rotation, zoom, and panning. - `"trackball"`: Free rotation controls. - `"pointerlock"`: First-person keyboard/mouse navigation. - `"transform"`: Gizmo controls to translate, rotate, or scale the selected model. |

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

Defined in: [ConfiguratorCore.ts:6526](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6526)

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

Defined in: [ConfiguratorCore.ts:6005](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L6005)

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

Defined in: [ConfiguratorCore.ts:5740](https://github.com/rahulkhandepts/3d-configurator-library/blob/8cfc5502bcd92a8ab69344ffdb9876c58674ec0e/Library/three-configurator/src/ConfiguratorCore.ts#L5740)

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
