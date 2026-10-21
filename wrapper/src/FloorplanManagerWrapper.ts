import { FloorplanManager } from 'three-configurator';
import { Design2DWrapper } from './Design2DWrapper';
import { Design3DWrapper } from './Design3DWrapper';

/**
 * Wrapper around FloorplanManager.
 */
export class FloorplanManagerWrapper extends FloorplanManager {

  /**
   * Creates a 2D design instance using the container.
   *
   * @param container - The HTML element that hosts the 2D design.
   * @returns A new Design2DWrapper instance.
   */
  override createDesign2D(container: HTMLDivElement): Design2DWrapper {
    return new Design2DWrapper(container);
  }

  /**
  * Creates a 3D design instance using the container.
  *
  * @param container - The HTML element that hosts the 3D design.
  * @returns A new Design3DWrapper instance.
  */
  override createDesign3D(container: HTMLDivElement): Design3DWrapper {
    return new Design3DWrapper(container);
  }
}
