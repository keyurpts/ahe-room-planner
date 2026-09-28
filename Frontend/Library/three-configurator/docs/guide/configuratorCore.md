# API Reference: ConfiguratorCore

The `ConfiguratorCore` is the primary entry point for managing the 3D viewer, lighting, controls, and active 3D models.


## Methods

### `loadModel`

Loads a 3D model from a GLB/GLTF file URL and inserts it into the 3D viewer.

#### Syntax

```typescript
public async loadModel(
  url: string,
  isPreview: boolean,
  position?: Vector3,
  rotation?: Euler,
  callbacks?: ModelLoadCallbacks,
  isSelectable?: boolean,
  metadata?: { category?: string; name?: string; id?: string; price?: string; format?: string }
): Promise<Object3D | null>
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | The web URL pointing to the GLB model file. |
| `isPreview` | `boolean` | If set to `true`, the model will follow the mouse cursor in preview mode until clicked to place it. If `false`, it places the model immediately. |
| `position` | `Vector3` | *(Optional)* The starting 3D position `(x, y, z)` for the model. |
| `rotation` | `Euler` | *(Optional)* The starting rotation angles for the model. |
| `callbacks` | `ModelLoadCallbacks` | *(Optional)* Callback functions triggered during loading (such as reporting download progress or handling loading errors). |
| `isSelectable` | `boolean` | *(Optional)* If set to `true`, users can click to select and move the model. Defaults to `false`. |
| `metadata` | `object` | *(Optional)* Custom details to attach to the model (such as category, product name, ID, price, and format). |

#### Description

This method loads a 3D model and inserts it into the 3D viewer. It allows you to place the model directly at a set position, or load it in preview mode where it floats with the mouse cursor until placed. 

#### Example

```typescript

// Load a chair model 
await configuratorCore.loadModel(
  "https://example.com/models/chair.glb",
  true, 
  undefined,
  undefined,
  undefined,
  true, 
  { id: "chair-1", name: "Modern Chair", price: "$120" }
);
```

---

### `replaceModel`

Replaces the currently selected model in the workspace with a new model from a URL, preserving the original model's position, rotation, and scale.

#### Syntax

```typescript
public async replaceModel(
  newUri: string,
  metadata?: { name?: string; id?: string; price?: string; format?: string }
): Promise<boolean>
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `newUri` | `string` | The web URL or file path pointing to the new GLB/GLTF model. |
| `metadata` | `object` | *(Optional)* Custom details to attach to the new model (such as product name, ID, price, and format). |

#### Returns

| Type | Description |
| :--- | :--- |
| `Promise<boolean>` | Resolves to `true` if the replacement succeeded, or `false` if it failed (e.g., no model is currently selected or loading failed). |

#### Description

This method swaps the active selected model with a new one. It automatically keeps track of the original model's transformation parameters (position, rotation, scale) and applies them to the incoming model. If the load fails, the system automatically restores the old model.

#### Example

```typescript
// Replace selected chair with a different model design
const success = await configuratorCore.replaceModel(
  "https://example.com/models/deluxe-chair.glb",
  { id: "chair-deluxe", name: "Deluxe Chair", price: "$180", format: "glb" }
);

if (success) {
  console.log("Model successfully replaced.");
} else {
  console.error("Replacement failed.");
}
```

---

### `duplicateModel`

Duplicates the currently selected 3D model in the workspace.

#### Syntax

```typescript
public duplicateModel(): boolean
```

#### Returns

| Type | Description |
| :--- | :--- |
| `boolean` | `true` if the duplicate process was started successfully, `false` if no model was selected. |

#### Description

This method creates a duplicate of the currently selected 3D model. The new duplicate will float and follow the mouse cursor in preview mode, allowing you to click and place it in the 3D viewer.

#### Example

