import type { ConfiguratorCore } from "../ConfiguratorCore";
import { Design3D } from "./Design3D";
import { RoomEditorMode, LengthUnit, normalizeLengthUnit } from "../Constants";
import { Design2D } from "./Design2D";
import { Predefined2DShapes } from "../shapeTemplates";

/**
 * Manages coordination between the 2D editor and the 3D viewer.
 * Handles initialization, view switching and data synchronization.
 */
export class FloorplanManager {
  private design2D: Design2D | null = null;
  private design3D: Design3D | null = null;
  private initialUnit: LengthUnit = LengthUnit.MM;

  /**
   * Initializes both the 2D viewer and the 3D viewer
   * inside their respective container elements.
   *
   * @param {HTMLDivElement} container2D
   * The HTML element where the 2D viewer is rendered.
   *
   * @param {HTMLDivElement} container3D
   * The HTML element where the 3D viewer is rendered.
   *
   * @returns {void}
   *
   * @description
   * This method must be called after the FloorplanManager is instantiated
   * and both the 2D and 3D container div elements are created.
   *
   * The viewer works in one mode at a time, so the 2D and 3D containers
   * should toggle visibility dynamically, showing one and hiding the other.
   *
   */
  public init(container2D: HTMLDivElement, container3D: HTMLDivElement): void {
    this.design2D = new Design2D(container2D);
    this.design2D.setLengthUnit(this.initialUnit);
    this.design3D = new Design3D(container3D);
  }

