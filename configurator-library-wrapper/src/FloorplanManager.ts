import { FloorplanManager as LibraryManager, type ConfiguratorCore, type RoomEditorMode } from 'three-configurator';
import { LengthUnit, normalizeLengthUnit } from './units';
import { installUnitBridge } from './unit-bridge';
import { roomTemplate } from './room-templates';

export type RoomShape = 'rectangle' | 'square' | 'l-top-left' | 'l-top-right' | 'l-bottom-left' | 'l-bottom-right';

/** Frontend entry point. SDK ownership and application extensions live here. */
export class FloorplanManager {
  private manager: LibraryManager | null = null;
  private unit = LengthUnit.MM;
  private unitBridge: ReturnType<typeof installUnitBridge> | null = null;

  init(viewer2D: HTMLDivElement, viewer3D: HTMLDivElement): void {
    if (this.manager) throw new Error('The configurator is already initialized.');
    const manager = new LibraryManager();
    try {
      manager.init(viewer2D, viewer3D);
      const core = manager.getConfiguratorCore();
      if (!core) throw new Error('The configurator core could not be initialized.');
      this.unitBridge = installUnitBridge(manager, core, () => this.unit);
      this.manager = manager;
      this.unitBridge.refresh();
    } catch (error) {
      manager.dispose();
      this.manager = null;
      this.unitBridge = null;
      throw error;
    }
  }

  createRoom(shape: RoomShape): void {
    const manager = this.getManager();
    manager.switchTo2D();
    manager.clear2DLayout();
    manager.addPredefinedShape(roomTemplate(shape));
    this.unitBridge!.placeRoom();
    manager.fitToView();
  }

  getLengthUnit(): LengthUnit { return this.unit; }
  setLengthUnit(unit: LengthUnit | string): void {
    this.unit = normalizeLengthUnit(unit);
    this.unitBridge?.refresh();
  }
  getConfiguratorCore(): ConfiguratorCore | undefined { return this.manager?.getConfiguratorCore(); }
  set on2DModeChange(callback: ((mode: RoomEditorMode | null) => void) | undefined) {
    this.getManager().on2DModeChange = callback;
  }
  set2DMode(mode: RoomEditorMode | string, active: boolean): void { this.getManager().set2DMode(mode, active); }
  enableSnapping(enabled: boolean): boolean { return this.getManager().enableSnapping(enabled); }
  deleteSelectedEntity(): void { this.getManager().deleteSelectedEntity(); }
  clear2DLayout(): void { this.getManager().clear2DLayout(); }
  fitToView(): void { this.getManager().fitToView(); }
  switchTo2D(): void { this.getManager().switchTo2D(); }
  async switchTo3D(callback?: (detected: boolean) => void): Promise<boolean> {
    const result = await this.getManager().switchTo3D(callback);
    this.unitBridge?.refresh();
    return result;
  }
  dispose(): void {
    this.unitBridge?.dispose();
    this.unitBridge = null;
    this.manager?.dispose();
    this.manager = null;
  }
  private getManager(): LibraryManager {
    if (!this.manager) throw new Error('Call init() before using the configurator.');
    return this.manager;
  }
}
