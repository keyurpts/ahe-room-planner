# Core Concepts

This guide introduces the core concepts and design patterns used by the **Three Configurator** library. Understanding these patterns will help you build and customize your room planning applications.


## 1. Dual-Mode Operation

The library provides distinct modes of operation:
* **2D Plan Mode**: Handles structural drawing logic, snap-to-grid alignments, wall segment creation, and door/window positions. Users can draw custom layouts or use pre-configured room shapes (such as L-shape, square, or rectangular structures) provided by default.
* **3D Interactive Mode**: Converts the 2D layout into a 3D view, allowing users to navigate around the room, place furniture, and customize materials.

The library automatically handles the layout conversion, ensuring that all elements drawn in the 2D planner are built accurately when you switch to the 3D viewer.


## 2. Workspace Containers

To initialize the configurator (using the [`init`](./floorplanManager.md#init) method), you must provide two HTML container elements (usually `div` nodes):
* **2D Container**: The HTML element where the 2D viewer drawing area will render.
* **3D Container**: The HTML element where the interactive 3D viewer will render.

> [!IMPORTANT]
> **Data & View Persistence**: To switch views, you should toggle the visibility of these containers, instead of unmounting or destroying the DOM elements from the page. This ensures that the 2D drawing data and 3D states remain intact.

The size of these containers determines the rendering dimensions. The library monitors these containers and automatically resizes the viewports on window size changes.


## 3. Scale and Unit Configuration

The library uses a configurable grid system to map screen drawing distances to physical measurements:

* **Grid Scaling**: By default, one grid square on the 2D viewer represents 30 centimeters. You can change this scale dynamically by calling [`floorplanManager.set2DUnitScale(cmValue)`](./floorplanManager.md#set2dunitscale).
* **Frontend Usage**: When you call this method with a new value, the library automatically recalculates and updates the dimension labels, window widths, door sizes, and reflect that new scale on the 2D viewer.




