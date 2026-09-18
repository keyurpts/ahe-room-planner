import { RoomEditorMode } from "../Constants";
import type { Room } from "../utils/RoomDetector";
import type { Predefined2DShapes } from "../shapeTemplates";
export interface WallConnection {
    point: "start" | "end";
    connectedLineId: string;
    connectedPoint: "start" | "end";
    intersectionPoint: {
        x: number;
        y: number;
    };
}
export interface WindowData {
    id: string;
    offset: number;
    width: number;
    isInvalid?: boolean;
}
export interface DoorData {
    id: string;
    offset: number;
    width: number;
    isInvalid?: boolean;
}
export interface WallUserData {
    id: string;
    startPoint: {
        x: number;
        y: number;
    };
    endPoint: {
        x: number;
        y: number;
    };
    isConnected: boolean;
    connections: WallConnection[];
    windows: WindowData[];
    doors: DoorData[];
}
/**
 * Design2D class handles the 2D floorplan editor using Konva.js.
 * It manages layers for grid, floorplan elements, and interactions.
 */
export declare class Design2D {
    /**
     *  Konva stage that manages the 2D canvas and coordinate system
     */
    private stage;
    /**
     * Group that holds all grid line elements
     */
    private gridGroup;
    /**
     * Konva.Rect representing the background area of the stage
     */
    private backgroundRect;
    /**
     * DOM container where the Konva canvas is mounted
     */
    private container;
    /**
     * Controls zoom speed.
     */
    private readonly scaleBy;
    /**
     * Observes container size changes to keep canvas responsive
     */
    private resizeObserver;
    /**
     * Resolve background image URL
     */
    private readonly BACKGROUND_IMAGE_PATH;
    /**
     * Holds the floorplan model instance
     */
    private floorplan;
    /**
     * Stores the current interaction mode
     */
    private mode;
    /**
     * Flag indicating if the wall drawing mode was explicitly selected by the user
     */
    private isDrawModeExplicitlyEnabled;
    /**
     * Unit conversion factor (e.g. 30/30 since 30 is the default grid size)
     */
    private unit_conversion_factor;
    /**
     * Stores the last placed point while drawing walls
     */
    private lastPoint;
    /**
     * Tracks whether the mouse moved during an interaction
     */
    private mouseMoved;
    /**
     *Indicates if the user is currently panning the canvas
     */
    private isPanning;
    /**
     * Stores the last pointer position while panning
     */
    private lastPanPointerPosition;
    /**
     * Preview line while drawing
     */
    private previewLine;
    /**
     * Preview dimension while drawing
     */
    private previewDimension;
    /**
     * Visual circle indicator for endpoint snapping
     */
    private snapCircleIndicator;
    /**
     * Preview window while placing
     */
    private previewWindow;
    /**
     * Preview door while placing
     */
    private previewDoor;
    /**
     * Tracks recent click positions to validate double clicks
     */
    private clickHistory;
    /**
     * Callback for mode changes
     */
    On2DModeChange?: (mode: RoomEditorMode | null) => void;
    /**
     * Flag to enable/disable axis snapping (horizontal/vertical)
     */
    private isAxisSnappingEnabled;
    /**
     * Currently selected wall groups in EDIT mode
     */
    private selectedWallGroups;
    /**
   * Currently selected window/door group in EDIT mode
   */
    private selectedOpening;
    /**
   * Currently hovered entity in EDIT mode
   */
    private hoveredEntity;
    /**
     * Tracks the wall and endpoint currently being dragged (in wall edit mode)
     */
    private draggingEndpoint;
    /**
     * Tracks the opening currently being dragged
     */
    private draggingOpening;
    /**
     * Preview group container for rendering layout preview shapes
     */
    private previewGroup;
    /**
     * When non-null, walls in their default (unselected/unhovered) state
     * will use this colour instead of VisualStyle.WALL_STROKE.
     * Set by HighlightWalls().
     */
    private wallHighlightColor;
    private getOpeningCanvasWidth;
    private isEndpointIntersection;
    /**
     * Initializes the 2D designer within the provided container.
     * @param container The HTML element to host the Konva stage.
     */
    constructor(container: HTMLDivElement);
    /**
     * Registers all event listeners.
     */
    private registerEventListeners;
    /**
     * Initializes all layers and adds them to the stage.
     */
    private initLayers;
    /**
     * Retrieves a layer by its name.
     * @param layerName The name of the layer to retrieve.
     * @returns The Konva layer or null if not found or stage is destroyed.
     */
    private getLayer;
    /**
     * Resizes the stage when the container dimensions change.
     */
    private handleResize;
    /**
     * Loads and sets the background image for the stage.
     */
    private setBackgroundImage;
    /**
     * Syncs the background rectangle's position and size with the stage's view.
     * This is called during zoom, pan, and resize to ensure the background covers the visible area.
     */
    private syncBackgroundToStage;
    /**
     * Sets up mouse wheel zoom functionality.
     */
    private handleZoom;
    /**
     * Listener for mouse wheel events to handle zooming.
     */
    private onWheel;
    /**
     * Calculates the world coordinates from the current stage pointer position.
     * @returns The world coordinates {x, y} or null if the pointer is not over the stage.
     */
    private getWorldPointerPosition;
    /**
     * Listener for mousedown events on the stage.
     */
    private handleMouseDown;
    /**
     * Returns the colour a wall should use in its default (unselected, unhovered) state.
     * When a highlight is active this returns the highlight colour;
     * otherwise falls back to the library default (VisualStyle.WALL_STROKE).
     */
    private getDefaultWallStroke;
    /**
     * Applies or removes a highlight colour across all walls in their default state.
     *
     * Walls currently selected (PREVIEW_STROKE) or hovered (HOVER_STROKE) are
     * intentionally skipped so their system colours are not overwritten.
     *
     * @param active - true to enable highlight, false to restore default wall colour
     * @param theme  - "dark" → white highlight, any other value → black highlight
     */
    highlightWalls(active: boolean, theme: string): void;
    /**
     * Shows or hides the layers that render the user's drawing
     * (walls, room fills, room labels, and interactive elements),
     * independent of the background image layer.
     * @param visible Whether the drawing layers should be visible
     */
    setDrawingLayersVisibility(visible: boolean): void;
    /**
     * Listener for mousemove events on the stage.
     */
    private handleMouseMove;
    /**
     * Is point on opening.
     *
     * @param {number} px - Parameter description.
     * @param {number} py - Parameter description.
     * @returns {boolean} Description of return value.
     */
    private isPointOnOpening;
    /**
     * Handles placing a point or creating a wall in DRAW mode.
     */
    private handleDrawMode;
    /**
     * Listener for double click events on the stage to start wall drawing.
     */
    private handleDoubleClick;
    /**
     * Check is the wall Vertical
     */
    private isWallVertical;
    /**
     * Edits the wall dimensions based on the new length.
     * @param wallGroup - The Konva group representing the wall.
     * @param newLength - The new length in physical units.
     * @param wallEditPoint - The edit reference point.
     * @returns True if the edit was successful, false otherwise.
     */
    private editWallDimensions;
    /**
     * Handle window mode.
     *
     * @param {{ x} worldPos - Parameter description.
     * @returns {void}
     */
    private handleWindowMode;
    /**
     * Handle door mode.
     *
     * @param {{ x} worldPos - Parameter description.
     * @returns {void}
     */
    private handleDoorMode;
    /**
     * Handle edit mode.
     *
     * @returns {void}
     */
    private handleEditMode;
    /**
     * Listener for mouseup events on the stage.
     */
    private handleMouseUp;
    /**
     * Handles the movement logic for dragging a wall endpoint.
     * @param x New world X coordinate
     * @param y New world Y coordinate
     */
    private handleEndpointDragging;
    /**
     * Handles dragging an opening (door or window) along its wall.
     * @param x New world X coordinate
     * @param y New world Y coordinate
     */
    private handleOpeningDragging;
    /**
     * Updates the visual preview of a window being placed.
     * @param x World X coordinate of the mouse pointer
     * @param y World Y coordinate of the mouse pointer
     */
    private updateWindowPreview;
    /**
     * Stops the panning interaction and resets state.
     */
    private stopPanning;
    /**
     * Updates the visual preview (line and circle) while drawing a new wall.
     * @param x Target world X coordinate
     * @param y Target world Y coordinate
     */
    private updateTarget;
    /**
     * Checks if the current cursor position is close to any existing wall endpoint.
     * If so, returns the snapped coordinates and the wall group.
     * @param x Cursor X
     * @param y Cursor Y
     */
    private getEndpointSnap;
    /**
     * Checks if the current cursor position is close to any existing wall segment.
     * If so, returns the snapped coordinates on the segment and the wall group.
     * @param x Cursor X
     * @param y Cursor Y
     */
    private getSegmentSnap;
    /**
     * Shows a visual circle indicator at the snapped position within the wall's group.
     * @param x Snapped X
     * @param y Snapped Y
     * @param parentGroup The existing wall group to attach the indicator to
     */
    private showSnapIndicator;
    /**
     * Removes current snap indicator if it exists.
     */
    private hideSnapIndicator;
    /**
     * Snaps a world coordinate to the nearest grid intersection if within radius.
     * @param x World X coordinate
     * @param y World Y coordinate
     * @returns Snapped world coordinates {x, y}
     */
    private getIntersectionSnappedPosition;
    /**
     * Snaps the end coordinates to the grid size along the primary horizontal or vertical axis from a start point.
     * Does not snap if background image is visible or grid is disabled.
     *
     * @param startX - The X coordinate of the starting point.
     * @param startY - The Y coordinate of the starting point.
     * @param endX - The current X coordinate of the end point.
     * @param endY - The current Y coordinate of the end point.
     * @returns The snapped X and Y coordinates.
     */
    private getAxisGridSnap;
    /**
     * Applies axis snapping to a point based on displacement from the start point.
     * Compares the absolute difference in X and Y coordinates:
     * - If Y displacement >= X displacement: snap to Y axis (vertical line)
     * - If X displacement > Y displacement: snap to X axis (horizontal line)
     *
     * @param startX Starting X coordinate
     * @param startY Starting Y coordinate
     * @param endX Ending X coordinate
     * @param endY Ending Y coordinate
     * @returns Snapped end coordinates {x, y}
     */
    private applyAxisSnapping;
    /**
     * Applies axis snapping first, then allows the axis-constrained point to snap to the grid.
     */
    private applyAxisAndGridSnapping;
    /**
     * Snaps the end coordinates to nearby wall endpoints along the active axis.
     *
     * @param startX - The X coordinate of the starting point.
     * @param startY - The Y coordinate of the starting point.
     * @param endX - The current X coordinate of the end point.
     * @param endY - The current Y coordinate of the end point.
     * @param ignoredGroup - Optional wall group to ignore during endpoint snap matching.
     * @returns Snapping result including coordinates, snap status, and matching parent group.
     */
    private getAxisEndpointSnap;
    /**
     * Snaps the end coordinates to nearby wall segments along the active axis.
     *
     * @param startX - The X coordinate of the starting point.
     * @param startY - The Y coordinate of the starting point.
     * @param endX - The current X coordinate of the end point.
     * @param endY - The current Y coordinate of the end point.
     * @param ignoredGroup - Optional wall group to ignore during segment snap matching.
     * @returns Snapping result including coordinates, snap status, and matching parent group.
     */
    private getAxisSegmentSnap;
    /**
     * Creates a new preview line for the drawing mode.
     * @returns A new Konva.Line instance
     */
    private createPreviewLine;
    /**
     * Creates a 2D dimension annotation for a wall segment.
     *
     * @param x1 - X coordinate of the wall start point
     * @param y1 - Y coordinate of the wall start point
     * @param x2 - X coordinate of the wall end point
     * @param y2 - Y coordinate of the wall end point
     * @param color - Color used for the dimension line, arrows, and text
     *
     * @returns A Konva.Group containing the dimension or null if the wall is too short.
     */
    private createDimension;
    /**
     * Calculates geometric data required to render a wall dimension.
     *
     * @param x1 - X coordinate of the wall start point
     * @param y1 - Y coordinate of the wall start point
     * @param x2 - X coordinate of the wall end point
     * @param y2 - Y coordinate of the wall end point
     * @param offset - Perpendicular distance between the wall and the dimension line
     * @param textPadding - Extra spacing reserved around the dimension text
     *
     * @returns An object containing direction, length, offset line points,
     *          text midpoint and rotation angle, or null if the wall is too short.
     */
    private calculateDimensionData;
    /**
     * Switches the interaction mode and cleans up temporary drawing helpers.
     * Also triggers the 'On2DModeChange' callback whenever the mode is activated
     * or deactivated, allowing consumers to react to mode updates.
     * @param mode The RoomEditorMode to set or toggle
     * @param active Whether to activate or deactivate the mode
     */
    setMode(mode: RoomEditorMode, active: boolean, isExplicit?: boolean): void;
    /**
     * Selects a wall and highlights it.
     * @param wallGroup The wall group to select
     */
    private selectWall;
    /**
     * Deselects all the currently selected walls.
     */
    private deselectWall;
    /**
     * Sets the unit converison factor
     * @param cmValue The number of centimeters represented by one grid.
     */
    setKonvaUnitScale(cmValue: number): void;
    /**
     * Repositions doors and windows on a wall such that the ratio of the distance of the door/window center
     * from the wall start to the wall end is maintained.
     */
    private repositionOpeningsOnWall;
    /**
     * Overrides and validates positions of doors/windows on a wall:
     * 1. Sort openings from start to end by current offset.
     * 2. Ensure the first opening doesn't go beyond wall start.
     * 3. Reposition subsequent openings just after the previous to avoid overlaps.
     * 4. Delete any opening that goes beyond the wall endpoint.
     */
    private resolveAndValidateOpeningsOnWall;
    /**
     * Refreshes all existing dimension labels on the floorplan.
     */
    private refreshDimensions;
    /**
     * Restores visibility for all wall dimensions in the floorplan layer.
     */
    private restoreWallDimensions;
    /**
     * Re-renders all existing windows from their wall userData.
     */
    private refreshWindows;
    /**
     * Re-renders all existing doors from their wall userData.
     */
    private refreshDoors;
    /**
     * Renders the entire floorplan to the stage.
     */
    draw(): void;
    /**
     * Toggles the visibility of the background floorplan image.
     * @param show Whether to show the background image
     */
    toggleBackgroundImage(show: boolean): void;
    /**
     * Creates a large grid for visual reference.
     */
    createGrid(): void;
    /**
     * Enables or disables the grid visibility.
     * @param visible Whether the grid should be visible
     * @returns The current state of grid visibility
     */
    enableGrid(visible: boolean): boolean;
    /**
     * Enables or disables axis snapping (horizontal/vertical line snapping).
     * @param enabled Whether axis snapping should be enabled
     * @returns The current state of axis snapping
     */
    activeSnapping(enabled: boolean): boolean;
    /**
     * Toggles the visibility of wall dimensions.
     * @param visible Whether dimensions should be visible
     * @returns The new visibility state of the dimensions.
     */
    toggleDimensions(visible: boolean): boolean;
    /**
     * Cleans up resources when the component is destroyed.
     */
    dispose(): void;
    /**
     * Detects internal rooms from the current layout.
     * @param wallData - Optional array of structured wall data. If not provided, it scans the floorplan layer.
     * @returns A promise resolving to the list of detected rooms.
     */
    private detectRooms;
    /**
     * Detects the outer boundary of the complete house.
     * @param wallData - Optional array of structured wall data.
     * @returns The house boundary room or null.
     */
    getHouseBoundary(wallData?: WallUserData[]): Promise<Room | null>;
    /**
     * Exports the 2D floorplan layout, detected rooms, house boundaries, and unit scale.
     * @returns A promise resolving to the floorplan data.
     */
    get2ddata(): Promise<{
        layer: any;
        rooms: any[];
        houseBoundary: Room | null;
        unit_conversion_factor: number;
    }>;
    /**
     * Renders windows for a specific wall group.
     * @param wallGroup The wall's Konva group
     * @param userData The wall's user data containing windows
     */
    private renderWindows;
    /**
     * Finds a wall group under the specified world coordinates.
     * @param x World X coordinate of the mouse pointer
     * @param y World Y coordinate of the mouse pointer
     * @returns The wall group and line if found, or null
     */
    private getWallUnderPointer;
    /**
     * Updates the visual preview of a door being placed.
     * @param x World X coordinate of the mouse pointer
     * @param y World Y coordinate of the mouse pointer
     */
    private updateDoorPreview;
    /**
     * Renders doors for a specific wall group.
     * @param wallGroup The wall's Konva group
     * @param userData The wall's user data containing doors
     */
    private renderDoors;
    /**
     * Checks if a potential wall segment (x1, y1)-(x2, y2) overlaps an existing wall.
     * Only detects collinear overlaps.
     */
    private isWallOverlapping;
    /**
     * Checks if a wall segment passes through any existing
     * door or window opening in the floor plan.
     *
     * @param x1 Start X of the wall segment.
     * @param y1 Start Y of the wall segment.
     * @param x2 End X of the wall segment.
     * @param y2 End Y of the wall segment.
     * @param ignoredGroup Wall group to ignore during the check.
     * @returns True if the wall intersects a door or window.
     */
    private isWallThroughOpening;
    /**
    * Checks if a wall segment intersects a door.
    *
    * @param x1 Start X of the wall segment.
    * @param y1 Start Y of the wall segment.
    * @param x2 End X of the wall segment.
    * @param y2 End Y of the wall segment.
    * @param wall Wall containing the door.
    * @param door Door to check against.
    * @returns True if the wall intersects the door.
    */
    private isWallThroughDoor;
    /**
     * Checks if a wall segment intersects a window.
     *
     * @param x1 Start X of the wall segment.
     * @param y1 Start Y of the wall segment.
     * @param x2 End X of the wall segment.
     * @param y2 End Y of the wall segment.
     * @param wall Wall containing the window.
     * @param window Window to check against.
     * @returns True if the wall intersects the window.
     */
    private isWallThroughWindow;
    /**
     * Checks if a line segment (x1,y1)-(x2,y2) intersects an Oriented Bounding Box (OBB).
     * The OBB is centred at (cx, cy) with local X-axis (ux, uy) and local Y-axis (-uy, ux).
     * width and height are the FULL extents (not half).
     */
    private isLineIntersectingOBB;
    /**
     * Calculates the mathematical intersection point between two line segments.
     */
    private getLineSegmentIntersection;
    /**
     * Checks if a new placement (window or door) overlaps with any existing items on a wall.
     * @param userData The wall's user data
     * @param newOffset The offset along the wall line for the new item
     * @param newWidth The width of the new item
     * @param excludeId Optional ID of the item to ignore when checking overlap
     * @returns boolean true if overlapping, false otherwise
     */
    private isItemOverlapping;
    /**
     * Draws the layout based on the provided JSON data.
     * @param jsonData The JSON object containing detections with drawing points for walls.
     */
    drawFromJson(jsonData: any): void;
    /**
     * Automatically scales and centers the drawing to fit the canvas view.
     */
    fitLayout(): void;
    /**
   * Deletes the currently selected entity.
   * Supports selected walls, window, and door.
   */
    deleteSelectedEntity(): void;
    /**
     * Clears all 2D drawings from the canvas.
     */
    clearAll(): void;
    /**
     * Get opening under pointer.
     *
     * @returns {} Description of return value.
     */
    private getOpeningUnderPointer;
    /**
     * Select opening.
     *
     * @param {Konva.Group} openingGroup - Parameter description.
     * @param {"window" | "door"} type - Parameter description.
     * @returns {void}
     */
    private selectOpening;
    /**
     * Deselect opening.
     *
     * @returns {void}
     */
    private deselectOpening;
    /**
     * update hover highlight.
     *
     * @returns {void}
     */
    private updateHoverHighlight;
    /**
     * Sets the specified entity as hovered and updates its style.
     *
     * @param entity - The hovered entity object (wall, window, or door).
     */
    private setHoveredEntity;
    /**
     * Clear hovered entity.
     *
     * @returns {void}
     */
    private clearHoveredEntity;
    /**
     * Checks if the given entity is currently selected.
     *
     * @param type - The type of the entity ("wall" | "window" | "door").
     * @param group - The Konva.Group associated with the entity.
     * @returns `true` if the entity is selected, `false` otherwise.
     */
    private isEntitySelected;
    /**
     * Applies styling properties to a wall or opening based on its current interaction state.
     *
     * @param type - The entity type ("wall" | "window" | "door").
     * @param group - The Konva.Group representing the entity.
     * @param state - The visual state to apply ("normal" | "hover" | "selected").
     */
    private applyEntityStyle;
    /**
     * Retrieves the parent wall group containing the specified window or door opening.
     *
     * @param openingGroup - The Konva.Group of the window or door.
     * @param type - The opening type ("window" | "door").
     * @returns The parent wall Konva.Group, or null if not found.
     */
    private getWallGroupForOpening;
    /**
     * Creates/recalculates the start-to-center and center-to-end dimension lines
     * for an opening, stored as permanent children of the opening's own group.
     * Visibility is tied to whether this opening is currently selected.
     */
    private renderOpeningDimensions;
    /**
     * Sets the AI background image for the floorplan.
     * Processes the image using an offscreen canvas, applies cropping based on layout detection,
     * and dynamically updates pixels to support both light and dark themes.
     */
    setAIBackgroundImage(imageUrl: string, layoutJson: any, isDarkTheme: boolean): void;
    /**
     * Clears the AI background image from the floorplan.
     */
    clearAIBackgroundImage(): void;
    /**
     * Refresh preview window.
     *
     * @returns {void}
     */
    private refreshPreviewWindow;
    /**
     * Refresh preview door.
     *
     * @returns {void}
     */
    private refreshPreviewDoor;
    /**
     * Calculates the snapped coordinates based on axis restrictions and segment snapping.
     *
     * @param startX - The X coordinate of the starting point.
     * @param startY - The Y coordinate of the starting point.
     * @param endX - The current X coordinate of the end point.
     * @param endY - The current Y coordinate of the end point.
     * @returns SnapResult containing snapped coordinates and information about the snapped segment/endpoint.
     */
    private getAxisSnappedPosition;
    /**
     * Exports the current Konva stage as a JSON file download.
     */
    exportJson(): any;
    /**
     * Loads a previously exported Konva stage JSON, replaces
     * all layers on the current stage, and re-binds internal
     * references that were destroyed during the process.
     *
     * @param json - Raw JSON string produced by `exportJson`
     */
    loadKonvaJson(json: any): void;
    /**
     * Adds a predefined shape layout to the canvas as a draggable preview group.
     *
     * @param shapeType - The predefined shape JSON string (representing L-Shape, Rectangle, Triangle, or Square).
     */
    addPredefinedShape(shapeType: Predefined2DShapes.L_SHAPE | Predefined2DShapes.RECTANGLE | Predefined2DShapes.TRIANGLE | Predefined2DShapes.SQUARE): void;
    /**
     * Place preview.
     *
     * @returns {void}
     */
    private placePreview;
}
