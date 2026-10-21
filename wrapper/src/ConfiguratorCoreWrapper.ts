import { ConfiguratorCore } from 'three-configurator';
import type { Object3D } from 'three';

/**
 * Wrapper around ConfiguratorCore.
 */
export class ConfiguratorCoreWrapper extends ConfiguratorCore {

  /**
   * Loads the environment map and applies a white background color.
   *
   * @param {...Parameters<ConfiguratorCore['loadEnvironmentMap']>} args - Arguments forwarded to the base environment map loader.
   * @returns {Promise<void>} A promise that resolves when the environment map is loaded and the background color is applied.
   */
  override async loadEnvironmentMap(...args: Parameters<ConfiguratorCore['loadEnvironmentMap']>): Promise<void> {
    await super.loadEnvironmentMap(...args);
    super.setBackgroundColor(0xffffff);
  }

  /**
   * Loads the 2D-to-3D mesh and removes the ground plane from its parent.
   *
   * @param {Object3D} model - The 3D model to load.
   * @param {Object3D} groundPlane - The ground plane object to remove after loading the mesh.
   * @returns {void}
   */
  override load2DTo3DMesh(model: Object3D, groundPlane: Object3D): void {
    super.load2DTo3DMesh(model, groundPlane);
    groundPlane.removeFromParent();
  }
}
