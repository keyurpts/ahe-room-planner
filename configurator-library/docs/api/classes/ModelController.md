[three-configurator](../index.md) / ModelController

# Class: ModelController

Defined in: [Components/ModelController.ts:12](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L12)

ModelController is responsible for controlling the visibility and behavior
of a 3D model (THREE.Object3D) in a scene, including autorotation, preset camera views,
and replacing models dynamically.

## Constructors

### Constructor

```ts
new ModelController(
   scene, 
   camera, 
   controls, 
   container, 
   collisionSystem, 
   assetLoader?): ModelController;
```

Defined in: [Components/ModelController.ts:91](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L91)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `scene` | `Scene` | THREE.Scene instance containing the model |
| `camera` | `Camera` | THREE.Camera (Perspective or Orthographic) used to view the scene |
| `controls` | `any` | OrbitControls linked to the camera & renderer |
| `container` | `HTMLElement` | HTML container element used for size/aspect calculations |
| `collisionSystem` | `CollisionSystem` | CollisionSystem instance for spatial intersection tests |
| `assetLoader?` | `AssetLoader` | - |

#### Returns

`ModelController`

## Properties

### currentBoxHelper

```ts
currentBoxHelper: 
  | LineSegments<BufferGeometry<NormalBufferAttributes>, Material | Material[], Object3DEventMap>
  | null = null;
```

Defined in: [Components/ModelController.ts:82](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L82)

Box helper showing the selection bounds of the active model.

***

### placedModels

```ts
placedModels: Object3D<Object3DEventMap>[] = [];
```

Defined in: [Components/ModelController.ts:52](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L52)

Array containing all placed THREE.Object3D models in the scene.

## Methods

### addBoundingBoxHelper()

```ts
addBoundingBoxHelper(model, type?): 
  | void
| LineSegments<BufferGeometry<NormalBufferAttributes>, Material | Material[], Object3DEventMap>;
```

Defined in: [Components/ModelController.ts:960](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L960)

Adds an Object-Oriented Bounding Box (OOBB) helper to the specified model.
Internal logic calculates the precise local bounds and creates a wireframe
box parented to the model for automatic transform synchronization.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `model` | `Object3D` | `undefined` | The THREE.Object3D to attach the bounding box helper to. |
| `type` | `"hover"` \| `"select"` | `"select"` | Whether this helper is for hover or select state. |

#### Returns

  \| `void`
  \| `LineSegments`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

***

### applyTexture()

```ts
applyTexture(object, texUrl): void;
```

Defined in: [Components/ModelController.ts:519](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L519)

Loads a texture from a URL and applies it to the material(s) of all meshes in the object hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `object` | `Object3D` | The THREE.Object3D instance (and its children) to apply the texture to. |
| `texUrl` | `string` | The URL of the texture image. |

#### Returns

`void`

***

### checkModelCollision()

```ts
checkModelCollision(
   mobileModel, 
   lastValidPosition, 
   lastValidRotation): boolean;
```

Defined in: [Components/ModelController.ts:901](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L901)

