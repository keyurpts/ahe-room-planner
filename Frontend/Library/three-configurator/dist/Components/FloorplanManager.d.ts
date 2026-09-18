import type { ConfiguratorCore } from "../ConfiguratorCore";
import { RoomEditorMode } from "../Constants";
import { Predefined2DShapes } from "../shapeTemplates";
/**
 * Manages coordination between the 2D editor and the 3D viewer.
 * Handles initialization, view switching and data synchronization.
 */
export declare class FloorplanManager {
    private design2D;
    private design3D;
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
    init(container2D: HTMLDivElement, container3D: HTMLDivElement): void;
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
    switchTo3D(isRoomDetected?: (isDetected: boolean) => void): Promise<boolean>;
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
    is2DDataPresent(): Promise<boolean>;
    /**
     * Switches the view from the 3D viewer back to the 2D viewer.
     *
     * @returns {void}
     *
     * @description
     * Call this method when switching to 2D mode (e.g., on a "2D" button click)
     * to exit the 3D view.
     */
    switchTo2D(): void;
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
    set2DMode(mode: RoomEditorMode | string, active: boolean): void;
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
    set on2DModeChange(callback: ((mode: RoomEditorMode | null) => void) | undefined);
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
    enableSnapping(enabled: boolean): boolean;
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
    enableDimensions(visible: boolean): boolean;
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
    enableGrid(visible: boolean): boolean;
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
    enableBackgroundImage(show: boolean): void;
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
    set2DUnitScale(cmValue: number): void;
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
    highlightWalls(active: boolean, theme: string): void;
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
    setDrawingOverlayVisibility(visible: boolean): void;
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
    dispose(): void;
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
    getConfiguratorCore(): ConfiguratorCore | undefined;
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
    loadLayoutFromJson(jsonData: any): void;
    /**
     * Deletes the currently selected item (such as a wall, window, or door)
     * from the 2D viewer.
     *
     * @returns {void}
     *
     * @description
     * This method removes the selected element from the 2D layout.
     */
    deleteSelectedEntity(): void;
    /**
     * Clears all walls, doors, windows and rooms from the 2D viewer.
     *
     * @returns {void}
     *
     * @description
     * This method resets the 2D viewer by deleting all drawn walls, doors,
     * windows and room spaces.
     */
    clear2DLayout(): void;
    /**
     * Centers and scales the 2D layout to fit the screen.
     *
     * @returns {void}
     *
     * @description
     * This method adjusts the zoom and position of the 2D viewer so that the
     * entire drawn layout fits within the visible viewer.
     */
    fitToView(): void;
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
    setFloorPlanBackgroundImage(imageUrl: string, layoutJson: any, isDarkTheme: boolean): void;
    /**
     * Removes the background image from the 2D floorplan viewer.
     *
     * @returns {void}
     *
     * @description
     * This method clears the background image loaded into the 2D viewer.
     */
    clearFloorPlanBackgroundImage(): void;
    /**
     * Downloads the current floorplan layout as a JSON file.
     *
     * @returns {void}
     *
     * @description
     * This method saves your current 2D layout design to a file and downloads
     * it to your computer as `floorplan.json`.
     */
    exportJson(): any;
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
    importJson(json: any): void | undefined;
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
    addPredefinedShape(shapeType: Predefined2DShapes.L_SHAPE | Predefined2DShapes.RECTANGLE | Predefined2DShapes.TRIANGLE | Predefined2DShapes.SQUARE): void;
}
