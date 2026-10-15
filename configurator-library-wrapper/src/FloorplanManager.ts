import { FloorplanManager as LibraryManager } from 'three-configurator';
import { LengthUnit, normalizeLengthUnit } from './units';
import { Design2DWrapper } from './Design2DWrapper';
import { Design3DWrapper } from './Design3DWrapper';
import { ConfiguratorCoreWrapper } from './ConfiguratorCoreWrapper';


/** The SDK owns base behavior; the wrapper supplies unit-aware viewers. */
export class FloorplanManager extends LibraryManager {
  private editor: Design2DWrapper | null = null;
  private viewer: Design3DWrapper | null = null;
  private unit = LengthUnit.MM;
  private initialized = false;

  override createDesign2D(container: HTMLDivElement): Design2DWrapper {
    this.editor = new Design2DWrapper(container);
    this.editor.setLengthUnit(this.unit);
    return this.editor;
  }

  override createDesign3D(container: HTMLDivElement): Design3DWrapper {
    this.viewer = new Design3DWrapper(container);
    this.viewer.core?.setLengthUnit(this.unit);
    return this.viewer;
  }

  override init(viewer2D: HTMLDivElement, viewer3D: HTMLDivElement): void {
    if (this.initialized) throw new Error('The configurator is already initialized.');
    try {
      super.init(viewer2D, viewer3D);
      this.initialized = true;
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  getLengthUnit(): LengthUnit { return this.unit; }

  setLengthUnit(unit: LengthUnit | string): void {
    this.unit = normalizeLengthUnit(unit);
    this.editor?.setLengthUnit(this.unit);
    this.viewer?.core?.setLengthUnit(this.unit);
  }

  override getConfiguratorCore(): ConfiguratorCoreWrapper | undefined { return this.viewer?.core; }

  override dispose(): void {
    super.dispose();
    this.editor = null;
    this.viewer = null;
    this.initialized = false;
  }
}