Delegates transformed model collision checking to the CollisionSystem.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mobileModel` | `Object3D` | The THREE.Object3D currently being moved/rotated. |
| `lastValidPosition` | `Vector3` | Vector3 reference to restore position on collision. |
| `lastValidRotation` | `Quaternion` | Quaternion reference to restore rotation on collision. |

#### Returns

`boolean`

`true` if a collision occurred and the transformation was reverted, `false` otherwise.

***

### checkPreviewCollision()

```ts
checkPreviewCollision(preview): boolean;
```

Defined in: [Components/ModelController.ts:889](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L889)

Delegates preview collision checking to the CollisionSystem.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `preview` | `Object3D` | The preview THREE.Object3D being positioned. |

#### Returns

`boolean`

`true` if a collision is detected, `false` otherwise.

***

### computePreciseLocalBox()

```ts
computePreciseLocalBox(object): Box3;
```

Defined in: [Components/ModelController.ts:923](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L923)

Computes a precise bounding box for the given object in its own local coordinate space.
Unlike the standard Box3.setFromObject, this method transforms all child mesh
vertices into the parent's local space to provide a tight-fitting Axis-Aligned Bounding Box (AABB)
relative to the object's origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `object` | `Object3D` | The THREE.Object3D to compute the local bounds for. |

#### Returns

`Box3`

A THREE.Box3 representing the precise local bounds.

***

### disableAutoRotate()

```ts
disableAutoRotate(): void;
```

Defined in: [Components/ModelController.ts:154](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L154)

Disables auto-rotation for all models.

#### Returns

`void`

***

### enableAutoRotate()

```ts
enableAutoRotate(model, speed?): void;
```

Defined in: [Components/ModelController.ts:140](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L140)

Enables auto-rotation for a specific model at a given speed.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `model` | `Object3D` | `undefined` | The model object to auto-rotate. |
| `speed` | `number` | `0.01` | The rotation speed in radians per frame (default is 0.01). |

#### Returns

`void`

***

### ensureBVH()

```ts
ensureBVH(object): void;
```

Defined in: [Components/ModelController.ts:879](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L879)

Delegates BVH generation to the CollisionSystem for the given object hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `object` | `Object3D` | The THREE.Object3D to generate BVH for. |

#### Returns

`void`

***

### fitToView()

```ts
fitToView(padding?): void;
```

Defined in: [Components/ModelController.ts:686](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L686)

Adjusts the camera to fit the given object into view, preserving the current rotation.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `padding` | `number` | `1.8` | Optional padding factor (e.g., 1.1 for 10% padding). |

#### Returns

`void`

***

### getConfigurablePartById()

```ts
getConfigurablePartById(id, partIdentifierProperty): Object3D<Object3DEventMap> | null;
```

Defined in: [Components/ModelController.ts:460](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L460)

Retrieves a configurable part (THREE.Object3D) from the scene by its ID and identifier property.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID value to match. |
| `partIdentifierProperty` | `string` | The property to check on the object (e.g. 'name' or custom user data key). |

#### Returns

`Object3D`\<`Object3DEventMap`\> \| `null`

The matching THREE.Object3D object, or null if not found.

***

### GetRoomModel()

```ts
static GetRoomModel(scene): Object3D<Object3DEventMap> | null;
```

Defined in: [Components/ModelController.ts:1050](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L1050)

Retrieves the room model object from the scene by its name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `scene` | `Scene` | The THREE.Scene containing the room model. |

#### Returns

`Object3D`\<`Object3DEventMap`\> \| `null`

The room model THREE.Object3D if found, or null otherwise.

***

### hideModel()

```ts
hideModel(): void;
```

Defined in: [Components/ModelController.ts:118](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L118)

Hide the given model

#### Returns

`void`

***

### removeBoundingBoxHelper()

```ts
removeBoundingBoxHelper(): void;
```

Defined in: [Components/ModelController.ts:1008](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L1008)

Removes and disposes the current bounding box helper from the scene/model.

#### Returns

`void`

***

### replaceModel()

```ts
replaceModel(oldModel, newModel): void;
```

Defined in: [Components/ModelController.ts:363](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L363)

Replace an existing model in the scene with a new one.
Transfers autorotation settings if present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldModel` | `Object3D` | The current THREE.Object3D in the scene |
| `newModel` | `Object3D` | The new THREE.Object3D to add |

#### Returns

`void`

***

### replaceSwappableOption()

```ts
replaceSwappableOption(
   id, 
   url, 
partIdentifierProperty): Promise<void>;
```

Defined in: [Components/ModelController.ts:389](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L389)

Replaces a model in the scene using a custom `pid` identifier stored in `userData`.

Searches the scene for a node with a matching `pid`, then replaces it with the root child
of a newly loaded model. The `pid` is preserved on the new model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The custom `pid` of the object to replace. |
| `url` | `string` | The URL to load the replacement model from (GLB format). |
| `partIdentifierProperty` | `string` | - |

#### Returns

`Promise`\<`void`\>

***

### replaceTexture()

```ts
replaceTexture(
   id, 
   texUrl, 
partIdentifierProperty): Promise<void>;
```

Defined in: [Components/ModelController.ts:498](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L498)

Replaces the texture of a model's mesh using a provided image URL.

Searches for a node with a matching `pid`, then loads and applies the texture
to all mesh materials (Basic, Standard, or Phong) under that node.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The custom `pid` of the object to apply the texture to. |
| `texUrl` | `string` | The URL of the texture image to apply. |
| `partIdentifierProperty` | `string` | - |

#### Returns

`Promise`\<`void`\>

***

### setHomeView()

```ts
setHomeView(model): void;
```

Defined in: [Components/ModelController.ts:810](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L810)

Sets the camera and OrbitControls to an isometric home view

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The root Object3D of your loaded GLB model |

#### Returns

`void`

***

### setModelView()

