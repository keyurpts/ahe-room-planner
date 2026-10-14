# API Event Emitters

The **Three Configurator** library leverages a global event system powered by `Events` and `ConfiguratorEventType` to notify your application of internal actions, state changes and user interactions.

## How to Listen to Events

Import the global `Events` emitter and use the `ConfiguratorEventType` enum to subscribe and unsubscribe:

```typescript
import { Events, ConfiguratorEventType } from 'three-configurator';

// Subscribing
Events.on(ConfiguratorEventType.MODEL_SELECTED, (payload) => {
  console.log("Selected model payload:", payload);
});

// Unsubscribing
Events.off(ConfiguratorEventType.MODEL_SELECTED, callback);
```


## Event Catalog & Integration Examples

Below is the complete list of all events emitted by the library.

### 1. `MODEL_SELECTED`
* **Triggered When**: A 3D model is selected or deselected.
* **Payload Structure**: `Object | null`
  * The payload is `null` if the selection is cleared.
  * If a model is selected, the payload is an object containing:
    * `id` (string): The unique identifier of the model.
    * `name` (string): The display name of the model.
    * `category` (string): The category of the model (e.g., "Sofa", "Cabinet", "Chair").
    * `price` (number | string): The base price of the model.
    * `appliedTexture` (object, optional): Contains `{ price: number | string }` if a custom texture is applied.
    * `appliedMaterial` (object, optional): Contains `{ price: number | string }` if custom material parameters are applied.
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.MODEL_SELECTED, (payload) => {
    if (payload) {
      console.log(`Selected model ID: ${payload.id}, Name: ${payload.name}, Price: ${payload.price}`);
    } else {
      console.log("Selection cleared");
    }
  });
  ```

### 2. `MODEL_HOVERED`
* **Triggered When**: The mouse pointer hovers over a selectable 3D model, or leaves all selectable models.
* **Payload Structure**: `Object | null`
  * The payload is `null` if the hover is cleared.
  * If hovering over a model, the payload is an object containing:
    * `id` (string): The unique identifier of the model.
    * `name` (string): The display name of the model.
    * `category` (string): The category of the model.
    * `price` (number | string): The base price of the model.
    * `appliedTexture` (object, optional): Contains `{ price: number | string }` if a custom texture is applied.
    * `appliedMaterial` (object, optional): Contains `{ price: number | string }` if custom material parameters are applied.
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.MODEL_HOVERED, (payload) => {
    if (payload) {
      console.log(`Hovering over model: ${payload.name} (Category: ${payload.category})`);
    } else {
      console.log("Hover cleared");
    }
  });
  ```

### 3. `MODEL_CONTEXT_MENU`
* **Triggered When**: User right-clicks on a selectable model (to trigger custom UI context menus) or on empty space (to dismiss it).
* **Payload Structure**: `Object | null`
  ```typescript
  {
    x: number;           // ClientX screen coordinate of the mouse pointer
    y: number;           // ClientY screen coordinate of the mouse pointer
    metadata: {          // The selected model's metadata details
      id: string;
      name: string;
      category: string;
      price: number | string;
      appliedTexture?: { price: number | string };
      appliedMaterial?: { price: number | string };
    };
  } | null
  ```
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.MODEL_CONTEXT_MENU, (payload) => {
    if (payload) {
      console.log(`Open context menu at coordinates X: ${payload.x}, Y: ${payload.y} for model ID: ${payload.metadata.id}`);
    } else {
      console.log("Close context menu");
    }
  });
  ```

### 4. `MODELS_SUMMARY_UPDATED`
* **Triggered When**: Models are added, removed, replaced, or updated (e.g. texture/material price updates).
* **Payload Structure**: `Object`
  ```typescript
  {
    models: {
      id: string;        // Unique product identifier of the item
      name: string;      // Display name of the item
      unitPrice: number; // The calculated unit price (base price + texture price + material price)
      quantity: number;  // The total quantity of this item placed in the room
    }[];
    grandTotal: number;  // Combined price of all placed items in the room
  }
  ```
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, (payload) => {
    console.log(`Models Summary Updated. Grand Total: ${payload.grandTotal}`);
    payload.models.forEach((item) => {
      console.log(`Model: ${item.name}, Qty: ${item.quantity}, Price: ${item.unitPrice}`);
    });
  });
  ```

