import * as THREE from 'three';
import { WebGLPowerPreference } from '../Constants';

/**
 * Manages the Three.js WebGLRenderer instance with common configurations.
 */
export class RendererManager {
  /**
   * The Three.js WebGLRenderer instance.
   */
  public renderer: THREE.WebGLRenderer;

    /**
     *  Creates a new RendererManager and initializes the WebGLRenderer
     *  with antialiasing, transparency, color space, and tone mapping settings.
     */
    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: WebGLPowerPreference.HIGH_PERFORMANCE
        });

    // Configure renderer for better visual quality
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  /**
   * Sets the size of the renderer's output canvas.
   * @param width - The width in pixels.
   * @param height - The height in pixels.
   */
  public setRendererSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  /**
   * Sets the pixel ratio for the renderer, useful for handling high-DPI screens.
   * @param pixelRatio - The pixel ratio (e.g., window.devicePixelRatio).
   */
  public setRendererPixelRatio(pixelRatio: number): void {
    // Cap at 3 — 2 is often enough, but 3 provides extra sharpness on ultra-high-DPI screens
    this.renderer.setPixelRatio(Math.min(pixelRatio, 3));
  }

  /**
   * Enables soft shadow mapping on the renderer.
   */
  public enableShadowMap(): void {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
}
