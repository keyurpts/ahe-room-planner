import * as THREE from 'three';
import type { ExpandedConfigOption } from '../ProjectFileReader';
import type { ProjectConfig } from '../types/types';
/**
 * Controller to handle showing HTML tooltips when hovering over 3D model parts.
 */
export declare class TooltipOnHover {
    /**
     * THREE.Raycaster used to detect mouse hover intersection with 3D objects.
     */
    private raycaster;
    /**
     * Vector2 representing normalized device coordinates of the mouse.
     */
    private mouse;
    /**
     * CSS2DRenderer instance for rendering HTML tooltips in 3D space.
     */
    private labelRenderer;
    /**
     * HTML DOM element for the tooltip message box.
     */
    private tooltipElement;
    /**
     * CSS2DObject wrapping the tooltip DOM element.
     */
    private tooltipObject;
    /**
     * The active camera.
     */
    private camera;
    /**
     * The active 3D scene.
     */
    private scene;
    /**
     * HTML element parent of the WebGL renderer canvas.
     */
    private container;
    /**
     * Flag indicating if the hover tooltip behavior is active.
     */
    private enabled;
    /**
     * Expanded configuration map for parts.
     */
    private projectJSON;
    /**
     * Original project configuration file data.
     */
    private oldProjectJSON;
    /**
     * ResizeObserver to keep CSS2D renderer sized correctly.
     */
    private resizeObserver;
    /**
     * Initializes the TooltipOnHover controller.
     * Sets up the CSS2D renderer, tooltip element, and binds mousemove/resize events.
     * @param camera - The camera viewing the scene.
     * @param scene - The 3D scene instance.
     * @param container - The HTML container of the viewer.
     * @param updatedProjectJSON - Expanded configuration options.
     * @param oldProjectJSON - Original project configuration.
     */
    constructor(camera: THREE.Camera, scene: THREE.Scene, container: HTMLElement, updatedProjectJSON: Record<string, ExpandedConfigOption>, oldProjectJSON: ProjectConfig);
    /**
     * Initializes a ResizeObserver to automatically resize the label renderer when the container changes size.
     */
    private initResizeObserver;
    /**
     * Handles mouse movement to update the raycaster, detect hovered objects, and display the tooltip.
     */
    private OnMouseMove;
    /**
     * Updates the label renderer size on window/container resize.
     */
    private OnResize;
    /**
     * Renders the CSS2D labels/tooltips.
     */
    render(): void;
    /**
     * Disposes of the tooltip element, removes event listeners, and cleans up scene objects.
     */
    dispose(): void;
    /**
     * Enables the tooltip-on-hover functionality.
     */
    enable(): void;
    /**
     * Disables the tooltip-on-hover functionality and hides the tooltip.
     */
    disable(): void;
    /**
     * Recursively traverses up the hierarchy of a mesh to find a parent object matching the configuration keys.
     * @param mesh - The intersected mesh object.
     * @param configMap - The configuration map containing part IDs.
     * @returns Object containing the matched key and THREE.Object3D node, or null if no match.
     */
    private findMatchingParent;
}