```typescript
const success = configuratorCore.duplicateModel();
if (success) {
  console.log("Duplicate created. Click on the 3D viewer to place the duplicate.");
} else {
  console.warn("Could not duplicate: Make sure an object is selected first.");
}
```

---

### `deleteModel`

Deletes the currently selected 3D model from the workspace.

#### Syntax

```typescript
public deleteModel(): boolean
```

#### Returns

| Type | Description |
| :--- | :--- |
| `boolean` | `true` if the selected model was successfully deleted, `false` if no model was selected. |

#### Description

This method deletes the selected 3D model from the 3D viewer. It detaches movement controls and cleans up the model's bounding box outlines and collision helpers.

#### Example

```typescript
const deleted = configuratorCore.deleteModel();
if (deleted) {
  console.log("Model successfully deleted from the 3D viewer.");
} else {
  console.warn("No model was selected to delete.");
}
```

---

### `getPlacedModels`

Gets all placed 3D models in the 3D viewer.

#### Syntax

```typescript
public getPlacedModels(): Object3D[]
```

#### Returns

| Type | Description |
| :--- | :--- |
| `Object3D[]` | An array of all 3D models currently placed in the workspace (excluding the room model). |

#### Description

Gets all placed 3D models in the 3D viewer.

#### Example

```typescript
const models = configuratorCore.getPlacedModels();
console.log(`Currently rendering ${models.length} model(s) in the workspace.`);
```

---

### `getModelsSummary`

Gets a summary of all placed models including their name, quantity, price and total price.

#### Syntax

```typescript
public getModelsSummary(): {
  models: { id: string; name: string; unitPrice: number; quantity: number }[];
  grandTotal: number;
}
```

#### Returns

| Type | Description |
| :--- | :--- |
| `object` | An object containing grouped model details (`models`) and the overall `grandTotal` price. |

#### Description

Calculates and gets a summary of all models currently placed in the 3D viewer, including their names, quantities, individual prices, and the grand total price.

#### Example

```typescript
const summary = configuratorCore.getModelsSummary();
console.log(`Grand Total: $${summary.grandTotal}`);
console.log("Placed Models Summary:", summary.models);
```

---

### `selectModelByIdAndName`

Selects a model in the 3D viewer using its ID and name.

#### Syntax

```typescript
public selectModelByIdAndName(id: string, name: string): boolean
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | The ID of the model to select. |
| `name` | `string` | The name of the model to select. |

#### Returns

| Type | Description |
| :--- | :--- |
| `boolean` | `true` if the model was found and successfully selected, or `false` otherwise. |

#### Description

Finds and selects a specific 3D model in the 3D viewer using its ID and name. 

When a matching model is found, this method:
- Sets the matched model as the active selection.
- Activates the transform controls (gizmo) on the selected model so the user can move or rotate it.
- Updates and draws distance measurements from this model to surrounding walls and objects (if measurement mode is active).
- Emits a `modelSelected` event containing the selected model's metadata to notify your frontend interface.

Returns `false` if no matching model is found, or if the model is marked as non-selectable.

#### Example

```typescript
// Select a chair model placed in the room
const selected = configuratorCore.selectModelByIdAndName("chair-1", "Modern Chair");
if (selected) {
  console.log("Chair selected successfully.");
}
```

---

### `hoverModelByIdAndName`

Highlights a specific model in the 3D viewer using its ID and name.

#### Syntax

```typescript
public hoverModelByIdAndName(id: string, name: string): boolean
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | The ID of the model to highlight. |
| `name` | `string` | The name of the model to highlight. |

#### Returns

| Type | Description |
| :--- | :--- |
| `boolean` | `true` if the model was found and successfully highlighted, or `false` otherwise. |

#### Description

Finds and highlights a specific 3D model in the 3D viewer using its ID and name.

When a matching model is found, this method:
- Clears any currently active hover highlights in the 3D viewer.
- Draws a wireframe box highlight around the matched model to visually indicate a hover state.
- Emits a `modelHovered` event containing the hovered model's metadata to notify your frontend interface.