  /**
   * Switches the view from the 2D viewer to the 3D viewer.
   *
   * @param {(isDetected: boolean) => void} [isRoomDetected]
   * Optional callback that receives `true` if a complete room layout
   * is detected, and `false` otherwise.
   *
   * @returns {Promise<boolean>}
   * Returns `true` if the view successfully switches to 3D.
   * Returns `false` if there is no drawing data to display.
   *
   * @description
   * Call this method when switching to 3D mode (e.g., on a "3D" button click)
   * to render the 2D viewer layout in the 3D viewer and control the visibility
   * of the 3D viewer container element.
   */
  public async switchTo3D(
    isRoomDetected?: (isDetected: boolean) => void,
  ): Promise<boolean> {
    if (!this.design2D || !this.design3D) return false;

    const data = await this.design2D.get2ddata();
    if (
      data &&
      data.layer &&
      data.layer.children &&
      data.layer.children.length > 0
    ) {
      if (isRoomDetected) {
        if (data.rooms && data.rooms.length > 0) {
          isRoomDetected(true);
        } else {
          isRoomDetected(false);
        }
      }

      this.design3D.loadFromJson(data);
      this.design3D.enter3DView();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if there is any drawing data currently present in the 2D layout.
   *
   * @returns {Promise<boolean>}
   * Returns a `Promise<boolean>` that resolves to `true` if design content
   * is present, and `false` otherwise.
   *
   * @description
   * This method checks if any elements (e.g. walls, layouts) have been drawn
   * in the 2D viewer.
   *
   */
  public async is2DDataPresent(): Promise<boolean> {
    if (!this.design2D) {
      return false;
    }
    const data = await this.design2D.get2ddata();
    return (
      data &&
      data.layer &&
      data.layer.children &&
      data.layer.children.length > 0
    );
  }

  /**
   * Switches the view from the 3D viewer back to the 2D viewer.
   *
   * @returns {void}
   *
   * @description
   * Call this method when switching to 2D mode (e.g., on a "2D" button click)
   * to exit the 3D view.
   */
  public switchTo2D(): void {
    this.design3D?.exit3DView();
  }

  /**
   * Sets the active drawing or interaction mode in the 2D viewer.
   *
   * @param {RoomEditorMode | string} mode
   * The interaction mode to select. Supported modes: "draw", "edit",
   * "door", or "window".
   *
   * @param {boolean} active
   * `true` to enable the mode, `false` to disable/deactivate it.
   *
   * @returns {void}
   *
   * @description
   * This method toggles active drawing states such as drawing walls,
   * inserting doors/windows, or editing existing layout in the 2D viewer.
   */
  public set2DMode(mode: RoomEditorMode | string, active: boolean): void {
    if (!this.design2D) return;

    let targetMode: RoomEditorMode | null = null;
    const normalized = mode.toLowerCase();

    switch (normalized) {
      case "draw":
        targetMode = RoomEditorMode.DRAW;
        break;
      case "window":
        targetMode = RoomEditorMode.WINDOW;
        break;
      case "door":
        targetMode = RoomEditorMode.DOOR;
        break;
      case "edit":
        targetMode = RoomEditorMode.EDIT;
        break;
      default:
        console.warn(`Unknown mode string: ${mode}`);
        return;
    }
    this.design2D.setMode(targetMode, active, true);
  }

  /**
   * Registers a callback function that is triggered whenever the active
   * 2D interaction mode changes.
   *
   * @param {((mode: RoomEditorMode | null) => void) | undefined} callback
   * The callback function invoked with the new `RoomEditorMode`
   * (or `null` if none is active).
   *
   * @description
   * Allows registering a callback function to monitor mode transitions
   * in the 2D viewer. The registered function receives the new mode,
   * or `null` if the viewer exits active modes.
   */
  public set on2DModeChange(
    callback: ((mode: RoomEditorMode | null) => void) | undefined,
  ) {
    if (this.design2D) {
      this.design2D.On2DModeChange = callback;
    }
  }

  /**
   * Enables or disables snapping behavior while drawing in the 2D viewer.
   *
   * @param {boolean} enabled
   * `true` to enable snapping alignment, `false` to disable it.
   *
   * @returns {boolean}
   * Returns a boolean indicating the active snapping state.
   *
   * @description
   * This method enables or disables axis snapping (horizontal and vertical
   * line snapping) while drawing in the 2D viewer.
   */
  public enableSnapping(enabled: boolean): boolean {
    return this.design2D?.activeSnapping(enabled) ?? false;
  }

  /**
   * Enables or disables the visibility of dimension annotations in the 2D viewer.
   *
   * @param {boolean} visible
   * `true` to display dimension annotations, `false` to hide them.
   *
   * @returns {boolean}
   * Returns a boolean indicating the resulting visibility state.
   *
   * @description
   * This method toggles the visibility of wall lengths and other dimension
   * measurements drawn in the 2D viewer.
   */
  public enableDimensions(visible: boolean): boolean {
    return this.design2D?.toggleDimensions(visible) ?? false;
  }

  /**
   * Enables or disables the grid overlay in the 2D viewer.
   *
   * @param {boolean} visible
   * `true` to display the grid overlay, `false` to hide it.
   *
   * @returns {boolean}
   * Returns a boolean indicating the resulting visibility state.
   *
   * @description
   * This method toggles the visibility of helper grid lines in the 2D viewer.
   */
  public enableGrid(visible: boolean): boolean {
    return this.design2D?.enableGrid(visible) ?? false;
  }

  /**
   * Toggles the visibility of the background image in the 2D viewer.
   *
   * @param {boolean} show
   * `true` to make the background image visible, `false` to hide it.
   *
   * @returns {void}
   * @internal
   * @description
   * This method controls the visibility of the background image in the 2D viewer.
   */
  public enableBackgroundImage(show: boolean): void {
    this.design2D?.toggleBackgroundImage(show);
  }

  /**
   * Sets the size of a single grid square in centimeters.
   *
   * @param {number} cmValue
   * The length of one grid square in centimeters.
   *
   * @returns {void}
   *
   * @description
   * This method changes the measurement scale of the 2D viewer. All wall
   * lengths, door sizes and window sizes will automatically update to match
   * the new grid size.
   */
  public set2DUnitScale(cmValue: number): void {
    this.design2D?.setKonvaUnitScale(cmValue);
  }

  /**
   * Sets the unit for displaying wall lengths and dimensions on the 2D canvas.
   *
   * @param {LengthUnit | string} unit
   * The length unit to display ('mm', 'cm', 'inch', 'foot').
   *
   * @returns {void}
   */
  public setLengthUnit(unit: LengthUnit | string): void {
    this.initialUnit = normalizeLengthUnit(unit);
    this.design2D?.setLengthUnit(this.initialUnit);
  }

  /**
   * Gets the current display length unit on the 2D canvas.
   *
   * @returns {LengthUnit}
   */
  public getLengthUnit(): LengthUnit {
    return this.design2D?.getLengthUnit() ?? this.initialUnit;
  }

  /**
   * Alias for setLengthUnit.
   *
   * @param {LengthUnit | string} unit
   */
  public setUnit(unit: LengthUnit | string): void {
    this.setLengthUnit(unit);
  }

  /**
   * Alias for getLengthUnit.
   *
   * @returns {LengthUnit}
   */
  public getUnit(): LengthUnit {
    return this.getLengthUnit();
  }

  /**
   * Highlights all walls that are not currently selected or hovered.
   *
   * @param {boolean} active
   * `true` to highlight walls, `false` to restore default wall colors.
   *
   * @param {string} theme
   * The active theme (`"dark"` or `"light"`). Passing `"dark"` highlights
   * the walls in white, while `"light"` highlights them in black.
   *
   * @returns {void}
   *
   * @description
   * This method changes the color of all walls that are not currently selected
   * or hovered. The color updates automatically based on the selected theme
   * (white for dark theme, black for light theme) to ensure they are visible.
   */
  public highlightWalls(active: boolean, theme: string): void {
    this.design2D?.highlightWalls(active, theme);
  }

  /**
   * Shows or hides all drawn elements in the 2D viewer.
   *
   * @param {boolean} visible
   * `true` to make the drawn layers visible, `false` to hide them.
   *
   * @returns {void}
   *
   * @description
   * This method toggles the visibility of drawn elements (such as walls,
   * rooms, etc,.) in the 2D viewer.
   */
  public setDrawingOverlayVisibility(visible: boolean): void {
    this.design2D?.setDrawingLayersVisibility(visible);
  }

  /**
   * Cleans up and releases all resources used by the floorplan manager.
   *
   * @returns {void}
   *
   * @description
   * This method frees up memory by destroying the 2D viewer, the 3D viewer,
   * and cleaning up all active event listeners. Call this method when the
   * component is removed or destroyed.
   */
  public dispose(): void {
    this.design2D?.dispose();
    this.design3D?.dispose();
    this.design2D = null;
    this.design3D = null;
  }

  /**
   * Returns the underlying 3D engine core instance.
   *
   * @returns {ConfiguratorCore | undefined}
   * The main 3D engine manager instance, or `undefined` if not initialized.
   *
   * @description
   * This method provides direct access to the underlying 3D viewer
   * (ConfiguratorCore). This allows you to perform advanced 3D operations
   * such as modifying lights, controlling the 3D camera, or loading custom
   * 3D models.
   */
  public getConfiguratorCore(): ConfiguratorCore | undefined {
    return this.design3D?.getCore();
  }

  /**
   * Loads and draws a floorplan layout from the provided JSON data.
   *
   * @param {any} jsonData
   * The JSON object containing the floorplan layout data.
   *
   * @returns {void}
   *
   * @description
   * This method loads floorplan layout from the provided JSON data, draws the
   * walls on the 2D viewer, and automatically creates room spaces and dimension
   * annotations.
   */
  public loadLayoutFromJson(jsonData: any): void {
    this.design2D?.drawFromJson(jsonData);
  }

  /**
   * Deletes the currently selected item (such as a wall, window, or door)
   * from the 2D viewer.
   *
   * @returns {void}
   *
   * @description
   * This method removes the selected element from the 2D layout.
   */
  public deleteSelectedEntity(): void {
    this.design2D?.deleteSelectedEntity();
  }

  /**
   * Clears all walls, doors, windows and rooms from the 2D viewer.
   *
   * @returns {void}
   *
   * @description
   * This method resets the 2D viewer by deleting all drawn walls, doors,
   * windows and room spaces.
   */
  public clear2DLayout(): void {
    this.design2D?.clearAll();
  }

  /**
   * Centers and scales the 2D layout to fit the screen.
   *
   * @returns {void}
   *
   * @description
   * This method adjusts the zoom and position of the 2D viewer so that the
   * entire drawn layout fits within the visible viewer.
   */
  public fitToView(): void {
    this.design2D?.fitLayout();
  }

  /**
   * Sets a background image behind the 2D floorplan layout.
   *
   * @param {string} imageUrl
   * The URL of the background image to display.
   *
   * @param {any} layoutJson
   * The JSON object containing the floorplan layout data.
   *
   * @param {boolean} isDarkTheme
   * `true` if the viewer is in dark theme mode, `false` otherwise.
   *
   * @returns {void}
   *
   * @description
   * This method processes the provided image and displays it in the background
   * of the 2D viewer. It crops the image automatically to match the boundaries
   * of the layout data and adjusts the colors of the image for dark/light themes.
   */
  public setFloorPlanBackgroundImage(
    imageUrl: string,
    layoutJson: any,
    isDarkTheme: boolean,
  ): void {
    this.design2D?.setAIBackgroundImage(imageUrl, layoutJson, isDarkTheme);
  }

  /**
   * Removes the background image from the 2D floorplan viewer.
   *
   * @returns {void}
   *
   * @description
   * This method clears the background image loaded into the 2D viewer.
   */
  public clearFloorPlanBackgroundImage(): void {
    this.design2D?.clearAIBackgroundImage();
  }

  /**
   * Downloads the current floorplan layout as a JSON file.
   *
   * @returns {void}
   *
   * @description
   * This method saves your current 2D layout design to a file and downloads
   * it to your computer as `floorplan.json`.
   */
  public exportJson(): any {
    return this.design2D?.exportJson();
  }

  /**
   * Loads a previously saved design back into the 2D viewer.
   *
   * @param {string} json
   * The raw JSON string produced by `exportJson`.
   *
   * @returns {void}
   *
   * @description
   * This method imports a design from a raw JSON string (which was exported
   * using `exportJson`) and restores it on the 2D viewer.
   */
  public importJson(json: any) {
    return this.design2D?.loadKonvaJson(json);
  }

  /**
   * Adds a predefined shape template to the 2D viewer.
   *
   * @param {Predefined2DShapes} shapeType
   * The predefined shape template to add (e.g. `Predefined2DShapes.RECTANGLE`,
   * `Predefined2DShapes.SQUARE`, `Predefined2DShapes.L_SHAPE`, or
   * `Predefined2DShapes.TRIANGLE`).
   *
   * @returns {void}
   *
   * @description
   * This method loads a predefined room shape (such as a square, rectangle,
   * triangle, or L-shape) and adds it onto the 2D viewer.
   */
  public addPredefinedShape(
    shapeType:
      | Predefined2DShapes.L_SHAPE
      | Predefined2DShapes.RECTANGLE
      | Predefined2DShapes.TRIANGLE
      | Predefined2DShapes.SQUARE
  ) {
    this.design2D?.addPredefinedShape(shapeType);
  }
}
