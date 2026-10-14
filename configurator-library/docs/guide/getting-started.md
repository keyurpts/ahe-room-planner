# Getting Started

Welcome to the **Three Configurator** guide. This walkthrough explains how to integrate and initialize the 3D Configurator Library in your web application.


## 1.0 Overview

The **Three Configurator** is a modular, extensible library that combines a **3D viewer** and a **2D viewer** into a unified workspace. It allows developers to build interactive space configurators where users can design room layouts, position furniture models (GLTF/GLB), and swap textures/materials in real time.


## 2.0 Functional Capabilities

The library operates in a seamless dual-mode workflow (2D and 3D), allowing users to switch viewpoints dynamically.

### 2.1 2D Floor Planning
In the 2D view, users can easily focus on the architectural layout of their room. Key actions include:

* **Draw Walls**: Easily draw walls to create custom room layouts.
* **Place Doors and Windows**: Seamlessly insert and position structural elements like doors and windows directly onto walls.
* **Edit & Delete Structures**: Modify wall dimensions, remove selected walls, doors and windows from the 2D viewer.
* **Precision Snapping**: Helps align and connect walls and structural elements accurately.
* **Export and Import Layout**: Save (export) the current 2D layout or load (import) an existing layout using structured JSON data.

### 2.2 3D Visualization and Configuration
In the 3D view, users experience their design in a fully interactive environment. Key capabilities include:

* **View & Navigate 3D Layout**: View a fully interactive 3D representation of the layout drawn in the 2D mode, and explore the room using various intuitive camera controls.
* **Place Models**: Seamlessly position furniture, kitchen components and bathroom models directly into the 3D viewer.
* **Customize Objects**: Modify placed models by changing materials and textures or by performing copy, delete and replace operations.
* **Show Measurements**: Display accurate distance measurements from model to model or from an model to the nearest wall.
* **Realistic Lighting & VR Support**: High quality lighting rendering that enhances visual realism, with Virtual Reality (VR) rendering for immersive walkthroughs.


## 4.0 Integration Guide

Follow these three steps to integrate the three configurator into your component codebase.

### Step 1: Import the FloorplanManager
Import the coordinator class into your component file:

```typescript
import { FloorplanManager } from "three-configurator";
```

### Step 2: Instantiate the Coordinator
Create a single persistent instance of the manager class:

```typescript
const floorplanManager = new FloorplanManager();
```

### Step 3: Initialize the HTML Containers

Create the 2D and 3D Div containers in your Application and pass their references to the init() method.

```typescript
floorplanManager.init(container2D, container3D);
```

This initializes the library and renders the 2D viewer and 3D viewer inside the provided containers.


## Next Steps
Now that your first configurator is mounted, explore the [Core Concepts](./concepts.md) to understand concepts in deep.