Returns `false` if no matching model is found, or if the model is marked as non-selectable.

#### Example

```typescript
// Highlight a cabinet model when the user hovers over it
const hovered = configuratorCore.hoverModelByIdAndName("cabinet-3", "Wooden Cabinet");
if (!hovered) {
  console.log("Could not find the model to hover.");
}
```

---

### `clearHoverHighlight`

Removes the current hover highlight from any 3D model in the 3D viewer.

#### Syntax

```typescript
public clearHoverHighlight(): void
```

#### Description

This method clears the hover status by performing the following actions:
- Removes the wireframe box highlight of the hovered model from the 3D viewer.
- Emits a `modelHovered` event with `null` to notify the frontend that no object is currently hovered.

#### Example

```typescript
// Clear any visible hover highlights when the mouse leaves the workspace area
configuratorCore.clearHoverHighlight();
```

---

### `getModelId`

Retrieves the ID of the currently selected model in the workspace.

#### Syntax

```typescript
public getModelId(): string | null
```

#### Returns

| Type | Description |
| :--- | :--- |
| `string \| null` | The unique ID of the selected model, or `null` if no model is currently selected. |

#### Description

This method retrieves the unique identifier (`id`) attached to the currently selected model. It returns `null` if nothing is selected or if the selected model does not have an ID in its metadata.

#### Example

```typescript
const selectedId = configuratorCore.getModelId();
if (selectedId) {
  console.log(`Active model ID: ${selectedId}`);
} else {
  console.log("No model is currently selected.");
}
```

---

### `getModelMetadata`

Retrieves the metadata of the currently selected model.

#### Syntax

```typescript
public getModelMetadata(): any | null
```

#### Returns

| Type | Description |
| :--- | :--- |
| `any \| null` | The metadata object of the selected model, or `null` if no model is selected or if it has no metadata. |

#### Description

This method retrieves the metadata (such as name, category, price, or applied materials/textures) of the currently selected model.

#### Example

```typescript
const metadata = configuratorCore.getModelMetadata();
if (metadata) {
  console.log("Selected model details:", metadata);
} else {
  console.log("No model metadata found.");
}
```

---

### `switchControlMode`

Switches the active camera or model interaction control mode.

#### Syntax

```typescript
public switchControlMode(type: "orbit" | "trackball" | "pointerlock" | "transform"): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `type` | `"orbit" \| "trackball" \| "pointerlock" \| "transform"` | The type of control mode to activate:<br>• `"orbit"`: Default orbital rotation, zoom, and panning.<br>• `"trackball"`: Free rotation controls.<br>• `"pointerlock"`: First-person keyboard/mouse navigation.<br>• `"transform"`: Gizmo controls to translate, rotate, or scale the selected model. |

#### Description

This method switches the active interaction control mode. When switching to `"transform"`, it attaches transformation gizmo controls to the selected model so users can reposition it.

#### Example

```typescript
// Switch to translation/rotation gizmo controls
configuratorCore.switchControlMode("transform");

// Switch back to orbital camera navigation
configuratorCore.switchControlMode("orbit");
```

---

### `setTransformMode`

Sets the active transformation mode for the transform gizmo.

#### Syntax

```typescript
public setTransformMode(mode: "translate" | "rotate" | "scale"): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `mode` | `"translate" \| "rotate" \| "scale"` | The gizmo mode to set:<br>• `"translate"`: Show translation arrows to move the model.<br>• `"rotate"`: Show rotation rings to rotate the model.<br>• `"scale"`: Show scaling handles to resize the model. |

#### Description

This method changes the tool mode of the transform controls. It only takes effect if the active control mode is set to `"transform"` (using `SwitchControlMode`) and a model is currently selected.

#### Example

```typescript
// Enable translation controls
configuratorCore.switchControlMode("transform");
configuratorCore.setTransformMode("translate");
```

