---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "<span style='font-size: 3.6rem; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, var(--vp-c-brand-1), #8a2be2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block;'>Three Configurator</span>"
  text: "<span style='font-size: 1.8rem; font-weight: 500; color: var(--vp-c-text-2); display: block; margin-top: 8px;'>3D Room Planner & Configurator Library</span>"
  tagline: "<span style='font-size: 1.15rem; font-weight: 400; color: var(--vp-c-text-3); display: block; max-width: 620px; line-height: 1.6; margin-top: 16px;'>A modular, high-performance library for building interactive 2D/3D floor planning and product configuration applications.</span>"
  actions:
    - theme: alt
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: React Integration
      link: /integration/react

features:
  - title: 2D Floor Planning
    details: Create and edit room layouts by drawing walls, adding doors and windows, modifying wall dimensions, using precision snapping, and importing or exporting layouts with JSON.
    link: /guide/getting-started
    linkText: Getting started
  - title: 3D Visualization and Configuration
    details: Visualize and configure your room in an interactive 3D environment. Navigate the 3D viewer, place and customize furniture, view accurate measurements, experience realistic lighting, and explore the space in VR.
    link: /guide/concepts
    linkText: Core concepts
  - title: Model Customization
    details: Seamlessly Place furniture, translate and rotate models, change materials and textures, perform copy, delete and replace operations and show accurate measurements.
    link: /api/
    linkText: View API reference
---


## Library Overview

This documentation hub covers everything you need to consume and integrate `three-configurator` within a modern frontend application. Here, you'll find comprehensive guides for installation, the complete API specifications, event subscription patterns and fully worked integration examples for **React**, **Angular**, and **Vanilla JavaScript**.


## Quick Example: Initialization & Mode Control

Get started by importing the manager, instantiating the viewer elements, and switching interaction modes:

```typescript
import { FloorplanManager } from 'three-configurator';

// 1. Instantiate the floorplan coordinator
const floorplan = new FloorplanManager();

// 2. Initialize with your 2D and 3D DOM containers
floorplan.init(container2D, container3D);

// 3. Set the active 2D mode (e.g., 'draw', 'edit', 'door', 'window')
floorplan.set2DMode('draw', true);
```