```ts
setModelView(camView): void;
```

Defined in: [Components/ModelController.ts:1029](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L1029)

Sets the camera view of the room model to a predefined viewpoint (top, bottom, front, back, left, right, home).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `camView` | `string` | The string name of the target camera viewpoint. |

#### Returns

`void`

***

### showModel()

```ts
showModel(): void;
```

Defined in: [Components/ModelController.ts:110](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L110)

Show the given model

#### Returns

`void`

***

### updateCamera()

```ts
updateCamera(camera, controls): void;
```

Defined in: [Components/ModelController.ts:129](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L129)

Updates the active camera and controls references.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `camera` | `Camera` | The new THREE.Camera instance. |
| `controls` | `any` | The new OrbitControls instance. |

#### Returns

`void`

***

### updateHelper()

```ts
updateHelper(): void;
```

Defined in: [Components/ModelController.ts:1020](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L1020)

Updates the bounding box helper to keep it in sync (since it is parented, this is primarily a structural check).

#### Returns

`void`

***

### updateMaterial()

```ts
updateMaterial(model, props): void;
```

Defined in: [Components/ModelController.ts:617](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L617)

Updates material properties (color, metalness, roughness, side, and texture) of all meshes in the model hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The THREE.Object3D instance to update. |
| `props` | \{ `color?`: `string` \| `number`; `metalness?`: `number`; `roughness?`: `number`; `side?`: `Side`; `texture?`: `string`; \} | Object containing new material property values. |
| `props.color?` | `string` \| `number` | - |
| `props.metalness?` | `number` | - |
| `props.roughness?` | `number` | - |
| `props.side?` | `Side` | - |
| `props.texture?` | `string` | - |

#### Returns

`void`

***

### updateMaterialProperties()

```ts
updateMaterialProperties(
   id, 
   props, 
partIdentifierProperty): Promise<void>;
```

Defined in: [Components/ModelController.ts:558](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L558)

Updates the material properties of a model's mesh using MeshPhysicalMaterial.

Searches for a node with a matching `pid`, then applies the given material properties
(color, metalness, roughness, side) to all mesh nodes under that node using MeshPhysicalMaterial.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The custom `pid` of the object to apply the material changes to. |
| `props` | \{ `color?`: `string` \| `number`; `metalness?`: `number`; `roughness?`: `number`; `side?`: `Side`; `texture?`: `string`; \} | The material properties to apply. |
| `props.color?` | `string` \| `number` | - |
| `props.metalness?` | `number` | - |
| `props.roughness?` | `number` | - |
| `props.side?` | `Side` | - |
| `props.texture?` | `string` | - |
| `partIdentifierProperty` | `string` | - |

#### Returns

`Promise`\<`void`\>

***

### viewBack()

```ts
viewBack(model, offset?): void;
```

Defined in: [Components/ModelController.ts:313](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L313)

Snaps the camera to the back view of the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The model object to focus on. |
| `offset?` | `number` | Optional distance multiplier offset. |

#### Returns

`void`

***

### viewBottom()

```ts
viewBottom(model, offset?): void;
```

Defined in: [Components/ModelController.ts:353](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L353)

Snaps the camera to the bottom view of the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The model object to focus on. |
| `offset?` | `number` | Optional distance multiplier offset. |

#### Returns

`void`

***

### viewFront()

```ts
viewFront(model, offset?): void;
```

Defined in: [Components/ModelController.ts:303](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L303)

Snaps the camera to the front view of the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The model object to focus on. |
| `offset?` | `number` | Optional distance multiplier offset. |

#### Returns

`void`

***

### viewLeft()

```ts
viewLeft(model, offset?): void;
```

Defined in: [Components/ModelController.ts:323](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L323)

Snaps the camera to the left view of the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The model object to focus on. |
| `offset?` | `number` | Optional distance multiplier offset. |

#### Returns

`void`

***

### viewRight()

```ts
viewRight(model, offset?): void;
```

Defined in: [Components/ModelController.ts:333](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L333)

Snaps the camera to the right view of the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The model object to focus on. |
| `offset?` | `number` | Optional distance multiplier offset. |

#### Returns

`void`

***

### viewTop()

```ts
viewTop(model, offset?): void;
```

Defined in: [Components/ModelController.ts:343](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/ModelController.ts#L343)

Snaps the camera to the top view of the model.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `Object3D` | The model object to focus on. |
| `offset?` | `number` | Optional distance multiplier offset. |

#### Returns

`void`
