import { Design3D } from 'three-configurator';
import { ConfiguratorCoreWrapper } from './ConfiguratorCoreWrapper';

export class Design3DWrapper extends Design3D {
  declare core: ConfiguratorCoreWrapper | undefined;

  override createConfiguratorCore(container: HTMLDivElement): ConfiguratorCoreWrapper {
    return new ConfiguratorCoreWrapper({
      container,
      backgroundColor: 0xefefef,
      cameraType: 'perspective',
      enableShadows: true,
    });
  }
}