---

### `setTransformSize`

Sets the size of the transformation controls gizmo.

#### Syntax

```typescript
public setTransformSize(size: number): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `size` | `number` | A positive number determining the size scale of the transformation gizmo. Defaults to `1`. |

#### Description

This method adjusts the scale and size of the active transform controls gizmo in the 3D viewport.

#### Example

```typescript
// Make the transformation handles twice as large
configuratorCore.setTransformSize(2.0);
```

---

### `toggleTransformAxis`

Shows or hides a specific translation/rotation/scaling axis on the transform gizmo.

#### Syntax

```typescript
public toggleTransformAxis(axis: "x" | "y" | "z", visible: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `axis` | `"x" \| "y" \| "z"` | The target axis to configure. |
| `visible` | `boolean` | Set to `true` to make the axis visible; set to `false` to hide it. |

#### Description

This method allows toggling the visibility of individual transform handles (X, Y, or Z axes) on the active transform gizmo.

#### Example

```typescript
// Hide the Y axis to restrict vertical movement
configuratorCore.toggleTransformAxis("y", false);
```

---

### `isModelSelected`

Checks if a model is currently selected and has active transformation controls attached to it.

#### Syntax

```typescript
public isModelSelected(): boolean
```

#### Returns

| Return Type | Description |
| :--- | :--- |
| `boolean` | Returns `true` if a model is selected and transformation controls are active; otherwise, returns `false`. |

#### Description

This method checks the current state of the workspace. It returns `true` if a model is selected and the move/rotate/scale handles are currently active and attached to it.

#### Example

```typescript
// Check if the user is currently editing a model
const isEditing = configuratorCore.isModelSelected();
if (isEditing) {
  console.log("A model is currently active and selected.");
}
```

---

### `rotateModel`

Rotates the currently selected model around a specified axis.

#### Syntax

```typescript
public rotateModel(axis: "x" | "y" | "z", angle: number): boolean
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `axis` | `"x" \| "y" \| "z"` | The axis to rotate around. |
| `angle` | `number` | The rotation angle in degrees. |

#### Returns

| Type | Description |
| :--- | :--- |
| `boolean` | `true` if the rotation was applied successfully, or `false` if it failed (e.g. no model is selected or the rotation caused a collision and was reverted). |

#### Description

This method rotates the currently selected model around the specified axis (`"x"`, `"y"`, or `"z"`). If the rotation causes a collision, it is automatically reverted.

#### Example

```typescript
// Rotate the selected model 90 degrees around the Y-axis
const success = configuratorCore.rotateModel("y", 90);
if (!success) {
  console.warn("Rotation failed: Model placement is invalid or no model is selected.");
}
```

---

### `getModelRotation`

Gets the rotation of the currently selected model in degrees.

#### Syntax

```typescript
public getModelRotation(): { x: number; y: number; z: number } | null
```

#### Returns

| Type | Description |
| :--- | :--- |
| `object \| null` | An object containing `x`, `y`, and `z` rotation components in degrees, or `null` if no model is selected. |

#### Description

This method retrieves the current rotation of the selected model along the X, Y, and Z axes. The values returned are rounded to the nearest degree.

#### Example

```typescript
const rotation = configuratorCore.getModelRotation();
if (rotation) {
  console.log(`Model rotation - X: ${rotation.x}°, Y: ${rotation.y}°, Z: ${rotation.z}°`);
} else {
  console.log("No model is currently selected.");
}
```

### `applyMaterialToModel`

Applies custom material properties (such as color, roughness, metalness, and texture) to the currently selected model.

#### Syntax

```typescript
public async applyMaterialToModel(materialData: {
  color?: string | number;
  metalness?: number;
  roughness?: number;
  side?: Side;
  texture?: string;
  price?: string | number;
}): Promise<void>
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `materialData` | `object` | An object containing the material properties to apply:<br>• `color` (string \| number, optional): Hex color or decimal representation.<br>• `metalness` (number, optional): The metalness value (typically between `0` and `1`).<br>• `roughness` (number, optional): The roughness value (typically between `0` and `1`).<br>• `side` (Side, optional): Three.js Side configuration (e.g. FrontSide, BackSide, DoubleSide).<br>• `texture` (string, optional): Web URL or file path pointing to the texture image.<br>• `price` (string \| number, optional): Price value to store in the model's metadata. |

#### Description

This method applies custom material properties (like colors, roughness, metalness, and textures) to the active selected model in the workspace.

#### Example

```typescript
// Apply a semi-rough blue metal material with custom texture to the selected model
await configuratorCore.applyMaterialToModel({
  color: "#0000ff",
  metalness: 0.8,
  roughness: 0.2,
  texture: "https://example.com/textures/metal-brushed.jpg",
  price: 25
});
```

---

### `applyTextureToModel`

Applies a texture from a URL to the currently selected model.

#### Syntax

```typescript
public applyTextureToModel(texUrl: string, price?: string | number): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `texUrl` | `string` | The web URL or file path pointing to the texture image. |
| `price` | `string \| number` | *(Optional)* The price associated with the applied texture to update the model metadata. |

#### Description

This method applies a texture to the currently selected model in the 3D viewer. 

#### Example

```typescript
// Apply a wood texture to the selected model
configuratorCore.applyTextureToModel("https://example.com/textures/wood.jpg", 15);
```

---

### `resetMaterial`

Resets the selected model's material to its original state.

#### Syntax

```typescript
public resetMaterial(): void
```

#### Description

This method reverts any applied material properties on the currently selected model back to its original material configuration.

#### Example

```typescript
// Revert the selected model's material to original settings
configuratorCore.resetMaterial();
```

---

### `resetTexture`

Resets the selected model's texture to its original state.

#### Syntax

```typescript
public resetTexture(): void
```

#### Description

This method reverts any applied texture on the currently selected model back to its original texture.

#### Example

```typescript
// Revert the selected model's texture to its original texture
configuratorCore.resetTexture();
```

---

### `loadEnvironmentMap`

Loads and applies an HDR environment map (HDRI) to the 3D viewer.

#### Syntax

```typescript
public async loadEnvironmentMap(envUrl: string, intensity?: number): Promise<void>
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `envUrl` | `string` | The web URL or file path pointing to the HDR/environment map file. |
| `intensity` | `number` | *(Optional)* The brightness/intensity of the environment lighting. Defaults to `1.0`. |

#### Description

This method loads a High-Dynamic-Range image (HDRI) and applies it to the 3D viewer to provide realistic lighting and reflections across the 3D models.

#### Example

```typescript
// Load an environment map to light the 3D viewer
await configuratorCore.loadEnvironmentMap("https://example.com/textures/studio.hdr", 1.2);
```

---

### `setCameraType`

Sets the camera type between perspective and orthographic projection views.

#### Syntax

```typescript
public setCameraType(type: "perspective" | "orthographic"): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `type` | `"perspective" \| "orthographic"` | The view mode to activate (either `"perspective"` or `"orthographic"`). |

#### Description

Switches the camera view mode while preserving the current zoom level.

#### Example

```typescript
// Switch to a flat layout view
configuratorCore.setCameraType("orthographic");

// Switch back to the standard view
configuratorCore.setCameraType("perspective");
```

---

### `modelView`

Sets the model's camera view based on the specified direction.

#### Syntax

```typescript
public modelView(camView: string): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camView` | `string` | The desired camera view direction: `"top"`, `"bottom"`, `"front"`, `"back"`, `"left"`, `"right"`, or `"home"`. |

#### Description

This method adjusts the camera view direction relative to the model. Defaults to the `"front"` view if the provided value is invalid.

#### Example

```typescript
// Switch the camera view to top view
configuratorCore.modelView("top");
```

---


### `enablePostProcessing`

Enables or disables post-processing visual effects in the 3D viewer.

#### Syntax

```typescript
public enablePostProcessing(enable: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `enable` | `boolean` | Set to `true` to enable post-processing effects; set to `false` to disable them. |

#### Description

This method toggles advanced post-processing rendering passes to enhance the visual quality of the 3D viewer.

#### Example

```typescript
// Turn on advanced post-processing effects
configuratorCore.enablePostProcessing(true);
```

---

### `enableWallHiding`

Enables or disables the automatic wall hiding feature.

#### Syntax

```typescript
public enableWallHiding(enabled: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `enabled` | `boolean` | Pass `true` to enable automatic wall hiding; pass `false` to disable it and make all walls visible. |

#### Description

This method toggles whether walls that obstruct the view into the room are automatically hidden or faded out. When disabled (`false`), all walls and their associated fixtures (such as doors and windows) are immediately restored to full visibility.

#### Example

```typescript
// Enable automatic hiding of walls obstructing the camera view
configuratorCore.enableWallHiding(true);
```

---

### `applyColorToAllWalls`

Applies a specific paint color to all walls in the 3D viewer.

#### Syntax

```typescript
public applyColorToAllWalls(hexColor: string): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `hexColor` | `string` | The hex color string (e.g., `"#ffffff"`) to apply to all walls. |

#### Description

This method immediately applies the specified color to all visible walls in the 3D viewer.

#### Example

```typescript
// Paint all room walls white instantly
configuratorCore.applyColorToAllWalls("#ffffff");
```

---

### `applyTextureToAllWalls`

Applies a specific texture to all walls in the 3D viewer.

#### Syntax

```typescript
public applyTextureToAllWalls(texturePreset: {
  url: string;
  repeatX?: number;
  repeatY?: number;
}): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `texturePreset` | `object` | An object containing:<br>• `url` (string): The web URL or file path pointing to the texture image file.<br>• `repeatX` (number, optional): The horizontal scaling/repeat factor.<br>• `repeatY` (number, optional): The vertical scaling/repeat factor. |

#### Description

This method immediately applies the specified texture to all visible walls in the 3D viewer.

#### Example

```typescript
// Apply a brick texture to all room walls
configuratorCore.applyTextureToAllWalls({
  url: "https://example.com/textures/brick.jpg",
  repeatX: 1.0,
  repeatY: 1.0
});
```

---

### `resetWalls`

Resets all walls in the 3D viewer to their original colors and textures.

#### Syntax

```typescript
public resetWalls(): void
```

#### Description

This method immediately reverts any custom colors or textures applied to any walls in the 3D viewer, restoring them to their original default material state.

#### Example

```typescript
// Revert all room walls back to their default paint/texture
configuratorCore.resetWalls();
```

---

### `setWallColor`

Sets the active paint color for painting walls in the 3D viewer.

#### Syntax

```typescript
public setWallColor(color: string): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `color` | `string` | The hex color string (e.g., `"#ffffff"`) to set as the active paint color. |

#### Description

Sets the color that will be applied to wall faces when wall coloring mode is active.

#### Example

```typescript
// Set the wall paint color to blue
configuratorCore.setWallColor("#0000ff");
```

---

### `enableWallColoringMode`

Enables or disables the interactive wall painting mode.

#### Syntax

```typescript
public enableWallColoringMode(active: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `active` | `boolean` | Set to `true` to enable wall painting; set to `false` to disable it. |

#### Description

This method sets the wall coloring mode. When active, clicking on any wall in the room will apply the currently selected wall color.

#### Example

```typescript
// Enable wall painting mode
configuratorCore.setWallColor("#ff0000");
configuratorCore.enableWallColoringMode(true);

// Disable wall painting mode when done
configuratorCore.enableWallColoringMode(false);
```

---

### `setWallTexture`

Sets the active texture image for texturing walls in the 3D viewer.

#### Syntax

```typescript
public setWallTexture(texturePreset: {
  url: string;
  repeatX?: number;
  repeatY?: number;
}): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `texturePreset` | `object` | An object containing: <br>• `url` (string): The web URL or file path pointing to the texture image file.<br>• `repeatX` (number, optional): The horizontal scaling/repeat factor.<br>• `repeatY` (number, optional): The vertical scaling/repeat factor. |

#### Description

This method configures the texture image and scale factors that will be applied to wall faces when wall texturing mode is active.

#### Example

```typescript
// Set the wall paint texture to brick
configuratorCore.setWallTexture({
  url: "https://example.com/textures/brick.jpg",
  repeatX: 1.5,
  repeatY: 1.5
});
```

---

### `enableWallTextureMode`

Enables or disables the interactive wall texturing mode.

#### Syntax

```typescript
public enableWallTextureMode(active: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `active` | `boolean` | Set to `true` to enable wall texturing; set to `false` to disable it. |

#### Description

This method sets the wall texturing mode. When active, clicking on any wall in the room will apply the texture selected with `SetSelectedWallTexture`.

#### Example

```typescript
// Select a brick texture preset
configuratorCore.SetSelectedWallTexture({
  url: "https://example.com/textures/brick.jpg",
  repeatX: 1.0,
  repeatY: 1.0
});

// Enable interactive wall texturing
configuratorCore.enableWallTextureMode(true);
```

---

### `enableWallMaterialResetMode`

Enables or disables the interactive wall material reset mode.

#### Syntax

```typescript
public enableWallMaterialResetMode(active: boolean): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `active` | `boolean` | Set to `true` to enable wall material reset mode; set to `false` to disable it. |

#### Description

This method sets the wall material reset mode. When active, clicking on any wall face in the room will revert its material/color back to the wall's original base material.

#### Example

```typescript
// Enable wall material reset mode
configuratorCore.enableWallMaterialResetMode(true);
```

---

### `applyColorToAllFloors`

Applies a specific color to all floors in the 3D viewer.

#### Syntax

```typescript
public applyColorToAllFloors(hexColor: string): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `hexColor` | `string` | The hex color string (e.g., `"#ffffff"`) to apply to all floors. |

#### Description

This method immediately applies the specified color to all floor surfaces in the room, clearing any custom textures that were previously applied.

#### Example

```typescript
// Paint all floor surfaces light grey
configuratorCore.applyColorToAllFloors("#d3d3d3");
```

---

### `applyTextureToAllFloors`

Applies a specific texture to all floors in the 3D viewer.

#### Syntax

```typescript
public applyTextureToAllFloors(texturePreset: {
  url: string;
  repeatX?: number;
  repeatY?: number;
}): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `texturePreset` | `object` | An object containing:<br>• `url` (string): The web URL or file path pointing to the texture image file.<br>• `repeatX` (number, optional): The horizontal scaling/repeat factor.<br>• `repeatY` (number, optional): The vertical scaling/repeat factor. |

#### Description

This method immediately applies the specified texture and scaling/repeat settings to all floor surfaces in the room.

#### Example

```typescript
// Apply a light wood texture to all floor surfaces
configuratorCore.applyTextureToAllFloors({
  url: "https://example.com/textures/wood.jpg",
  repeatX: 1.0,
  repeatY: 1.0
});
```

---

### `resetFloor`

Resets all floors in the 3D viewer to their original colors and textures.

#### Syntax

```typescript
public resetFloor(): void
```

#### Description

This method immediately reverts any custom colors or textures applied to the floors in the 3D viewer, restoring them to their original default material state.

#### Example

```typescript
// Revert all floor surfaces back to their default paint/texture
configuratorCore.resetFloor();
```

---

### `toggleMeasurement`

Toggles distance measurements from the currently active model (or preview model) to surrounding objects or walls.

#### Syntax

```typescript
public toggleMeasurement(): boolean
```

#### Returns

| Type | Description |
| :--- | :--- |
| `boolean` | `true` if measurements were successfully drawn and applied, or `false` if no active model was found. |

#### Description

This method calculates and visualizes the distance from the currently selected model (or the floating preview model) to surrounding objects or walls in the 3D viewer. 

To configure the behavior of the distance measurements, update the public `measurementState` property on the instance before calling this method:

```typescript
configuratorCore.measurementState = {
  isActive: boolean;    // Enables or disables the measurement calculations
  isWallsOnly: boolean; // Measures only to walls (true) or to all obstacles (false)
};
```

If `measurementState.isActive` is set to `false`, calling `ToggleMeasurement()` clears all existing measurement helpers and returns `false`.

#### Example

```typescript
// 1. Enable distance measurements and limit them to walls only
configuratorCore.measurementState = {
  isActive: true,
  isWallsOnly: true
};

// 2. Apply and draw the measurements
const applied = configuratorCore.toggleMeasurement();
if (applied) {
  console.log("Distance measurements to walls displayed successfully.");
}
```

---

### `showAllMeasurements`

Shows all measurements for all placed models in the 3D viewer.

#### Syntax

```typescript
public showAllMeasurements(): void
```

#### Description

This method shows distance measurements from all placed models (plus the active preview model, if present) to surrounding elements in the 3D viewer.

#### Example

```typescript
// Display distance measurements for all placed models simultaneously
configuratorCore.showAllMeasurements();
```

---

### `clearAllMeasurements`

Removes all active measurement helpers (lines, labels, inputs) from the viewer.

#### Syntax

```typescript
public clearAllMeasurements(): void
```

#### Description

Removes all currently visible distance measurements from the viewer.

#### Example

```typescript
// Remove all distance measurements
configuratorCore.clearAllMeasurements();
```

---

### `enableVR`

Initiates a Virtual Reality (VR) session.

#### Syntax

```typescript
public enableVR(): void
```

#### Description

Enables Virtual Reality (VR) mode, allowing users to experience the 3D room design in an immersive environment on supported VR headsets.

#### Example

```typescript
// Start a VR session when the user clicks a VR button
configuratorCore.enableVR();
```

### `setBackgroundColor`

Sets the background color of the 3D viewer scene.

#### Syntax

```typescript
public setBackgroundColor(backgroundColor: number): void
```

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `backgroundColor` | `number` | The color value represented as a hexadecimal number (e.g., `0xffffff` for white, `0x000000` for black). |

#### Description

This method updates the background color of the 3D canvas scene dynamically.

#### Example

```typescript
// Change the viewer background color to white
configuratorCore.setBackgroundColor(0xffffff);
```

---

### `takeSnapshot`

Captures a snapshot of the current 3D viewer with an adjusted view.

#### Syntax

```typescript
public takeSnapshot(): string
```

#### Returns

| Type | Description |
| :--- | :--- |
| `string` | The base64 data URL of the captured PNG image. |

#### Description

This method adjusts the camera view to fit the model and captures it as a PNG image data URL.

#### Example

```typescript
// Capture a snapshot of the current viewer
const snapshotUrl = configuratorCore.takeSnapshot();

// Use the data URL (e.g., to display in an <img> tag or download)
const img = document.createElement("img");
img.src = snapshotUrl;
document.body.appendChild(img);
```

---

### `dispose`

Cleans up all configurator resources.

#### Syntax

```typescript
public dispose(): void
```

#### Description

This method properly destroys the configurator instance, frees up system resources, and cleans up internal memory. You should call this method when unmounting the 3D configurator component.

#### Example

```typescript
// Clean up configurator when unmounting a component or leaving the page
configuratorCore.dispose();
```
