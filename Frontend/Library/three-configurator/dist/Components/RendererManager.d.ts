import * as THREE from 'three';
/**
 * Manages the Three.js WebGLRenderer instance with common configurations.
 */
export declare class RendererManager {
    /**
     * The Three.js WebGLRenderer instance.
     */
    renderer: THREE.WebGLRenderer;
    /**
     *  Creates a new RendererManager and initializes the WebGLRenderer
     *  with antialiasing, transparency, color space, and tone mapping settings.
     */
    constructor();
    /**
     * Sets the size of the renderer's output canvas.
     * @param width - The width in pixels.
     * @param height - The height in pixels.
     */
    setRendererSize(width: number, height: number): void;
    /**
     * Sets the pixel ratio for the renderer, useful for handling high-DPI screens.
     * @param pixelRatio - The pixel ratio (e.g., window.devicePixelRatio).
     */
    setRendererPixelRatio(pixelRatio: number): void;
    /**
     * Enables soft shadow mapping on the renderer.
     */
    enableShadowMap(): void;
}
