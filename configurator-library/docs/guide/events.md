# Interactive Events

This guide explains the events and user interactions supported by the **Three Configurator** library. It details how mouse/keyboard actions trigger changes and how to subscribe to custom API events.


## 1. 2D Plan Mode Interactions

The 2D viewer captures mouse events to control drawing, snapping, and layout modifications:

### Left Click
* **Start Wall Drawing**: When wall drawing mode is active (set via [set2DMode](./floorplanManager.md#set2dmode)), clicking on the 2D viewer starts drawing wall lines.
* **Door & Window Placement**: When door or window mode is enabled (set via [set2DMode](./floorplanManager.md#set2dmode)), hovering over a wall displays a preview of the door or window. Left-click directly on the wall to place them.
* **Edit Walls & Endpoints**: When edit mode is active (set via [set2DMode](./floorplanManager.md#set2dmode)), click to select a wall segment, and click-and-drag any of its endpoints to update its position and dimensions.

### Right Click
* **Cancel Drawing Mode**: Instantly exits active drawing, door placement, or window placement tools (disabling the active state via [set2DMode](./floorplanManager.md#set2dmode)).
* **Pan Workspace**: Hold and drag the Right Mouse Button to slide/pan the 2D viewer viewport in any direction.

### Double Click
* **Dimension Input**: Double-clicking on a wall's measurement label triggers the `EDIT_WALL_DIMENIONS` event (see the [API Event Emitters](./emitters.md#_1-edit-wall-dimenions) guide for details).
* **Start or Finish Drawing**: Double-clicking on empty space automatically starts drawing a wall (without needing to manually enable drawing mode first).



### Mouse Wheel
* **Zoom**: Scroll up to zoom in, or scroll down to zoom out on the 2D viewer.


## 2. 3D Viewer Mode Interactions

The 3D viewer (controlled via the [ConfiguratorCore](./configuratorCore.md) class) handles mouse clicks and keyboard keys to manage models placements and camera angles:

### Left Click
* **Confirm Placement**: While placing a new model, replacing an existing model, or placing a duplicated model, clicking the Left Mouse Button confirms the position and drops the model onto the floor.
* **Collision Check**: The library automatically runs collision boundaries during placement. If the model overlaps with walls or other objects, left-click placement is blocked until the model is moved to a clear space.
* **Attach Controls**: Clicking on a placed model selects it and attaches interaction controls. User can change the active control type using API **[`switchControlMode`](./configuratorCore.md#switchcontrolmode)** and change transform modes using **[`setTransformMode`](./configuratorCore.md#settransformmode)**.
* **Multi-Model Selection (Ctrl / Cmd + Click)**: Hold the `Ctrl` key (or `Cmd` key on macOS) while left-clicking to select multiple models. This groups them together so they can be moved or rotated simultaneously. Clicking normally on any model or empty space without holding the modifier key will ungroup them.

### Right Click / Escape Key
* **Cancel Placement**: While in placement, replacement, or cloning modes, pressing the `Escape` key or clicking the Right Mouse Button cancels the active placement. If you were replacing an model, the original model is restored.
* **Context Menu**: When not in placement mode, right-clicking directly on a placed furniture models opens the viewer context controls menu (e.g., duplicate/delete).

### Double Click
* **Camera Focus**: Double-clicking on any placed model (such as furniture, cabinets, etc.) automatically rotates and fits the camera to frame and focus directly on that object.



