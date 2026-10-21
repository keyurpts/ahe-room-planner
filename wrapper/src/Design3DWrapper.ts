import { Design3D } from 'three-configurator';
import { ConfiguratorCoreWrapper } from './ConfiguratorCoreWrapper';

/**
 * Wrapper around Design3D.
 */
export class Design3DWrapper extends Design3D {
  declare core: ConfiguratorCoreWrapper | undefined;

  /**
   * Creates and returns a new ConfiguratorCoreWrapper instance
   *
   * @param {HTMLDivElement} container - The HTML container element used to initialize the configurator core.
   * @returns {ConfiguratorCoreWrapper} A new instance of ConfiguratorCoreWrapper.
   */
  override createConfiguratorCore(container: HTMLDivElement): ConfiguratorCoreWrapper {
    return new ConfiguratorCoreWrapper({
      container,
      backgroundColor: 0xffffff,
      cameraType: 'perspective',
      enableShadows: true,
    });
  }
}