### 5. `ROTATION_CHANGED`
* **Triggered When**: The rotation angle of the active model changes.
* **Payload Structure**: `number`
  * Returns the updated rotation angle of the model in degrees (from `0` to `360`).
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.ROTATION_CHANGED, (payload) => {
    console.log(`Selected model rotated. New angle: ${payload}°`);
  });
  ```

### 6. `HIERARCHY_CHANGED`
* **Triggered When**: The internal scene hierarchy changes (models are added, removed, cloned, or replaced).
* **Payload Structure**: `void`
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.HIERARCHY_CHANGED, () => {
    console.log("Hierarchy changed: request updated model list");
  });
  ```

### 7. `CLONE`
* **Triggered When**: The cloning process state changes (pending, complete or cancelled).
* **Payload Structure**: `Object`
  ```typescript
  {
    title: string;       // Status title (e.g. "Pending", "Success", "Cancelled")
    message: string;     // Notification message text
    category: string;    // Category of the cloned model
    color: string;       // ("warning" | "success")
  }
  ```
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.CLONE, (payload) => {
    console.log(`Cloning event: ${payload.title}. Message: ${payload.message}`);
  });
  ```

### 10. `REPLACE`
* **Triggered When**: The model replacement process state changes (pending, complete, or cancelled).
* **Payload Structure**: `Object`
  ```typescript
  {
    title: string;       // Status title (e.g. "Pending", "Success", "Cancelled")
    message: string;     // Notification message text
    category: string;    // Category of the replaced model
    color: string;       // ("warning" | "success")
    autoPlaced?: boolean;
  ```
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.REPLACE, (payload) => {
    console.log(`Replacement event: ${payload.title}. Message: ${payload.message}`);
  });
  ```

### 13. `EDIT_WALL_DIMENIONS`
* **Triggered When**: User double-clicks a wall's measurement label in the 2D viewer.
* **Payload Structure**: `Object`
  ```typescript
  {
    currentValue: number;       // The current length of the wall (in cm)
    isVertical: boolean;        // true if wall is vertical, false if horizontal
    clientX: number;            // X screen coordinate of the double-click event
    clientY: number;            // Y screen coordinate of the double-click event
    setNewWallDimension: (newValue: number, direction: any) => void; // Callback function to apply the new dimension
  }
  ```
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.EDIT_WALL_DIMENIONS, (payload) => {
    const { currentValue, isVertical, clientX, clientY, setNewWallDimension } = payload;
    
    // Example: prompt user for new dimension and apply it
    const newDimension = prompt(`Change wall length (current: ${currentValue}cm):`, currentValue.toString());
    if (newDimension) {
      const direction = isVertical ? 'vertical' : 'horizontal';
      setNewWallDimension(Number(newDimension), direction);
    }
  });
  ```

### 14. `COLLISION`
* **Triggered When**: A collision or boundary intersection is detected during placement or movement.
* **Payload Structure**: `Object`
  ```typescript
  {
    message: string;     // Collision message text (e.g. "Collision detected")
  }
  ```
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.COLLISION, (payload) => {
    console.warn(`Collision alert: ${payload.message}`);
  });
  ```

### 15. `PREVIEW_CANCELLED`
* **Triggered When**: The model placement/cloning/replacement preview is cancelled.
* **Payload Structure**: `void`
* **Integration Example**:
  ```typescript
  Events.on(ConfiguratorEventType.PREVIEW_CANCELLED, () => {
    console.log("Placement preview cancelled");
  });
  ```

