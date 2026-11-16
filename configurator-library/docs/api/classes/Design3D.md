[three-configurator](../index.md) / Design3D

# Class: Design3D

Defined in: [Components/Design3D.ts:16](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L16)

Design3D class handles the 3D representation of the floorplan.
It uses ConfiguratorCore for scene management and Three.js for rendering.

## Constructors

### Constructor

```ts
new Design3D(container): Design3D;
```

Defined in: [Components/Design3D.ts:76](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L76)

Initializes the 3D designer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container` | `HTMLDivElement` | The HTML element to host the 3D canvas. |

#### Returns

`Design3D`

## Properties

### core

```ts
core: ConfiguratorCore | undefined;
```

Defined in: [Components/Design3D.ts:20](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L20)

ConfiguratorCore instance handling the 3D scene, rendering, and camera controls.

## Methods

### clearWalls()

```ts
clearWalls(): void;
```

Defined in: [Components/Design3D.ts:416](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L416)

Removes all 3D wall meshes from the scene.

#### Returns

`void`

***

### dispose()

```ts
dispose(): void;
```

Defined in: [Components/Design3D.ts:460](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L460)

Clean up resources.

#### Returns

`void`

***

### enter3DView()

```ts
enter3DView(): void;
```

Defined in: [Components/Design3D.ts:436](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L436)

Activates the 3D renderer, initializing it if needed
and applying any pending wall data.

#### Returns

`void`

***

### exit3DView()

```ts
exit3DView(): void;
```

Defined in: [Components/Design3D.ts:449](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L449)

Pauses 3D rendering without destroying state.

#### Returns

`void`

***

### get3DModes()

```ts
get3DModes(): CurrentMode | undefined;
```

Defined in: [Components/Design3D.ts:492](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L492)

Retrieves the currently active 3D application mode from the core instance.

#### Returns

`CurrentMode` \| `undefined`

The current 3D mode, or undefined if the core instance is unavailable.

***

### getCore()

```ts
getCore(): ConfiguratorCore | undefined;
```

Defined in: [Components/Design3D.ts:470](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L470)

Returns the ConfiguratorCore instance if it exists.

#### Returns

[`ConfiguratorCore`](ConfiguratorCore.md) \| `undefined`

The ConfiguratorCore instance or undefined.

***

### getUndoRedoPayload()

```ts
getUndoRedoPayload(): Undo_Redo_Payload;
```

Defined in: [Components/Design3D.ts:508](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L508)

Get the undo-redo-satck size

#### Returns

`Undo_Redo_Payload`

payload

***

### loadFromJson()

```ts
loadFromJson(data): void;
```

Defined in: [Components/Design3D.ts:104](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L104)

Converts 2D data to 3D walls and floors and renders them.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `any` | The JSON dataset containing layout information. |

#### Returns

`void`

***

### set3DModes()

```ts
set3DModes(mode): void;
```

Defined in: [Components/Design3D.ts:483](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L483)

Sets the current 3D application mode through the core instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mode` | `CurrentMode` | The 3D mode to activate. |

#### Returns

`void`

***

### setUndoRedoLimit()

```ts
setUndoRedoLimit(limit): void;
```

Defined in: [Components/Design3D.ts:500](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/Design3D.ts#L500)

set undo-redo limit to stack

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `limit` | `number` | - |

#### Returns

`void`
