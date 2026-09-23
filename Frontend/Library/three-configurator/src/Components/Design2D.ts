import Konva from "konva";
import { v4 as uuidv4 } from 'uuid';
import { Floorplan } from "../Model/Floorplan";
import { NodeName, VisualStyle, Config, RoomEditorMode } from "../Constants";
import { RoomDetector } from "../utils/RoomDetector";
import type { Room } from "../utils/RoomDetector";
import type { Predefined2DShapes } from "../shapeTemplates";
import { Events, ConfiguratorEventType } from "../event";

/**
 * Enum for the different interaction modes in the 2D designer.
 */
type SnapResult = {
  x: number;
  y: number;
  snapped: boolean;
  parentGroup: Konva.Group | null;
};

export interface WallConnection {
  point: "start" | "end";
  connectedLineId: string;
  connectedPoint: "start" | "end";
  intersectionPoint: { x: number; y: number };
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
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  isConnected: boolean;
  connections: WallConnection[];
  windows: WindowData[];
  doors: DoorData[];
}

/**
 * Design2D class handles the 2D floorplan editor using Konva.js.
 * It manages layers for grid, floorplan elements, and interactions.
 */
export class Design2D {
  /**
   *  Konva stage that manages the 2D canvas and coordinate system
   */
  private stage: Konva.Stage;

  /**
   * Group that holds all grid line elements
   */
  private gridGroup!: Konva.Group;

  /**
   * Konva.Rect representing the background area of the stage
   */
  private backgroundRect!: Konva.Rect;

  /**
   * DOM container where the Konva canvas is mounted
   */
  private container: HTMLDivElement;

  /**
   * Controls zoom speed.
   */
  private readonly scaleBy = Config.SCALE_FACTOR as number;

  /**
   * Observes container size changes to keep canvas responsive
   */
  private resizeObserver: ResizeObserver;

  /**
   * Resolve background image URL
   */
  private readonly BACKGROUND_IMAGE_PATH = new URL(
    Config.BACKGROUND_IMAGE_PATH,
    import.meta.url,
  ).href;

  /**
   * Holds the floorplan model instance
   */
  private floorplan: Floorplan;

  /**
   * Stores the current interaction mode
   */
  private mode: RoomEditorMode | null = null;

  /**
   * Flag indicating if the wall drawing mode was explicitly selected by the user
   */
  private isDrawModeExplicitlyEnabled: boolean = false;

  /**
   * Unit conversion factor (e.g. 30/30 since 30 is the default grid size)
   */
  private unit_conversion_factor: number = 1;

  /**
   * Stores the last placed point while drawing walls
   */
  private lastPoint: { x: number; y: number } | null = null;

  /**
   * Tracks whether the mouse moved during an interaction
   */
  private mouseMoved = false;

  /**
   *Indicates if the user is currently panning the canvas
   */
  private isPanning = false;

  /**
   * Stores the last pointer position while panning
   */
  private lastPanPointerPosition: { x: number; y: number } | null = null;

  /**
   * Preview line while drawing
   */
  private previewLine: Konva.Line | null = null;

  /**
   * Preview dimension while drawing
   */
  private previewDimension: Konva.Group | null = null;

  /**
   * Visual circle indicator for endpoint snapping
   */
  private snapCircleIndicator: Konva.Group | null = null;

  /**
   * Preview window while placing
   */
  private previewWindow: Konva.Group | null = null;

  /**
   * Preview door while placing
   */
  private previewDoor: Konva.Group | null = null;

  /**
   * Tracks recent click positions to validate double clicks
   */
  private clickHistory: { x: number; y: number; time: number }[] = [];

  /**
   * Callback for mode changes
   */
  public On2DModeChange?: (mode: RoomEditorMode | null) => void;

  /**
   * Flag to enable/disable axis snapping (horizontal/vertical)
   */
  private isAxisSnappingEnabled: boolean = true;

  /**
   * Currently selected wall groups in EDIT mode
   */
  private selectedWallGroups: Konva.Group[] = [];

  /**
 * Currently selected window/door group in EDIT mode
 */
  private selectedOpening:
    | { type: "window" | "door"; group: Konva.Group }
    | null = null;

  /**
 * Currently hovered entity in EDIT mode
 */
  private hoveredEntity:
    | { type: "wall"; group: Konva.Group }
    | { type: "window"; group: Konva.Group }
    | { type: "door"; group: Konva.Group }
    | null = null;

  /**
   * Tracks the wall and endpoint currently being dragged (in wall edit mode)
   */
  private draggingEndpoint: {
    wallGroup: Konva.Group;
    point: "start" | "end";
    originalPoints: number[];
    isInvalid?: boolean;
    originalWindows?: WindowData[];
    originalDoors?: DoorData[];
  } | null = null;

  /**
   * Tracks the opening currently being dragged
   */
  private draggingOpening: {
    group: Konva.Group;
    type: "window" | "door";
    wallGroup: Konva.Group;
    entityId: string;
    initialOffset: number;
  } | null = null;

  /**
   * Preview group container for rendering layout preview shapes
   */
  private previewGroup: Konva.Group | null = null;

  /**
   * When non-null, walls in their default (unselected/unhovered) state
   * will use this colour instead of VisualStyle.WALL_STROKE.
   * Set by HighlightWalls().
   */
  private wallHighlightColor: string | null = null;

  private getOpeningCanvasWidth(width: number): number {
    return width / this.unit_conversion_factor;
  }

  private isEndpointIntersection(t1: number, t2: number): boolean {
    const tolerance = 1e-4;
    const isEndpoint = (t: number) => t <= tolerance || t >= 1 - tolerance;
    return isEndpoint(t1) && isEndpoint(t2);
  }

  /**
   * Initializes the 2D designer within the provided container.
   * @param container The HTML element to host the Konva stage.
   */
  constructor(container: HTMLDivElement) {
    this.container = container;

    // Initialize the main stage
    this.stage = new Konva.Stage({
      container: container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
    });

    // Initialize all layers
    this.initLayers();

    // Link the floorplan model to this layer
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) {
      throw new Error("FLOORPLAN_LAYER not found during initialization");
    }
    this.floorplan = new Floorplan(floorplanLayer);

    this.createGrid();
    this.handleZoom();

    this.registerEventListeners();

    // Observe container resize to keep the stage responsive
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(container);
  }

  /**
   * Registers all event listeners.
   */
  private registerEventListeners(): void {
    this.stage.on("mousedown", this.handleMouseDown);
    this.stage.on("mousemove", this.handleMouseMove);
    this.stage.on("mouseup", this.handleMouseUp);
    this.stage.on("dblclick", this.handleDoubleClick);

    this.stage
      .container()
      .addEventListener("contextmenu", (e) => e.preventDefault());

    // Global event listener for releasing mouse outside canvas
    window.addEventListener("mouseup", this.stopPanning);
  }

  /**
   * Initializes all layers and adds them to the stage.
   */
  private initLayers(): void {
    const backgroundLayer = new Konva.Layer({
      name: NodeName.BACKGROUND_LAYER,
    });
    this.stage.add(backgroundLayer);

    this.backgroundRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      listening: false,
      visible: false,
    });
    backgroundLayer.add(this.backgroundRect);

    // Grid Layer
    const gridLayer = new Konva.Layer({ name: NodeName.GRID_LAYER });
    this.stage.add(gridLayer);

    this.gridGroup = new Konva.Group({ name: NodeName.GRID_GROUP });
    gridLayer.add(this.gridGroup);

    // Room Fill Layer 
    this.stage.add(new Konva.Layer({ name: NodeName.ROOM_FILL_LAYER }));

    // Floorplan Layer
    const floorplanLayer = new Konva.Layer({ name: NodeName.FLOORPLAN_LAYER });
    this.stage.add(floorplanLayer);

    // Interaction Layer
    const interactionLayer = new Konva.Layer({
      name: NodeName.INTERACTION_LAYER,
    });
    this.stage.add(interactionLayer);

    // previewWindow group contains a previewRectangle in it
    this.previewWindow = new Konva.Group({
      name: NodeName.WINDOW_GROUP,
      visible: false,
    });
    const windowWidth = Config.DEFAULT_WINDOW_WIDTH as number;
    const wallStrokeWidth = VisualStyle.WALL_STROKE_WIDTH as number;
    this.previewWindow.add(
      new Konva.Rect({
        x: -(windowWidth / this.unit_conversion_factor) / 2,
        y: -wallStrokeWidth / 2,
        width: (windowWidth / this.unit_conversion_factor),
        height: wallStrokeWidth,
        fill: VisualStyle.WINDOW_FILL as string,
        stroke: VisualStyle.WINDOW_STROKE as string,
        strokeWidth: VisualStyle.WINDOW_STROKE_WIDTH as number,
        opacity: 0.5,
        name: NodeName.WINDOW,
      }),
    );
    interactionLayer.add(this.previewWindow);

    this.previewDoor = new Konva.Group({
      name: NodeName.DOOR_GROUP,
      visible: false,
    });
    const doorWidth = Config.DEFAULT_DOOR_WIDTH as number;
    // Bounding Box for the Door 
    this.previewDoor.add(
      new Konva.Rect({
        x: -(doorWidth / this.unit_conversion_factor) / 2,
        y: -(doorWidth / this.unit_conversion_factor),
        width: doorWidth / this.unit_conversion_factor,
        height: (doorWidth / this.unit_conversion_factor),
        fill: 'transparent',
        name: NodeName.DOOR_BBOX,
        listening: true
      })
    );
    // Background Rect (to "cut" the wall)
    this.previewDoor.add(
      new Konva.Rect({
        x: -(doorWidth / this.unit_conversion_factor) / 2,
        y: -wallStrokeWidth / 2,
        width: (doorWidth / this.unit_conversion_factor),
        height: wallStrokeWidth,
        fill: VisualStyle.DOOR_FILL as string,
        opacity: 0.5,
        name: NodeName.DOOR
      })
    );
    // Door Leaf (The vertical line when open)
    this.previewDoor.add(
      new Konva.Line({
        points: [-(doorWidth / this.unit_conversion_factor) / 2, 0, -(doorWidth / this.unit_conversion_factor) / 2 + (doorWidth / this.unit_conversion_factor) * Math.cos(Math.PI / 4), -(doorWidth / this.unit_conversion_factor) * Math.sin(Math.PI / 4)],
        stroke: VisualStyle.DOOR_STROKE as string,
        strokeWidth: VisualStyle.DOOR_STROKE_WIDTH as number,
        name: NodeName.DOOR_LEAF
      })
    );
    // Swing Arc
    this.previewDoor.add(
      new Konva.Arc({
        x: -(doorWidth / this.unit_conversion_factor) / 2,
        y: 0,
        innerRadius: (doorWidth / this.unit_conversion_factor),
        outerRadius: (doorWidth / this.unit_conversion_factor),
        angle: 45,
        rotation: -45,
        stroke: VisualStyle.DOOR_STROKE as string,
        strokeWidth: 1,
        dash: [5, 5],
        name: NodeName.DOOR_SWING
      })
    );

    interactionLayer.add(this.previewDoor);

    // Room Label Layer
    const roomLabelLayer = new Konva.Layer({
      name: NodeName.ROOM_LABEL_LAYER,
    });
    this.stage.add(roomLabelLayer);
  }

  /**
   * Retrieves a layer by its name.
   * @param layerName The name of the layer to retrieve.
   * @returns The Konva layer or null if not found or stage is destroyed.
   */
  private getLayer(layerName: string): Konva.Layer | null {
    if (!this.stage) return null;
    try {
      const node = this.stage.findOne(`.${layerName}`);
      return node as Konva.Layer;
    } catch (e) {
      return null;
    }
  }

  /**
   * Resizes the stage when the container dimensions change.
   */
  private handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (this.stage.width() !== width || this.stage.height() !== height) {
      this.stage.width(width);
      this.stage.height(height);
      this.createGrid();
    }
    this.syncBackgroundToStage();
  }

  /**
   * Loads and sets the background image for the stage.
   */
  private setBackgroundImage(): void {
    const img = new Image();
    img.src = this.BACKGROUND_IMAGE_PATH;

    img.onload = () => {
      this.backgroundRect.fillPatternImage(img);
      this.backgroundRect.fillPatternRepeat("repeat");
      this.getLayer(NodeName.BACKGROUND_LAYER)?.batchDraw();
    };
  }

  /**
   * Syncs the background rectangle's position and size with the stage's view.
   * This is called during zoom, pan, and resize to ensure the background covers the visible area.
   */
  private syncBackgroundToStage(): void {
    const scale = this.stage.scaleX();
    // Calculate the top-left corner of the visible area in world coordinates
    const startX = -this.stage.x() / scale;
    const startY = -this.stage.y() / scale;
    // Calculate the width and height of the visible area in world coordinates
    const width = this.stage.width() / scale;
    const height = this.stage.height() / scale;

    this.backgroundRect.position({ x: startX, y: startY });
    this.backgroundRect.size({ width: width, height: height });
    // Offset the pattern so it stays fixed relative to the world coordinates
    this.backgroundRect.fillPatternOffset({ x: startX, y: startY });
  }

  /**
   * Sets up mouse wheel zoom functionality.
   */
  private handleZoom(): void {
    this.stage.on("wheel", this.onWheel);
  }

  /**
   * Listener for mouse wheel events to handle zooming.
   */
  private onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const oldScale = this.stage.scaleX();
    const worldPos = this.getWorldPointerPosition();
    if (!worldPos) return;

    let direction = e.evt.deltaY > 0 ? -1 : 1;
    if (e.evt.ctrlKey) direction = -direction;

    const newScale =
      direction > 0 ? oldScale * this.scaleBy : oldScale / this.scaleBy;
    this.stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: this.stage.getPointerPosition()!.x - worldPos.x * newScale,
      y: this.stage.getPointerPosition()!.y - worldPos.y * newScale,
    };

    this.stage.position(newPos);

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (floorplanLayer) {
      floorplanLayer.find(`.${NodeName.WALL}`).forEach((wall) => {
        wall.setAttr("hitStrokeWidth", 20 / newScale);
      });
    }

    this.syncBackgroundToStage();
    this.stage.batchDraw();
  };

  /**
   * Calculates the world coordinates from the current stage pointer position.
   * @returns The world coordinates {x, y} or null if the pointer is not over the stage.
   */
  private getWorldPointerPosition(): { x: number; y: number } | null {
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return null;

    const scale = this.stage.scaleX();
    return {
      x: (pointer.x - this.stage.x()) / scale,
      y: (pointer.y - this.stage.y()) / scale,
    };
  }

  /**
   * Listener for mousedown events on the stage.
   */
  private handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 2) {
      // disable all active modes on right click
      if (this.mode !== null) {
        this.setMode(this.mode, false);
      }
      // Pan Logic on right click
      this.isPanning = true;
      this.lastPanPointerPosition = this.stage.getPointerPosition();

      // discard predefined shape placement on right click
      if (this.previewGroup) {
        this.previewGroup.destroy();
        this.previewGroup = null;

        this.stage.off(".preview");
        const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
        if (floorplanLayer) {
          floorplanLayer.draw();
        }
        this.detectRooms();
      }
    } else if (e.evt.button === 0) {
      // Interaction Logic on left click
      this.mouseMoved = false;


      if (this.mode === RoomEditorMode.WINDOW || this.mode === RoomEditorMode.DOOR) {
        return;
      }

      const worldPos = this.getWorldPointerPosition();
      if (!worldPos) return;

      const isActivelyDrawing = this.mode === RoomEditorMode.DRAW && this.lastPoint !== null;

      // Check if clicking near an endpoint of the selected wall
      if (this.mode === RoomEditorMode.EDIT && this.selectedWallGroups.length === 1) { //dragging a wall's endpoint is only permitted when exactly one wall is selected
        const selectedGroup = this.selectedWallGroups[0];
        const wallLine = selectedGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
        if (wallLine) {
          const points = wallLine.points();
          const snapRadius = Config.SNAP_RADIUS as number;
          const userData = selectedGroup.getAttr("userData") as WallUserData;
          if (Math.hypot(worldPos.x - points[0], worldPos.y - points[1]) < snapRadius) {
            this.draggingEndpoint = {
              wallGroup: selectedGroup,
              point: "start",
              originalPoints: [...points],
              originalWindows: userData?.windows ? userData.windows.map(w => ({ ...w })) : [],
              originalDoors: userData?.doors ? userData.doors.map(d => ({ ...d })) : []
            };
            this.showSnapIndicator(points[0], points[1], selectedGroup);
            return;
          } else if (Math.hypot(worldPos.x - points[2], worldPos.y - points[3]) < snapRadius) {
            this.draggingEndpoint = {
              wallGroup: selectedGroup,
              point: "end",
              originalPoints: [...points],
              originalWindows: userData?.windows ? userData.windows.map(w => ({ ...w })) : [],
              originalDoors: userData?.doors ? userData.doors.map(d => ({ ...d })) : []
            };
            this.showSnapIndicator(points[2], points[3], selectedGroup);
            return;
          }
        }
      }

      // If we are actively drawing a wall, just let it place the point
      if (isActivelyDrawing) {
        return;
      }

      // Try to select a door/window first because they sit on top of walls
      const openingInfo = this.getOpeningUnderPointer();
      if (openingInfo && this.mode !== RoomEditorMode.DRAW) {
        if (this.mode !== RoomEditorMode.EDIT) {
          this.setMode(RoomEditorMode.EDIT, true);
        }
        this.selectOpening(openingInfo.openingGroup, openingInfo.type);

        const entityId = openingInfo.openingGroup.getAttr("entityId") as string;
        const wallUserData = openingInfo.wallGroup.getAttr("userData") as WallUserData;
        let initialOffset = 0;
        if (wallUserData) {
          const items = openingInfo.type === "window" ? wallUserData.windows : wallUserData.doors;
          const item = items?.find(i => i.id === entityId);
          if (item) initialOffset = item.offset;
        }

        this.draggingOpening = {
          group: openingInfo.openingGroup,
          type: openingInfo.type,
          wallGroup: openingInfo.wallGroup,
          entityId,
          initialOffset
        };

        return;
      }

      // If not clicking a door/window, try to select a wall
      const wallInfo = this.getWallUnderPointer();
      if (wallInfo && this.mode !== RoomEditorMode.DRAW) {
        if (this.mode !== RoomEditorMode.EDIT) {
          this.setMode(RoomEditorMode.EDIT, true);
        }
        this.selectWall(wallInfo.wallGroup, e.evt.ctrlKey);
      } else {
        this.deselectWall();
        this.deselectOpening();
      }
    }
  };

  /**
   * Returns the colour a wall should use in its default (unselected, unhovered) state.
   * When a highlight is active this returns the highlight colour;
   * otherwise falls back to the library default (VisualStyle.WALL_STROKE).
   */
  private getDefaultWallStroke(): string {
    return this.wallHighlightColor ?? (VisualStyle.WALL_STROKE as string);
  }
  /**
   * Applies or removes a highlight colour across all walls in their default state.
   *
   * Walls currently selected (PREVIEW_STROKE) or hovered (HOVER_STROKE) are
   * intentionally skipped so their system colours are not overwritten.
   *
   * @param active - true to enable highlight, false to restore default wall colour
   * @param theme  - "dark" → white highlight, any other value → black highlight
   */
  public highlightWalls(active: boolean, theme: string): void {
    this.wallHighlightColor = active
      ? (theme === "dark" ? "#ffffff" : "#000000")
      : null;

    const targetColor = this.getDefaultWallStroke();

    const SYSTEM_COLORS = new Set([
      VisualStyle.PREVIEW_STROKE as string,
      VisualStyle.HOVER_STROKE as string,
      VisualStyle.WALL_ERROR_STROKE as string,
      'red',
    ]);

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    let needsDraw = false;
    floorplanLayer.find(`.${NodeName.WALL}`).forEach((node) => {
      const wallLine = node as Konva.Line;
      const cur = wallLine.stroke() as string;
      if (SYSTEM_COLORS.has(cur) || cur === targetColor) return;
      wallLine.stroke(targetColor);
      needsDraw = true;
    });

    if (needsDraw) floorplanLayer.batchDraw();
  }



  /**
   * Shows or hides the layers that render the user's drawing
   * (walls, room fills, room labels, and interactive elements),
   * independent of the background image layer.
   * @param visible Whether the drawing layers should be visible
   */
  public setDrawingLayersVisibility(visible: boolean): void {
    const layerNames = [
      NodeName.FLOORPLAN_LAYER,
      NodeName.ROOM_FILL_LAYER,
      NodeName.ROOM_LABEL_LAYER,
      NodeName.INTERACTION_LAYER,
    ];

    layerNames.forEach((name) => {
      this.getLayer(name)?.visible(visible);
    });

    this.stage.batchDraw();
  }

  /**
   * Listener for mousemove events on the stage.
   */
  private handleMouseMove = () => {
    // Pan Logic
    if (this.isPanning && this.lastPanPointerPosition) {
      const currentPosition = this.stage.getPointerPosition();
      if (!currentPosition) return;

      // Calculate movement delta
      const dx = currentPosition.x - this.lastPanPointerPosition.x;
      const dy = currentPosition.y - this.lastPanPointerPosition.y;

      // update stage position
      this.stage.position({
        x: this.stage.x() + dx,
        y: this.stage.y() + dy,
      });

      // Sync background to the new view
      this.syncBackgroundToStage();
      this.lastPanPointerPosition = currentPosition;
      this.stage.batchDraw();
    } else {
      if (!this.draggingEndpoint && !this.draggingOpening) {
        if (this.mode !== RoomEditorMode.DRAW && this.mode !== RoomEditorMode.WINDOW && this.mode !== RoomEditorMode.DOOR) {
          this.updateHoverHighlight();
        }
      }

      if (this.mode === RoomEditorMode.DRAW) {
        const worldPos = this.getWorldPointerPosition();
        if (!worldPos) return;

        this.mouseMoved = true;

        if (!this.lastPoint && this.isPointOnOpening(worldPos.x, worldPos.y)) {
          this.stage.container().style.cursor = "not-allowed";
          this.hideSnapIndicator();
          return;
        } else {
          this.stage.container().style.cursor = "crosshair";
        }

        // update the visual preview of the wall being drawn
        this.updateTarget(worldPos.x, worldPos.y);
      } else if (this.mode === RoomEditorMode.WINDOW) {
        // if the mode is window then get the pointer position
        const worldPos = this.getWorldPointerPosition();
        if (!worldPos) return;
        // update the previwWindow rectangle position
        this.updateWindowPreview(worldPos.x, worldPos.y);
      } else if (this.mode === RoomEditorMode.DOOR) {
        const worldPos = this.getWorldPointerPosition();
        if (!worldPos) return;
        this.updateDoorPreview(worldPos.x, worldPos.y);
      } else if (this.mode === RoomEditorMode.EDIT) {

        const worldPos = this.getWorldPointerPosition();
        if (!worldPos) return;

        if (this.draggingEndpoint) {
          this.handleEndpointDragging(worldPos.x, worldPos.y);
        }
        else if (this.draggingOpening) {
          const worldPos = this.getWorldPointerPosition();
          if (!worldPos) return;

          this.handleOpeningDragging(worldPos.x, worldPos.y);
        }
        else {
          let isHoveringEndpoint = false;

          if (this.selectedWallGroups.length === 1) {
            const selectedGroup = this.selectedWallGroups[0];
            const wallLine = selectedGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
            if (wallLine) {
              const points = wallLine.points();
              const snapRadius = Config.SNAP_RADIUS as number;

              if (Math.hypot(worldPos.x - points[0], worldPos.y - points[1]) < snapRadius) {
                this.showSnapIndicator(points[0], points[1], selectedGroup, false);
                isHoveringEndpoint = true;
              } else if (Math.hypot(worldPos.x - points[2], worldPos.y - points[3]) < snapRadius) {
                this.showSnapIndicator(points[2], points[3], selectedGroup, false);
                isHoveringEndpoint = true;
              }
            }
          }

          if (!isHoveringEndpoint) {
            this.hideSnapIndicator();
          }
        }
      }
    }
  };

  /**
   * Is point on opening.
   *
   * @param {number} px - Parameter description.
   * @param {number} py - Parameter description.
   * @returns {boolean} Description of return value.
   */
  private isPointOnOpening(px: number, py: number): boolean {
    // Convert world coordinates (px, py) back to screen/stage coordinates for getIntersection
    const stagePos = {
      x: px * this.stage.scaleX() + this.stage.x(),
      y: py * this.stage.scaleY() + this.stage.y()
    };

    const shape = this.stage.getIntersection(stagePos);
    if (!shape) return false;

    if (shape.name() === NodeName.WINDOW) {
      return true;
    }
    const parentGroup = shape?.getParent();

    if (parentGroup?.name() === NodeName.DOOR_GROUP) {
      return true;
    }
    return false;
  }

  /**
   * Handles placing a point or creating a wall in DRAW mode.
   * Automatically exits draw mode when a closed room is completed.
   */
  private async handleDrawMode(worldPos: { x: number; y: number }, isDoubleClick: boolean = false) {
    if (!this.lastPoint && !this.isDrawModeExplicitlyEnabled && !isDoubleClick) {
      return;
    }

    if (!this.lastPoint && this.isPointOnOpening(worldPos.x, worldPos.y)) {
      return;
    }

    let finalX = worldPos.x;
    let finalY = worldPos.y;

    // If there was a previous point, apply axis snapping
    if (this.lastPoint && this.isAxisSnappingEnabled) {
      const snapped = this.applyAxisAndGridSnapping(
        this.lastPoint.x,
        this.lastPoint.y,
        finalX,
        finalY,
      );
      finalX = snapped.x;
      finalY = snapped.y;
    }
    else {

      const endpointSnap = this.getEndpointSnap(worldPos.x, worldPos.y);

      if (endpointSnap.snapped) {
        finalX = endpointSnap.x;
        finalY = endpointSnap.y;
        this.hideSnapIndicator();
      } else {
        const segmentSnap = this.getSegmentSnap(worldPos.x, worldPos.y);
        if (segmentSnap.snapped) {
          finalX = segmentSnap.x;
          finalY = segmentSnap.y;
          this.hideSnapIndicator();
        } else {
          const gridSnap = this.getIntersectionSnappedPosition(
            worldPos.x,
            worldPos.y,
          );
          finalX = gridSnap.x;
          finalY = gridSnap.y;
        }
      }
    }

    // If there was a previous point, create a wall between them.
    if (this.lastPoint) {
      // Check for overlap before creating (collinear segments) or check whether the wall is getting passed through doors and windows
      if (this.isWallOverlapping(this.lastPoint.x, this.lastPoint.y, finalX, finalY) ||
        this.isWallThroughOpening(this.lastPoint.x, this.lastPoint.y, finalX, finalY)
      ) {
        // Block creation and return without updating lastPoint or finishing the line
        return;
      }

      // Capture room count before creating the new wall
      const roomsBefore = await this.detectRooms();
      const roomCountBefore = roomsBefore.length;

      const wallGroup = this.floorplan.newWall(
        this.lastPoint.x,
        this.lastPoint.y,
        finalX,
        finalY,
      );

      const dimension = this.createDimension(
        this.lastPoint.x,
        this.lastPoint.y,
        finalX,
        finalY,
        VisualStyle.DIMENSION_COLOR as string,
      );

      if (dimension) {
        wallGroup.add(dimension);
      }

      this.draw(); // Ensure walls are rendered before detection
      const roomsAfter = await this.detectRooms();
      const roomCountAfter = roomsAfter.length;

      // If a new closed room was formed, exit draw mode automatically
      if (roomCountAfter > roomCountBefore) {
        this.lastPoint = null;
        this.setMode(RoomEditorMode.DRAW, false);
        this.draw();
        return;
      }
    }

    this.lastPoint = { x: finalX, y: finalY };
    this.draw();
  }

  /**
   * Listener for double click events on the stage to start wall drawing.
   */
  private handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {

    const pointerPos = this.stage.getPointerPosition();

    const shape = this.stage.getIntersection(pointerPos as any);
    if (shape && shape.name() === NodeName.DIMENSION_TEXT) {
      const textNode = shape as Konva.Text;
      const currentValue = textNode.text();
      const dimensionGroup = textNode.getParent() as Konva.Group;
      const wallGroup = dimensionGroup.getParent() as Konva.Group;
      const isVertical: boolean = this.isWallVertical(wallGroup);
      this.selectWall(wallGroup);
      Events.emit(ConfiguratorEventType.EDIT_WALL_DIMENIONS,
        {
          currentValue,
          isVertical,
          clientX: e.evt.clientX,
          clientY: e.evt.clientY,
          setNewWallDimension: (newValue: number, pointToChange: string) => {
            this.editWallDimensions(wallGroup, newValue, pointToChange);
          }
        }
      )
      return;
    }
    if (e.evt.button === 0) {
      // Validate double click distance and time
      if (this.clickHistory.length === 2) {
        const dx = this.clickHistory[1].x - this.clickHistory[0].x;
        const dy = this.clickHistory[1].y - this.clickHistory[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = this.clickHistory[1].time - this.clickHistory[0].time;

        // If distance is too large or time between clicks is too long, treat it as two separate single clicks
        if (distance > 10 || timeDiff > 250) {
          return;
        }
      }

      if (this.mode !== RoomEditorMode.DRAW) {
        this.setMode(RoomEditorMode.DRAW, true);
      }
      this.mouseMoved = false;

      const worldPos = this.getWorldPointerPosition();
      if (!worldPos) return;

      this.handleDrawMode(worldPos, true);
    }
  };

  /**
   * Check is the wall Vertical
   */
  private isWallVertical(wallGroup: Konva.Group): boolean {
    const wall: Konva.Line = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    const points = wall.points();
    const dx = points[2] - points[0];
    const dy = points[3] - points[1];
    return Math.abs(dx) < Math.abs(dy);
  }

  /**
   * Edits the wall dimensions based on the new length.
   * @param wallGroup - The Konva group representing the wall.
   * @param newLength - The new length in physical units.
   * @param wallEditPoint - The edit reference point.
   * @returns True if the edit was successful, false otherwise.
   */
  private editWallDimensions(
    wallGroup: Konva.Group,
    newLength: number,
    wallEditPoint: string
  ): boolean {
    if (newLength < 0) return false;
    // Get the wallGroup
    const wall: Konva.Line = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    const points = wall.points();

    const x1 = points[0];
    const y1 = points[1];
    const x2 = points[2];
    const y2 = points[3];

    const dx = x2 - x1;
    const dy = y2 - y1;

    const currentLength = Math.sqrt(dx * dx + dy * dy);
    if (currentLength === 0) return false;

    const ux = dx / currentLength;
    const uy = dy / currentLength;

    // Convert to konva unit
    newLength = newLength / ((Config.KONVA_UNIT_TO_CM as number) * this.unit_conversion_factor);
    // Final wall coordinates
    let startX = x1;
    let startY = y1;
    let endX = x2;
    let endY = y2;
    switch (wallEditPoint) {
      case "top":
        // Move the endpoint having the smaller Y
        if (y1 < y2) {
          // start is top
          startX = x2 - ux * newLength;
          startY = y2 - uy * newLength;
        } else {
          // end is top
          endX = x1 + ux * newLength;
          endY = y1 + uy * newLength;
        }
        break;

      case "down":
        // Move the endpoint having the larger Y
        if (y1 > y2) {
          // start is bottom
          startX = x2 - ux * newLength;
          startY = y2 - uy * newLength;
        } else {
          // end is bottom
          endX = x1 + ux * newLength;
          endY = y1 + uy * newLength;
        }
        break;

      case "left":
        // Move the endpoint having the smaller X
        if (x1 < x2) {
          // start is left
          startX = x2 - ux * newLength;
          startY = y2 - uy * newLength;
        } else {
          // end is left
          endX = x1 + ux * newLength;
          endY = y1 + uy * newLength;
        }
        break;

      case "right":
        // Move the endpoint having the larger X
        if (x1 > x2) {
          // start is right
          startX = x2 - ux * newLength;
          startY = y2 - uy * newLength;
        } else {
          // end is right
          endX = x1 + ux * newLength;
          endY = y1 + uy * newLength;
        }
        break;
    }

    const isInvalid =
      this.isWallThroughOpening(startX, startY, endX, endY, wallGroup) ||
      this.isWallOverlapping(startX, startY, endX, endY, wallGroup);

    if (isInvalid) {
      wall.stroke(VisualStyle.WALL_ERROR_STROKE as string);
      this.stage.batchDraw();
      wall.stroke(this.getDefaultWallStroke());
      return false;
    }
    wall.points([startX, startY, endX, endY]);

    const userData = wallGroup.getAttr("userData") as WallUserData;

    if (userData) {
      userData.startPoint = { x: startX, y: startY };
      userData.endPoint = { x: endX, y: endY };
    }

    wallGroup.findOne(`.${NodeName.DIMENSION_GROUP}`)?.destroy();

    const dimension = this.createDimension(
      startX,
      startY,
      endX,
      endY,
      VisualStyle.DIMENSION_COLOR as string
    );

    if (dimension) {
      wallGroup.add(dimension);
    }

    if (userData) {
      if (userData.windows) {
        this.renderWindows(wallGroup, userData);
      }

      if (userData.doors) {
        this.renderDoors(wallGroup, userData);
      }
    }

    this.detectRooms();

    this.stage.batchDraw();

    return true;
  }

  /**
   * Handle window mode.
   *
   * @param {{ x} worldPos - Parameter description.
   * @returns {void}
   */
  private handleWindowMode(worldPos: { x: number; y: number }) {
    const wallInfo = this.getWallUnderPointer();
    if (wallInfo) {
      const { wallGroup, wallLine } = wallInfo;
      const userData = wallGroup.getAttr("userData") as WallUserData;

      const points = wallLine.points();
      const x1 = points[0],
        y1 = points[1],
        x2 = points[2],
        y2 = points[3];
      const dx = x2 - x1,
        dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);

      const t =
        ((worldPos.x - x1) * dx + (worldPos.y - y1) * dy) /
        (length * length);
      const windowWidth = Config.DEFAULT_WINDOW_WIDTH as number;
      const windowCanvasWidth = this.getOpeningCanvasWidth(windowWidth);

      // const halfWidth = windowWidth / 2;
      const halfWidth = windowCanvasWidth / 2;
      const offset = Math.max(
        halfWidth,
        Math.min(length - halfWidth, t * length),
      );

      const isOverlapping = this.isItemOverlapping(
        userData,
        offset,
        // windowWidth
        windowCanvasWidth
      );

      if (!isOverlapping) {
        if (!userData.windows) userData.windows = [];
        userData.windows.push({
          id: uuidv4(),
          offset: offset,
          width: windowWidth,
        });

        this.renderWindows(wallGroup, userData);
        this.draw();
      }
    }
  }

  /**
   * Handle door mode.
   *
   * @param {{ x} worldPos - Parameter description.
   * @returns {void}
   */
  private handleDoorMode(worldPos: { x: number; y: number }) {
    const wallInfo = this.getWallUnderPointer();
    if (wallInfo) {
      const { wallGroup, wallLine } = wallInfo;
      const userData = wallGroup.getAttr("userData") as WallUserData;

      const points = wallLine.points();
      const x1 = points[0],
        y1 = points[1],
        x2 = points[2],
        y2 = points[3];
      const dx = x2 - x1,
        dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);

      const t =
        ((worldPos.x - x1) * dx + (worldPos.y - y1) * dy) /
        (length * length);
      const doorWidth = Config.DEFAULT_DOOR_WIDTH as number;
      const doorCanvasWidth = this.getOpeningCanvasWidth(doorWidth);
      const halfWidth = doorCanvasWidth / 2;
      // const halfWidth = doorWidth / 2;
      const offset = Math.max(
        halfWidth,
        Math.min(length - halfWidth, t * length),
      );

      const isOverlapping = this.isItemOverlapping(
        userData,
        offset,
        // doorWidth
        doorCanvasWidth
      );

      if (!isOverlapping) {
        if (!userData.doors) userData.doors = [];
        userData.doors.push({
          id: uuidv4(),
          offset: offset,
          width: doorWidth,
        });

        this.renderDoors(wallGroup, userData);
        this.draw();
      }
    }
  }

  /**
   * Handle edit mode.
   *
   * @returns {void}
   */
  private handleEditMode() {
    if (this.draggingEndpoint) {
      if (this.draggingEndpoint.isInvalid) {
        const { wallGroup, originalPoints } = this.draggingEndpoint;
        const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
        if (wallLine) {
          wallLine.points([...originalPoints]);
          wallLine.stroke(VisualStyle.PREVIEW_STROKE as string);
        }

        const userData = wallGroup.getAttr("userData") as WallUserData;
        if (userData) {
          userData.startPoint = { x: originalPoints[0], y: originalPoints[1] };
          userData.endPoint = { x: originalPoints[2], y: originalPoints[3] };
        }

        wallGroup.findOne(`.${NodeName.DIMENSION_GROUP}`)?.destroy();
        const dimension = this.createDimension(
          originalPoints[0],
          originalPoints[1],
          originalPoints[2],
          originalPoints[3],
          VisualStyle.DIMENSION_COLOR as string
        );
        if (dimension) {
          wallGroup.add(dimension);
        }

        if (userData) {
          if (userData.windows) this.renderWindows(wallGroup, userData);
          if (userData.doors) this.renderDoors(wallGroup, userData);
        }
        this.stage.batchDraw();
      } else {
        const wallLine = this.draggingEndpoint.wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
        if (wallLine) wallLine.stroke(VisualStyle.PREVIEW_STROKE as string);

        const wallGroup = this.draggingEndpoint.wallGroup;
        const points = wallLine.points();
        wallGroup.findOne(`.${NodeName.DIMENSION_GROUP}`)?.destroy();
        const dimension = this.createDimension(
          points[0],
          points[1],
          points[2],
          points[3],
          VisualStyle.DIMENSION_COLOR as string
        );
        if (dimension) wallGroup.add(dimension);
      }

      const { wallGroup, originalPoints } = this.draggingEndpoint;

      const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;

      if (wallLine) {
        const points = wallLine.points();

        const isOverlapping = this.isWallOverlapping(
          points[0],
          points[1],
          points[2],
          points[3],
          wallGroup
        );

        if (isOverlapping) {
          // Restore old position
          wallLine.points(originalPoints);

          // Restore wall color
          wallLine.stroke(VisualStyle.WALL_STROKE as string);

          // Restore userData
          const userData = wallGroup.getAttr("userData") as WallUserData;
          if (userData) {
            userData.startPoint = {
              x: originalPoints[0],
              y: originalPoints[1]
            };
            userData.endPoint = {
              x: originalPoints[2],
              y: originalPoints[3]
            };
          }
        }
      }
      this.hideSnapIndicator();
      this.draggingEndpoint = null;
      this.detectRooms();
      this.stage.batchDraw();
    }
    else if (this.draggingOpening) {
      this.draggingOpening = null;
    }
  }

  /**
   * Listener for mouseup events on the stage.
   */
  private handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Pan End Logic
    if (e.evt.button === 2) {
      this.stopPanning();
    }

    // Interaction End Logic
    if (e.evt.button === 0) {
      // Record click history for double click validation
      this.clickHistory.push({ x: e.evt.clientX, y: e.evt.clientY, time: Date.now() });
      if (this.clickHistory.length > 2) {
        this.clickHistory.shift();
      }

      const worldPos = this.getWorldPointerPosition();
      if (!worldPos) return;

      // Handle wall placement in DRAW mode
      if (this.mode === RoomEditorMode.DRAW && !this.mouseMoved) {
        this.handleDrawMode(worldPos);
      }

      // Handle window placement in WINDOW mode
      if (this.mode === RoomEditorMode.WINDOW) {
        this.handleWindowMode(worldPos);
      }

      // Handle door placement in DOOR mode
      if (this.mode === RoomEditorMode.DOOR) {
        this.handleDoorMode(worldPos);
      }

      if (this.mode === RoomEditorMode.EDIT) {
        this.handleEditMode();
      }
    }
  };

  /**
   * Handles the movement logic for dragging a wall endpoint.
   * @param x New world X coordinate
   * @param y New world Y coordinate
   */
  private handleEndpointDragging(x: number, y: number) {
    if (!this.draggingEndpoint) return;

    const { wallGroup, point } = this.draggingEndpoint;
    const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    if (!wallLine) return;

    let finalX = x;
    let finalY = y;

    const points = wallLine.points();

    // Use the opposite endpoint as the anchor
    const anchorX = point === "start" ? points[2] : points[0];
    const lastX = point === "start" ? points[0] : points[2];
    const anchorY = point === "start" ? points[3] : points[1];
    const lastY = point === "start" ? points[1] : points[3];

    if (this.isAxisSnappingEnabled) {
      const gridSnap = this.getIntersectionSnappedPosition(x, y);

      const snap = this.getAxisSnappedPosition(
        anchorX,
        anchorY,
        gridSnap.x,
        gridSnap.y
      );

      finalX = snap.x;
      finalY = snap.y;

      this.showSnapIndicator(
        finalX,
        finalY,
        wallGroup,
        false,
        VisualStyle.ENDPOINT_INDICATOR_SEGMENT_FILL as string
      );

      let isOverlapping = this.isWallOverlapping(lastX, lastY, anchorX, anchorY, wallGroup);
      if (isOverlapping) {
        wallGroup.moveToTop();
        wallLine.stroke(VisualStyle.WALL_ERROR_STROKE as string);

      }
      else {
        wallLine.stroke(VisualStyle.PREVIEW_STROKE as string);
      }
    } else {
      const endpointSnap = this.getEndpointSnap(x, y, wallGroup);
      if (endpointSnap.snapped && endpointSnap.parentGroup !== wallGroup) {
        finalX = endpointSnap.x;
        finalY = endpointSnap.y;
        this.showSnapIndicator(finalX, finalY, endpointSnap.parentGroup!, true);
      } else {
        const segmentSnap = this.getSegmentSnap(x, y, wallGroup);
        if (segmentSnap.snapped && segmentSnap.parentGroup !== wallGroup) {
          finalX = segmentSnap.x;
          finalY = segmentSnap.y;
          this.showSnapIndicator(finalX, finalY, segmentSnap.parentGroup!, false, VisualStyle.SNAP_INDICATOR_SEGMENT_FILL as string);
        }
        else {
          const gridSnap = this.getIntersectionSnappedPosition(x, y);
          finalX = gridSnap.x;
          finalY = gridSnap.y;
          this.showSnapIndicator(finalX, finalY, wallGroup, false, VisualStyle.ENDPOINT_INDICATOR_SEGMENT_FILL as string);
        }
      }
      let isOverlapping = this.isWallOverlapping(lastX, lastY, anchorX, anchorY, wallGroup);
      if (isOverlapping) {
        wallGroup.moveToTop();
        wallLine.stroke(VisualStyle.WALL_ERROR_STROKE as string);

      }
      else {
        wallLine.stroke(VisualStyle.PREVIEW_STROKE as string);
      }
    }

    const isInvalid = this.isWallThroughOpening(anchorX, anchorY, finalX, finalY, wallGroup) || this.isWallOverlapping(anchorX, anchorY, finalX, finalY, wallGroup);
    this.draggingEndpoint.isInvalid = isInvalid;

    if (isInvalid) {
      this.stage.container().style.cursor = "not-allowed";
      this.hideSnapIndicator();
      wallLine.stroke(VisualStyle.WALL_ERROR_STROKE as string);
    } else {
      this.stage.container().style.cursor = "crosshair";
      wallLine.stroke(VisualStyle.PREVIEW_STROKE as string);
    }

    if (point === "start") {
      points[0] = finalX;
      points[1] = finalY;
    } else {
      points[2] = finalX;
      points[3] = finalY;
    }
    wallLine.points(points);

    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (userData) {
      userData.startPoint = { x: points[0], y: points[1] };
      userData.endPoint = { x: points[2], y: points[3] };
    }


    wallGroup.findOne(`.${NodeName.DIMENSION_GROUP}`)?.destroy();
    const dimension = this.createDimension(
      points[0],
      points[1],
      points[2],
      points[3],
      isInvalid ? VisualStyle.WALL_ERROR_STROKE as string : VisualStyle.DIMENSION_COLOR as string
    );
    if (dimension) {
      wallGroup.add(dimension);
    }

    // update items on the wall if their position needs re-calculation
    if (userData) {
      const origPoints = this.draggingEndpoint.originalPoints;
      const oldLength = Math.hypot(origPoints[2] - origPoints[0], origPoints[3] - origPoints[1]);
      const newLength = Math.hypot(points[2] - points[0], points[3] - points[1]);

      this.repositionOpeningsOnWall(
        wallGroup,
        oldLength,
        newLength,
        this.draggingEndpoint.originalWindows,
        this.draggingEndpoint.originalDoors
      );
      this.resolveAndValidateOpeningsOnWall(wallGroup);

      if (userData.windows) this.renderWindows(wallGroup, userData);
      if (userData.doors) this.renderDoors(wallGroup, userData);
    }
    this.stage.batchDraw();
  }

  /**
   * Handles dragging an opening (door or window) along its wall.
   * @param x New world X coordinate
   * @param y New world Y coordinate
   */
  private handleOpeningDragging(x: number, y: number) {
    if (!this.draggingOpening) return;

    const { group, type, wallGroup, entityId } = this.draggingOpening;
    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (!userData) return;

    const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    if (!wallLine) return;

    const points = wallLine.points();
    const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
    const dx = x2 - x1, dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Project pointer onto wall line
    const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);

    // Get item width
    const items = type === "window" ? userData.windows : userData.doors;
    const item = items?.find((i) => i.id === entityId);
    if (!item) return;

    const itemCanvasWidth = this.getOpeningCanvasWidth(item.width);
    const halfWidth = itemCanvasWidth / 2;
    // Clamp offset so item stays on wall
    const offset = Math.max(halfWidth, Math.min(length - halfWidth, t * length));

    const isOverlapping = this.isItemOverlapping(userData, offset, itemCanvasWidth, entityId);

    if (!isOverlapping) {
      item.offset = offset;

      const newX = x1 + (offset / length) * dx;
      const newY = y1 + (offset / length) * dy;

      // update the group's visual position directly
      group.position({ x: newX, y: newY });

      // update the dimensions
      const color = type === "window" ? VisualStyle.WINDOW_STROKE as string : VisualStyle.DOOR_STROKE as string;
      this.renderOpeningDimensions(group, offset, length, color);
      this.stage.batchDraw();
    }
  }

  /**
   * Updates the visual preview of a window being placed.
   * @param x World X coordinate of the mouse pointer
   * @param y World Y coordinate of the mouse pointer
   */
  private updateWindowPreview(x: number, y: number) {
    const wallInfo = this.getWallUnderPointer();

    // If a wall is found under the mouse pointer...
    if (wallInfo) {
      // Hide the current wall's total dimension to avoid overlap
      wallInfo.wallGroup.findOne(`.${NodeName.DIMENSION_GROUP}`)?.visible(false);

      // Get the line shape representing the wall
      const { wallLine } = wallInfo;
      // Extract the underlying points [startX, startY, endX, endY]
      const points = wallLine.points();

      // Store the starting and ending coordinates for easier math
      const x1 = points[0],
        y1 = points[1],
        x2 = points[2],
        y2 = points[3];

      // Calculate the horizontal (dx) and vertical (dy) distance of the entire wall
      const dx = x2 - x1,
        dy = y2 - y1;

      // Use Pythagorean theorem to find the total length of the wall
      const length = Math.sqrt(dx * dx + dy * dy);

      // Calculate the angle of the wall in degrees to rotate our window preview to match it
      // Math.atan2 gives radians, so we multiply by 180 / PI to get degrees
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Project the mouse cursor exactly onto the wall's line
      // 't' is a percentage (from 0 to 1) representing how far along the wall the mouse is from starting point
      const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);

      // Get the default width defined for a window
      const windowWidth = Config.DEFAULT_WINDOW_WIDTH as number;
      const windowCanvasWidth = this.getOpeningCanvasWidth(windowWidth);
      // Calculate half the width, used to prevent the window from hanging off the edges
      const halfWidth = windowCanvasWidth / 2;

      // Prevent the window preview from sliding past the wall's start or end points
      // We calculate the exact pixel distance from the start of the wall (t * length)
      // Then clamp it between `halfWidth` (so it doesn't cross the start point) 
      // and `length - halfWidth` (so it doesn't cross the end point)
      const offset = Math.max(
        halfWidth,
        Math.min(length - halfWidth, t * length),
      );

      // update the visual preview rectangle
      if (this.previewWindow) {
        // Move the preview to the exact snapped and clamped position on the wall
        this.previewWindow.x(x1 + (offset / length) * dx);
        this.previewWindow.y(y1 + (offset / length) * dy);
        // Rotate the preview so it aligns parallel with the wall
        this.previewWindow.rotation(angle);

        // Check for overlap and apply appropriate styling
        const isOverlapping = this.isItemOverlapping(
          wallInfo.wallGroup.getAttr("userData") as WallUserData,
          offset,
          windowCanvasWidth
        );

        const previewRect = this.previewWindow.findOne(`.${NodeName.WINDOW}`) as Konva.Rect;
        if (previewRect) {
          if (isOverlapping) {
            previewRect.fill(VisualStyle.WINDOW_ERROR_FILL as string);
            previewRect.stroke(VisualStyle.WINDOW_ERROR_STROKE as string);
          } else {
            previewRect.fill(VisualStyle.WINDOW_FILL as string);
            previewRect.stroke(VisualStyle.WINDOW_STROKE as string);
          }
        }

        // Make sure the preview is visible
        this.previewWindow.visible(true);
      }

      // update Dimension Previews
      const interactionLayer = this.getLayer(NodeName.INTERACTION_LAYER);
      if (interactionLayer) {

        // Clear old dimension previews
        interactionLayer.find(`.window-preview-dimension`).forEach(node => node.destroy());

        // distance from wall start to nearer window end
        const startOffset = offset - windowCanvasWidth / 2;
        // distance from wall start to farther window end
        const endOffset = offset + windowCanvasWidth / 2;

        // unit vectror of wall along x
        const ux = dx / length;
        // unit vector of wall along y
        const uy = dy / length;

        // exact coordinates of the window start point
        const windowStartX = x1 + startOffset * ux;
        const windowStartY = y1 + startOffset * uy;
        // exact coordinates of the window end point
        const windowEndX = x1 + endOffset * ux;
        const windowEndY = y1 + endOffset * uy;

        const windowMidX = (windowStartX + windowEndX) / 2;
        const windowMidY = (windowStartY + windowEndY) / 2;

        // create dimension from wall start to window start
        if (startOffset > 5) {
          const dimStart = this.createDimension(
            x1, y1, windowMidX, windowMidY,
            VisualStyle.WINDOW_STROKE as string
          );
          if (dimStart) {
            dimStart.name("window-preview-dimension");
            interactionLayer.add(dimStart);
          }
        }

        // create dimension from window end to wall end
        if (length - endOffset > 5) {
          const dimEnd = this.createDimension(
            windowMidX, windowMidY, x2, y2,
            VisualStyle.WINDOW_STROKE as string
          );
          if (dimEnd) {
            dimEnd.name("window-preview-dimension");
            interactionLayer.add(dimEnd);
          }
        }
        interactionLayer.batchDraw();
      }
    } else {
      // If the mouse is NOT over any wall, hide the preview window
      if (this.previewWindow) this.previewWindow.visible(false);
      this.getLayer(NodeName.INTERACTION_LAYER)?.find(`.window-preview-dimension`).forEach(node => node.destroy());

      // Restore all wall dimensions to visibility
      this.restoreWallDimensions();
      this.getLayer(NodeName.INTERACTION_LAYER)?.batchDraw();
    }
    this.stage.batchDraw();
  }


  /**
   * Stops the panning interaction and resets state.
   */
  private stopPanning = () => {
    if (this.isPanning) {
      this.isPanning = false;
      this.lastPanPointerPosition = null;
    }
  };

  /**
   * Updates the visual preview (line and circle) while drawing a new wall.
   * @param x Target world X coordinate
   * @param y Target world Y coordinate
   */
  private updateTarget(x: number, y: number) {
    let targetX = x;
    let targetY = y;
    let snappedGroup: Konva.Group | null = null;
    let isSnapped = false;
    let isSegmentSnapped = false;

    // Apply axis snapping if enabled and there's a last point
    if (this.lastPoint && this.isAxisSnappingEnabled) {
      const snapped = this.applyAxisAndGridSnapping(
        this.lastPoint.x,
        this.lastPoint.y,
        targetX,
        targetY,
      );
      targetX = snapped.x;
      targetY = snapped.y;
    }
    else {
      const endpointSnap = this.getEndpointSnap(x, y);
      if (endpointSnap.snapped) {
        targetX = endpointSnap.x;
        targetY = endpointSnap.y;
        snappedGroup = endpointSnap.parentGroup;
        isSnapped = true;
      } else {
        const segmentSnap = this.getSegmentSnap(x, y);
        if (segmentSnap.snapped) {
          targetX = segmentSnap.x;
          targetY = segmentSnap.y;
          snappedGroup = segmentSnap.parentGroup;
          isSnapped = true;
          isSegmentSnapped = true;
        }
      }

      if (isSnapped && snappedGroup) {
        this.showSnapIndicator(
          targetX,
          targetY,
          snappedGroup,
          !isSegmentSnapped,
          isSegmentSnapped
            ? VisualStyle.SNAP_INDICATOR_SEGMENT_FILL as string
            : VisualStyle.SNAP_INDICATOR_FILL as string
        );
      } else {
        this.hideSnapIndicator();

        const snappedPos = this.getIntersectionSnappedPosition(x, y);
        targetX = snappedPos.x;
        targetY = snappedPos.y;

        // If not snapped to grid, we can still snap to axis if drawing from an existing point
        if (targetX === x && targetY === y && this.lastPoint) {
          if (Math.abs(x - this.lastPoint.x) < (Config.SNAP_RADIUS as number))
            targetX = this.lastPoint.x;
          if (Math.abs(y - this.lastPoint.y) < (Config.SNAP_RADIUS as number))
            targetY = this.lastPoint.y;
        }

      }
    }

    // update Preview Line and Overlap Warning
    if (this.lastPoint) {
      if (!this.previewLine) {
        this.previewLine = this.createPreviewLine();
        this.getLayer(NodeName.INTERACTION_LAYER)?.add(this.previewLine);
      }
      this.previewLine.points([
        this.lastPoint.x,
        this.lastPoint.y,
        targetX,
        targetY,
      ]);

      // Check if the previewed wall overlaps any existing wall of the same slope
      const isOverlapping = this.isWallOverlapping(
        this.lastPoint.x,
        this.lastPoint.y,
        targetX,
        targetY,
      );

      // check if the previewd wall overlaps with any door or window placed
      const wallPassesThroughOpening = this.isWallThroughOpening(
        this.lastPoint.x,
        this.lastPoint.y,
        targetX,
        targetY,
      );
      if (isOverlapping || wallPassesThroughOpening) {
        this.stage.container().style.cursor = "not-allowed";
        this.hideSnapIndicator();
        this.previewLine.stroke(VisualStyle.WALL_ERROR_STROKE as string);
      } else {
        this.stage.container().style.cursor = "crosshair";
        this.previewLine.stroke(VisualStyle.PREVIEW_FILL as string);
      }

      // update preview dimension
      if (this.previewDimension) {
        this.previewDimension.destroy();
        this.previewDimension = null;
      }

      const dimension = this.createDimension(
        this.lastPoint.x,
        this.lastPoint.y,
        targetX,
        targetY,
        VisualStyle.DOOR_STROKE as string,
      );

      if (dimension) {
        this.previewDimension = dimension;
        this.getLayer(NodeName.INTERACTION_LAYER)?.add(this.previewDimension);
      }
    } else if (this.previewLine) {
      // If no last node, remove the preview line
      this.previewLine.destroy();
      this.previewLine = null;

      if (this.previewDimension) {
        this.previewDimension.destroy();
        this.previewDimension = null;
      }
    }
    this.getLayer(NodeName.INTERACTION_LAYER)?.batchDraw();
  }

  /**
   * Checks if the current cursor position is close to any existing wall endpoint.
   * If so, returns the snapped coordinates and the wall group.
   * @param x Cursor X
   * @param y Cursor Y
   */
  private getEndpointSnap(
    x: number,
    y: number,
    ignoredGroup?: Konva.Group
  ): {
    x: number;
    y: number;
    snapped: boolean;
    parentGroup: Konva.Group | null;
  } {
    const snapRadius = Config.SNAP_RADIUS as number;
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return { x, y, snapped: false, parentGroup: null };

    const children = floorplanLayer.getChildren();

    for (const child of children) {
      if (ignoredGroup && child === ignoredGroup) continue;
      // Ensure we are dealing with a Group containing a wall
      if (child instanceof Konva.Group) {
        //selects the first node with name wall
        const wall = child.findOne(`.${NodeName.WALL}`) as Konva.Line;

        if (wall) {
          const points = wall.points();
          if (points.length >= 4) {
            const x1 = points[0];
            const y1 = points[1];
            const x2 = points[2];
            const y2 = points[3];

            // Check start point
            if (Math.hypot(x - x1, y - y1) < snapRadius) {
              if (!this.isPointOnOpening(x1, y1)) {
                return { x: x1, y: y1, snapped: true, parentGroup: child };
              }
            }

            // Check end point
            if (Math.hypot(x - x2, y - y2) < snapRadius) {
              if (!this.isPointOnOpening(x2, y2)) {
                return { x: x2, y: y2, snapped: true, parentGroup: child };
              }
            }
          }
        }
      }
    }

    return { x, y, snapped: false, parentGroup: null };
  }

  /**
   * Checks if the current cursor position is close to any existing wall segment.
   * If so, returns the snapped coordinates on the segment and the wall group.
   * @param x Cursor X
   * @param y Cursor Y
   */
  private getSegmentSnap(
    x: number,
    y: number,
    ignoredGroup?: Konva.Group
  ): {
    x: number;
    y: number;
    snapped: boolean;
    parentGroup: Konva.Group | null;
  } {
    const snapRadius = Config.SEGMENT_SNAP_RADIUS as number;
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return { x, y, snapped: false, parentGroup: null };

    const children = floorplanLayer.getChildren();

    let closestPoint = { x, y };
    let minDistance = Infinity;
    let snappedGroup: Konva.Group | null = null;

    for (const child of children) {
      if (ignoredGroup && child === ignoredGroup) continue;
      if (child instanceof Konva.Group) {
        const wall = child.findOne(`.${NodeName.WALL}`) as Konva.Line;
        if (wall) {
          const points = wall.points();
          if (points.length >= 4) {
            const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];

            // Calculate closest point on segment
            const dx = x2 - x1;
            const dy = y2 - y1;
            const lengthSq = dx * dx + dy * dy;

            if (lengthSq === 0) continue;

            let t = ((x - x1) * dx + (y - y1) * dy) / lengthSq;
            t = Math.max(0, Math.min(1, t));

            const projX = x1 + t * dx;
            const projY = y1 + t * dy;

            const dist = Math.hypot(x - projX, y - projY);
            if (dist < snapRadius && dist < minDistance) {
              if (!this.isPointOnOpening(projX, projY)) {
                minDistance = dist;
                closestPoint = { x: projX, y: projY };
                snappedGroup = child;
              }
            }
          }
        }
      }
    }

    if (snappedGroup) {
      return { x: closestPoint.x, y: closestPoint.y, snapped: true, parentGroup: snappedGroup };
    }

    return { x, y, snapped: false, parentGroup: null };
  }

  /**
   * Shows a visual circle indicator at the snapped position within the wall's group.
   * @param x Snapped X
   * @param y Snapped Y
   * @param parentGroup The existing wall group to attach the indicator to
   */
  private showSnapIndicator(x: number, y: number, parentGroup: Konva.Group, showOuter: boolean = true, color: string = VisualStyle.SNAP_INDICATOR_FILL as string) {
    // If we already have an indicator, remove it first to avoid duplicates or stale state
    this.hideSnapIndicator();

    const group = new Konva.Group({ name: NodeName.ENDPOINT_CIRCLE_SNAP });
    const circle = new Konva.Circle({
      x: x,
      y: y,
      radius: VisualStyle.SNAP_INDICATOR_RADIUS as number,
      fill: color,
      stroke: color,
      name: NodeName.INNER_SNAP_CIRCLE as string,
    });

    if (showOuter) {
      const outerCircle = new Konva.Circle({
        x: x,
        y: y,
        radius: (VisualStyle.SNAP_INDICATOR_RADIUS as number) + 5,
        fill: "transparent",
        stroke: color,
        strokeWidth: 1,
        name: NodeName.OUTER_SNAP_CIRCLE as string,
      });
      group.add(outerCircle);
    }

    group.add(circle);
    parentGroup.add(group);
    this.snapCircleIndicator = group;
    this.getLayer(NodeName.FLOORPLAN_LAYER)?.batchDraw();
  }

  /**
   * Removes current snap indicator if it exists.
   */
  private hideSnapIndicator() {
    if (this.snapCircleIndicator) {
      this.snapCircleIndicator.destroy();
      this.snapCircleIndicator = null;
      this.getLayer(NodeName.FLOORPLAN_LAYER)?.batchDraw();
    }
  }

  /**
   * Snaps a world coordinate to the nearest grid intersection if within radius.
   * @param x World X coordinate
   * @param y World Y coordinate
   * @returns Snapped world coordinates {x, y}
   */
  private getIntersectionSnappedPosition(
    x: number,
    y: number,
  ): { x: number; y: number } {
    // Do not snap to grid if background image is visible or grid is disabled
    if (this.backgroundRect.visible() || !this.gridGroup.visible()) {
      return { x, y };
    }

    const gridSize = Config.GRID_SIZE as number;
    const snapRadius = Config.SNAP_RADIUS as number;

    //Nearest grid intersection
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    //Measure how close the cursor is to that grid point
    const dx = x - snappedX;
    const dy = y - snappedY;

    //Distance from grid point
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < snapRadius) {
      return { x: snappedX, y: snappedY };
    }

    return { x, y };
  }

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
  private getAxisGridSnap(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): { x: number; y: number } {
    // Do not snap to grid if background image is visible or grid is disabled
    if (this.backgroundRect.visible() || !this.gridGroup.visible()) {
      return { x: endX, y: endY };
    }

    const gridSize = Config.GRID_SIZE as number;
    const snapRadius = Config.SNAP_RADIUS as number;

    const isVertical = startX === endX;
    const isHorizontal = startY === endY;

    // Vertical axis: lock X, snap only Y
    if (isVertical) {
      const snappedY = Math.round(endY / gridSize) * gridSize;

      if (Math.abs(endY - snappedY) < snapRadius) {
        return {
          x: startX,
          y: snappedY,
        };
      }
    }

    // Horizontal axis: lock Y, snap only X
    if (isHorizontal) {
      const snappedX = Math.round(endX / gridSize) * gridSize;

      if (Math.abs(endX - snappedX) < snapRadius) {
        return {
          x: snappedX,
          y: startY,
        };
      }
    }

    return {
      x: endX,
      y: endY,
    };
  }

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
  private applyAxisSnapping(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): { x: number; y: number } {
    // Calculate absolute displacement in both axes
    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);

    // If Y displacement is greater or equal, snap to Y axis (vertical line)
    if (deltaY >= deltaX) {
      return { x: startX, y: endY };
    }
    // If X displacement is greater, snap to X axis (horizontal line)
    else {
      return { x: endX, y: startY };
    }
  }

  /**
   * Applies axis snapping first, then allows the axis-constrained point to snap to the grid.
   */
  private applyAxisAndGridSnapping(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): { x: number; y: number } {

    const axisSnapped = this.applyAxisSnapping(
      startX,
      startY,
      endX,
      endY
    );

    //  segment snap first
    const segmentSnap = this.getAxisSegmentSnap(
      startX,
      startY,
      axisSnapped.x,
      axisSnapped.y
    );

    if (segmentSnap.snapped) {
      this.showSnapIndicator(
        segmentSnap.x,
        segmentSnap.y,
        segmentSnap.parentGroup!
      );

      return {
        x: segmentSnap.x,
        y: segmentSnap.y,
      };
    }

    //  endpoint snap
    const endpointSnap = this.getAxisEndpointSnap(
      startX,
      startY,
      axisSnapped.x,
      axisSnapped.y
    );

    if (endpointSnap.snapped) {
      this.showSnapIndicator(
        endpointSnap.x,
        endpointSnap.y,
        endpointSnap.parentGroup!
      );

      return {
        x: endpointSnap.x,
        y: endpointSnap.y,
      };
    }

    //  grid snap
    const gridSnap = this.getAxisGridSnap(
      startX,
      startY,
      axisSnapped.x,
      axisSnapped.y
    );

    // Check if grid actually changed the point
    if (
      gridSnap.x !== axisSnapped.x ||
      gridSnap.y !== axisSnapped.y
    ) {

      return gridSnap;
    }

    // No snap achieved
    this.hideSnapIndicator();

    return axisSnapped;
  }

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
  private getAxisEndpointSnap(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    ignoredGroup?: Konva.Group
  ): {
    x: number;
    y: number;
    snapped: boolean;
    parentGroup: Konva.Group | null;
  } {
    const snapRadius = Config.SNAP_RADIUS as number;
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);

    if (!floorplanLayer) {
      return { x: endX, y: endY, snapped: false, parentGroup: null };
    }

    const isVertical = startX === endX;
    const isHorizontal = startY === endY;

    for (const child of floorplanLayer.getChildren()) {
      if (ignoredGroup && child === ignoredGroup) {
        continue;
      }

      if (child instanceof Konva.Group) {
        const wall = child.findOne(`.${NodeName.WALL}`) as Konva.Line;

        if (!wall) continue;

        const points = wall.points();

        if (points.length >= 4) {
          const endpoints = [
            { x: points[0], y: points[1] },
            { x: points[2], y: points[3] }
          ];

          for (const point of endpoints) {
            // Drawing a vertical line, so only move along Y
            if (isVertical) {
              if (
                Math.abs(point.x - startX) <= snapRadius &&
                Math.abs(point.y - endY) <= snapRadius
              ) {
                return {
                  x: startX,
                  y: point.y,
                  snapped: true,
                  parentGroup: child
                };
              }
            }

            // Drawing a horizontal line, so only move along X
            if (isHorizontal) {
              if (
                Math.abs(point.y - startY) <= snapRadius &&
                Math.abs(point.x - endX) <= snapRadius
              ) {
                return {
                  x: point.x,
                  y: startY,
                  snapped: true,
                  parentGroup: child
                };
              }
            }
          }
        }
      }
    }

    return { x: endX, y: endY, snapped: false, parentGroup: null };
  }

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
  private getAxisSegmentSnap(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    ignoredGroup?: Konva.Group
  ): {
    x: number;
    y: number;
    snapped: boolean;
    parentGroup: Konva.Group | null;
  } {
    const snapRadius = Config.SEGMENT_SNAP_RADIUS as number;
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);

    if (!floorplanLayer) {
      return { x: endX, y: endY, snapped: false, parentGroup: null };
    }

    const isVertical = startX === endX;
    const isHorizontal = startY === endY;

    let bestPoint: { x: number; y: number } | null = null;
    let minDistance = Infinity;
    let snappedGroup: Konva.Group | null = null;

    for (const child of floorplanLayer.getChildren()) {
      if (ignoredGroup && child === ignoredGroup) continue;

      if (!(child instanceof Konva.Group)) continue;

      const wall = child.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (!wall) continue;

      const points = wall.points();
      if (points.length < 4) continue;

      const x1 = points[0];
      const y1 = points[1];
      const x2 = points[2];
      const y2 = points[3];

      // Vertical drawing
      if (isVertical) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        if (endY >= minY - snapRadius && endY <= maxY + snapRadius) {
          // Avoid division by zero for vertical walls
          if (x2 !== x1) {
            const t = (startX - x1) / (x2 - x1);

            if (t >= 0 && t <= 1) {
              const intersectY = y1 + t * (y2 - y1);
              const distance = Math.abs(endY - intersectY);

              if (distance < snapRadius && distance < minDistance) {
                minDistance = distance;
                bestPoint = {
                  x: startX,
                  y: intersectY,
                };
                snappedGroup = child;
              }
            }
          }
        }
      }

      // Horizontal drawing
      if (isHorizontal) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);

        if (endX >= minX - snapRadius && endX <= maxX + snapRadius) {
          // Avoid division by zero for horizontal walls
          if (y2 !== y1) {
            const t = (startY - y1) / (y2 - y1);

            if (t >= 0 && t <= 1) {
              const intersectX = x1 + t * (x2 - x1);
              const distance = Math.abs(endX - intersectX);

              if (distance < snapRadius && distance < minDistance) {
                minDistance = distance;
                bestPoint = {
                  x: intersectX,
                  y: startY,
                };
                snappedGroup = child;
              }
            }
          }
        }
      }
    }

    if (bestPoint && snappedGroup) {
      return {
        x: bestPoint.x,
        y: bestPoint.y,
        snapped: true,
        parentGroup: snappedGroup,
      };
    }

    return {
      x: endX,
      y: endY,
      snapped: false,
      parentGroup: null,
    };
  }

  /**
   * Creates a new preview line for the drawing mode.
   * @returns A new Konva.Line instance
   */
  private createPreviewLine(): Konva.Line {
    return new Konva.Line({
      stroke: VisualStyle.PREVIEW_FILL as string,
      strokeWidth: VisualStyle.PREVIEW_STROKE_WIDTH as number,
      listening: false,
    });
  }

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
  private createDimension(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = VisualStyle.DIMENSION_COLOR as string,
  ): Konva.Group | null {
    const data = this.calculateDimensionData(x1, y1, x2, y2);
    if (!data) return null;

    const {
      dx,
      dy,
      length,
      nx,
      ny,
      sx,
      sy,
      ex,
      ey,
      midX,
      midY,
      angle,
      textPadding,
    } = data;

    const group = new Konva.Group({ name: NodeName.DIMENSION_GROUP, listening: true });

    const text = new Konva.Text({
      x: midX,
      y: midY,
      text: (length * (Config.KONVA_UNIT_TO_CM as number) * this.unit_conversion_factor).toFixed(1) + " " + "cm", //scaled and with dynamic unit suffix
      fontSize: VisualStyle.DIMENSION_FONT_SIZE as number,
      fontFamily: VisualStyle.DIMENSION_FONT_FAMILY as string,
      fill: color,
      rotation: angle,
      align: "center",
      verticalAlign: "middle",
      fontStyle: "bold",
      name: NodeName.DIMENSION_TEXT as string
    });

    // Center text around midpoint & rotation
    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);

    const gap = text.width() + textPadding;

    if (length > gap) {
      //unit vecter of the dimension line
      const ux = dx / length;
      const uy = dy / length;

      const gapStartDist = (length - gap) / 2;
      const gapEndDist = (length + gap) / 2;

      const gapStartX = sx + ux * gapStartDist;
      const gapStartY = sy + uy * gapStartDist;

      const gapEndX = sx + ux * gapEndDist;
      const gapEndY = sy + uy * gapEndDist;

      // Left dimension line
      const leftLine = new Konva.Line({
        points: [sx, sy, gapStartX, gapStartY], //start and end coordinates for first line
        stroke: color,
        strokeWidth: VisualStyle.DIMENSION_STROKE_WIDTH as number,
        name: NodeName.DIMENSION_LEFT_LINE as string,
      });

      // Right dimension line
      const rightLine = new Konva.Line({
        points: [gapEndX, gapEndY, ex, ey],
        stroke: color,
        strokeWidth: VisualStyle.DIMENSION_STROKE_WIDTH as number,
        name: NodeName.DIMENSION_RIGHT_LINE as string,
      });

      // Start arrow (outer only)
      const startArrow = new Konva.Arrow({
        points: [sx + ux * 10, sy + uy * 10, sx, sy],
        pointerLength: VisualStyle.DIMENSION_ARROW_SIZE as number,
        pointerWidth: VisualStyle.DIMENSION_ARROW_SIZE as number,
        fill: color,
        stroke: color,
        strokeWidth: VisualStyle.DIMENSION_STROKE_WIDTH as number,
        name: NodeName.START_ARROW as string,
      });

      // End arrow (outer only)
      const endArrow = new Konva.Arrow({
        points: [ex - ux * 10, ey - uy * 10, ex, ey],
        pointerLength: VisualStyle.DIMENSION_ARROW_SIZE as number,
        pointerWidth: VisualStyle.DIMENSION_ARROW_SIZE as number,
        fill: color,
        stroke: color,
        strokeWidth: VisualStyle.DIMENSION_STROKE_WIDTH as number,
        name: NodeName.END_ARROW as string,
      });

      group.add(leftLine, rightLine, startArrow, endArrow);
    }

    group.add(text);

    // Add perpendicular ticks at the ends
    const tickSize = VisualStyle.DIMENSION_TICK_SIZE as number;
    const startTick = new Konva.Line({
      points: [
        sx - nx * tickSize,
        sy - ny * tickSize,
        sx + nx * tickSize,
        sy + ny * tickSize,
      ],
      stroke: color,
      strokeWidth: VisualStyle.DIMENSION_TICK_STROKE_WIDTH as number,
      name: NodeName.START_TICK as string,
    });

    const endTick = new Konva.Line({
      points: [
        ex - nx * tickSize,
        ey - ny * tickSize,
        ex + nx * tickSize,
        ey + ny * tickSize,
      ],
      stroke: color,
      strokeWidth: VisualStyle.DIMENSION_TICK_STROKE_WIDTH as number,
      name: NodeName.END_TICK as string,
    });

    group.add(startTick, endTick);

    return group;
  }

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
  private calculateDimensionData(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    offset = Config.DIMENSION_OFFSET as number,
    textPadding = Config.DIMENSION_TEXT_PADDING as number,
  ) {
    const dx = x2 - x1; //horizantal distance
    const dy = y2 - y1; //vertical distance

    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < (Config.MIN_DIMENSION_LENGTH as number)) return null; // Don't draw dimensions for very small segments

    // Unit normal vector
    const nx = -dy / length;
    const ny = dx / length;

    // scale normal vecter by offset
    const ox = nx * offset;
    const oy = ny * offset;

    //shift walls start points
    const sx = x1 + ox;
    const sy = y1 + oy;
    //shift walls end point
    const ex = x2 + ox;
    const ey = y2 + oy;

    // Midpoint for text
    const midX = (sx + ex) / 2;
    const midY = (sy + ey) / 2;

    // Calculate rotation to keep text aligned with the line
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Ensure text is always readable (not upside down)
    if (angle > 90 || angle < -90) {
      angle += 180;
    }

    return {
      dx,
      dy,
      length,
      nx,
      ny,
      sx,
      sy,
      ex,
      ey,
      midX,
      midY,
      angle,
      textPadding,
    };
  }

  /**
   * Switches the interaction mode and cleans up temporary drawing helpers.
   * Also triggers the 'On2DModeChange' callback whenever the mode is activated
   * or deactivated, allowing consumers to react to mode updates.
   * @param mode The RoomEditorMode to set or toggle
   * @param active Whether to activate or deactivate the mode
   */
  public setMode(mode: RoomEditorMode, active: boolean, isExplicit: boolean = false) {
    if (active) {
      this.mode = mode;
      if (mode === RoomEditorMode.DRAW) {
        this.isDrawModeExplicitlyEnabled = isExplicit;
      }
    } else {
      this.mode = null;
    }

    this.lastPoint = null;
    this.deselectWall();
    this.deselectOpening();
    this.draggingEndpoint = null;
    this.clearHoveredEntity();

    if (this.On2DModeChange) {
      this.On2DModeChange(this.mode);
    }

    // update preview immediately if entering window mode
    if (this.mode === RoomEditorMode.WINDOW) {
      const worldPos = this.getWorldPointerPosition();
      if (worldPos) {
        this.updateWindowPreview(worldPos.x, worldPos.y);
      }
    }

    // Set cursor based on mode
    if (this.mode === RoomEditorMode.DRAW || this.mode === RoomEditorMode.WINDOW || this.mode === RoomEditorMode.DOOR) {
      this.stage.container().style.cursor = "crosshair";
    } else if (this.mode === RoomEditorMode.EDIT) {
      this.stage.container().style.cursor = "pointer";
    } else {
      this.stage.container().style.cursor = "default";
    }

    // Clean up drawing helpers when switching modes
    if (this.previewLine) this.previewLine.destroy();
    this.previewLine = null;
    if (this.previewDimension) this.previewDimension.destroy();
    this.previewDimension = null;

    // Hide window preview when not in window mode
    if (this.previewWindow) {
      this.previewWindow.visible(false);
      this.getLayer(NodeName.INTERACTION_LAYER)?.find(`.window-preview-dimension`).forEach(node => node.destroy());
    }

    // Hide door preview when not in door mode
    if (this.previewDoor) {
      this.previewDoor.visible(false);
      this.getLayer(NodeName.INTERACTION_LAYER)?.find(`.door-preview-dimension`).forEach(node => node.destroy());
    }

    // Restore all wall dimensions to visibility
    this.restoreWallDimensions();

    this.hideSnapIndicator();
    this.getLayer(NodeName.INTERACTION_LAYER)?.batchDraw();
  }

  /**
   * Selects a wall and highlights it.
   * @param wallGroup The wall group to select
   */
  private selectWall(wallGroup: Konva.Group, multiSelect: boolean = false) {

    this.deselectOpening();
    this.clearHoveredEntity();

    const index = this.selectedWallGroups.indexOf(wallGroup);

    if (multiSelect && index > -1) {
      const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (wallLine) wallLine.stroke(this.getDefaultWallStroke());
      this.selectedWallGroups.splice(index, 1);
      this.stage.batchDraw();
      return;
    } else if (!multiSelect) {
      if (this.selectedWallGroups.length === 1 && index > -1) return;
      this.deselectWall();
    }

    this.selectedWallGroups.push(wallGroup);
    const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    if (wallLine) {
      wallLine.stroke(VisualStyle.PREVIEW_STROKE as string);
    }
    this.stage.batchDraw();
  }

  /**
   * Deselects all the currently selected walls.
   */
  private deselectWall() {
    this.selectedWallGroups.forEach(group => {
      const wallLine = group.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (wallLine) {
        wallLine.stroke(this.getDefaultWallStroke());
      }
    });
    this.selectedWallGroups = [];
    this.stage.batchDraw();
  }

  /**
   * Sets the unit converison factor
   * @param cmValue The number of centimeters represented by one grid.
   */
  public setKonvaUnitScale(cmValue: number): void {


    this.unit_conversion_factor = cmValue / 30;    // 30 cm is the default grid size

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (floorplanLayer) {
      floorplanLayer.find(`.${NodeName.LINE_GROUP}`).forEach((group) => {
        const wallGroup = group as Konva.Group;
        const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
        if (wallLine) {
          const points = wallLine.points();
          const length = Math.hypot(points[2] - points[0], points[3] - points[1]);
          this.repositionOpeningsOnWall(wallGroup, length, length);
          this.resolveAndValidateOpeningsOnWall(wallGroup);
        }
      });
    }

    this.refreshDimensions();
    this.refreshWindows();
    this.refreshDoors();
    this.refreshPreviewWindow();
    this.refreshPreviewDoor();
  }

  /**
   * Repositions doors and windows on a wall such that the ratio of the distance of the door/window center
   * from the wall start to the wall end is maintained.
   */
  private repositionOpeningsOnWall(
    wallGroup: Konva.Group,
    oldLength: number,
    newLength: number,
    originalWindows?: WindowData[],
    originalDoors?: DoorData[]
  ): void {
    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (!userData) return;

    if (oldLength <= 0 || newLength <= 0) return;

    // Reposition Windows
    if (userData.windows) {
      userData.windows.forEach((window) => {
        const origWindow = originalWindows ? originalWindows.find(w => w.id === window.id) : null;
        const baseOffset = origWindow ? origWindow.offset : window.offset;
        const ratio = baseOffset / oldLength;
        const newOffset = ratio * newLength;
        const windowCanvasWidth = window.width / this.unit_conversion_factor;
        const halfWidth = windowCanvasWidth / 2;
        window.offset = Math.max(halfWidth, Math.min(newLength - halfWidth, newOffset));
      });
    }

    // Reposition Doors
    if (userData.doors) {
      userData.doors.forEach((door) => {
        const origDoor = originalDoors ? originalDoors.find(d => d.id === door.id) : null;
        const baseOffset = origDoor ? origDoor.offset : door.offset;
        const ratio = baseOffset / oldLength;
        const newOffset = ratio * newLength;
        const doorCanvasWidth = door.width / this.unit_conversion_factor;
        const halfWidth = doorCanvasWidth / 2;
        door.offset = Math.max(halfWidth, Math.min(newLength - halfWidth, newOffset));
      });
    }
  }

  /**
   * Overrides and validates positions of doors/windows on a wall:
   * 1. Sort openings from start to end by current offset.
   * 2. Ensure the first opening doesn't go beyond wall start.
   * 3. Reposition subsequent openings just after the previous to avoid overlaps.
   * 4. Delete any opening that goes beyond the wall endpoint.
   */
  private resolveAndValidateOpeningsOnWall(wallGroup: Konva.Group): void {
    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (!userData) return;

    const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    if (!wallLine) return;

    const points = wallLine.points();
    const length = Math.hypot(points[2] - points[0], points[3] - points[1]);
    if (length <= 0) return;

    // Combine windows and doors into a unified list
    const openings: Array<{
      type: "window" | "door";
      ref: WindowData | DoorData;
    }> = [];

    if (userData.windows) {
      userData.windows.forEach(w => openings.push({ type: "window", ref: w }));
    }
    if (userData.doors) {
      userData.doors.forEach(d => openings.push({ type: "door", ref: d }));
    }

    if (openings.length === 0) return;

    // Sort by current offset ascending
    openings.sort((a, b) => a.ref.offset - b.ref.offset);

    // 1. Process first opening — clamp to wall start
    const firstOpening = openings[0];
    const firstHalfWidth = (firstOpening.ref.width / this.unit_conversion_factor) / 2;
    if (firstOpening.ref.offset - firstHalfWidth < 0) {
      firstOpening.ref.offset = firstHalfWidth;
    }

    // 2. Process subsequent openings — push forward to prevent overlaps
    for (let i = 1; i < openings.length; i++) {
      const prev = openings[i - 1];
      const curr = openings[i];
      const prevHalfWidth = (prev.ref.width / this.unit_conversion_factor) / 2;
      const currHalfWidth = (curr.ref.width / this.unit_conversion_factor) / 2;

      const prevEnd = prev.ref.offset + prevHalfWidth;
      const currStart = curr.ref.offset - currHalfWidth;

      if (currStart < prevEnd) {
        // Reposition just after the previous opening
        curr.ref.offset = prevEnd + currHalfWidth;
      }
    }

    // 3. Delete any opening that partially or fully exceeds the wall endpoint
    const invalidIds = new Set<string>(
      openings
        .filter(o => o.ref.offset + (o.ref.width / this.unit_conversion_factor) / 2 > length)
        .map(o => o.ref.id)
    );

    if (invalidIds.size > 0) {
      if (userData.windows) {
        userData.windows = userData.windows.filter(w => !invalidIds.has(w.id));
      }
      if (userData.doors) {
        userData.doors = userData.doors.filter(d => !invalidIds.has(d.id));
      }
    }
  }

  /**
   * Refreshes all existing dimension labels on the floorplan.
   */
  private refreshDimensions() {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    // Find all dimension text nodes within the floorplan layer
    const dimensionTexts = floorplanLayer.find(`.${NodeName.DIMENSION_TEXT}`);

    dimensionTexts.forEach((node) => {
      if (node instanceof Konva.Text) {
        // Get the parent group to find the wall line
        const dimensionGroup = node.getParent();
        if (!dimensionGroup) return;

        const wallGroup = dimensionGroup.getParent();
        if (!wallGroup) return;

        const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
        if (!wallLine) return;

        const points = wallLine.points();
        const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        // update the text with new unit
        node.text((length * (Config.KONVA_UNIT_TO_CM as number) * this.unit_conversion_factor).toFixed(1) + " " + "cm");

        // Adjust offset if text width changed
        node.offsetX(node.width() / 2);
        node.offsetY(node.height() / 2);
      }
    });

    this.stage.batchDraw();
  }

  /**
   * Restores visibility for all wall dimensions in the floorplan layer.
   */
  private restoreWallDimensions() {
    this.getLayer(NodeName.FLOORPLAN_LAYER)?.find(`.${NodeName.DIMENSION_GROUP}`).forEach(node => {
      node.visible(true);
    });
    this.getLayer(NodeName.FLOORPLAN_LAYER)?.batchDraw();
  }

  /**
   * Re-renders all existing windows from their wall userData.
   */
  private refreshWindows() {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    floorplanLayer.find(`.${NodeName.LINE_GROUP}`).forEach((group) => {
      const wallGroup = group as Konva.Group;
      const userData = wallGroup.getAttr("userData") as WallUserData;
      if (userData?.windows) {
        this.renderWindows(wallGroup, userData);
      }
    });

    floorplanLayer.batchDraw();
  }

  /**
   * Re-renders all existing doors from their wall userData.
   */
  private refreshDoors() {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    floorplanLayer.find(`.${NodeName.LINE_GROUP}`).forEach((group) => {
      const wallGroup = group as Konva.Group;
      const userData = wallGroup.getAttr("userData") as WallUserData;
      if (userData?.doors) {
        this.renderDoors(wallGroup, userData);
      }
    });

    floorplanLayer.batchDraw();
  }

  /**
   * Renders the entire floorplan to the stage.
   */
  public draw() {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (floorplanLayer) {
      floorplanLayer.find(`.${NodeName.LINE_GROUP}`).forEach((group) => {
        const userData = group.getAttr("userData") as WallUserData;
        if (userData) {
          if (userData.windows) {
            this.renderWindows(group as Konva.Group, userData);
          }
          if (userData.doors) {
            this.renderDoors(group as Konva.Group, userData);
          }
        }
      });
      floorplanLayer.batchDraw();
    }
  }

  /**
   * Toggles the visibility of the background floorplan image.
   * @param show Whether to show the background image
   */
  public toggleBackgroundImage(show: boolean): void {
    if (show) {
      // Load image if not already loaded
      if (!this.backgroundRect.fillPatternImage()) this.setBackgroundImage();
      this.backgroundRect.visible(true);
      this.syncBackgroundToStage();
    } else {
      this.backgroundRect.visible(false);
    }
    this.getLayer(NodeName.BACKGROUND_LAYER)?.batchDraw();
  }

  /**
   * Creates a large grid for visual reference.
   */
  public createGrid() {
    this.gridGroup.destroyChildren();
    const width = this.stage.width();
    const height = this.stage.height();
    const gridSize = Config.GRID_SIZE as number;
    // Create a grid much larger than the stage to allow for panning
    const extentW = width * 10;
    const extentH = height * 10;
    const startX = -(extentW - width) / 2;
    const startY = -(extentH - height) / 2;
    const endX = startX + extentW;
    const endY = startY + extentH;

    // Draw vertical lines
    const firstX = Math.floor(startX / gridSize) * gridSize;
    for (let x = firstX; x <= endX; x += gridSize) {
      this.gridGroup.add(
        new Konva.Line({
          points: [x, startY, x, endY],
          stroke: VisualStyle.GRID_STROKE as string,
          strokeWidth: VisualStyle.GRID_STROKE_WIDTH as number,
          listening: false,
        }),
      );
    }
    // Draw horizontal lines
    const firstY = Math.floor(startY / gridSize) * gridSize;
    for (let y = firstY; y <= endY; y += gridSize) {
      this.gridGroup.add(
        new Konva.Line({
          points: [startX, y, endX, y],
          stroke: VisualStyle.GRID_STROKE as string,
          strokeWidth: VisualStyle.GRID_STROKE_WIDTH as number,
          listening: false,
        }),
      );
    }
    this.gridGroup.visible(true);
    this.getLayer(NodeName.GRID_LAYER)?.batchDraw();
  }

  /**
   * Enables or disables the grid visibility.
   * @param visible Whether the grid should be visible
   * @returns The current state of grid visibility
   */
  public enableGrid(visible: boolean): boolean {
    this.gridGroup.visible(visible);
    // If grid is enabled, hide the background image to avoid visual clutter
    if (visible) this.backgroundRect.visible(false);
    this.getLayer(NodeName.GRID_LAYER)?.batchDraw();
    this.getLayer(NodeName.BACKGROUND_LAYER)?.batchDraw();
    return visible;
  }

  /**
   * Enables or disables axis snapping (horizontal/vertical line snapping).
   * @param enabled Whether axis snapping should be enabled
   * @returns The current state of axis snapping
   */
  public activeSnapping(enabled: boolean): boolean {
    this.isAxisSnappingEnabled = enabled;
    return this.isAxisSnappingEnabled;
  }

  /**
   * Toggles the visibility of wall dimensions.
   * @param visible Whether dimensions should be visible
   * @returns The new visibility state of the dimensions.
   */
  public toggleDimensions(visible: boolean): boolean {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    floorplanLayer?.find(`.${NodeName.DIMENSION_GROUP}`).forEach((node) => {
      node.visible(visible);
    });
    floorplanLayer?.batchDraw();
    return visible;
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  public dispose() {
    this.resizeObserver.disconnect();
    this.stage.destroy();
    window.removeEventListener("mouseup", this.stopPanning);
  }

  /**
   * Detects internal rooms from the current layout.
   * @param wallData - Optional array of structured wall data. If not provided, it scans the floorplan layer.
   * @returns A promise resolving to the list of detected rooms.
   */
  private async detectRooms(wallData?: WallUserData[]): Promise<Room[]> {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return [];

    const rooms = RoomDetector.detectRooms(floorplanLayer, wallData);

    const fillLayer = this.getLayer(NodeName.ROOM_FILL_LAYER);
    const labelLayer = this.getLayer(NodeName.ROOM_LABEL_LAYER);

    if (fillLayer) RoomDetector.updateRoomFills(rooms, fillLayer);
    if (labelLayer) RoomDetector.updateRoomLabels(rooms, labelLayer);

    return rooms;
  }

  /**
   * Detects the outer boundary of the complete house.
   * @param wallData - Optional array of structured wall data.
   * @returns The house boundary room or null.
   */
  public async getHouseBoundary(wallData?: WallUserData[]): Promise<Room | null> {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return null;

    return RoomDetector.detectHouseBoundary(floorplanLayer, wallData);
  }

  /**
   * Exports the 2D floorplan layout, detected rooms, house boundaries, and unit scale.
   * @returns A promise resolving to the floorplan data.
   */
  public async get2ddata(): Promise<{ layer: any, rooms: any[], houseBoundary: Room | null, unit_conversion_factor: number }> {
    const layer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!layer) {
      return { layer: null, rooms: [], houseBoundary: null, unit_conversion_factor: this.unit_conversion_factor };
    } else {
      const rooms = await this.detectRooms();
      const houseBoundary = await this.getHouseBoundary();

      const jsonString = layer.toJSON();

      return {
        layer: JSON.parse(jsonString),
        rooms: rooms,
        houseBoundary: houseBoundary,
        unit_conversion_factor: this.unit_conversion_factor
      };
    }
  }

  /**
   * Renders windows for a specific wall group.
   * @param wallGroup The wall's Konva group
   * @param userData The wall's user data containing windows
   */
  private renderWindows(wallGroup: Konva.Group, userData: WallUserData) {
    //  Clear out any existing windows on this wall so we don't draw duplicates
    wallGroup.find(`.${NodeName.WINDOW_GROUP}`).forEach((node) => node.destroy());

    // Find the actual visual line that represents the wall
    const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    if (!wallLine) return;

    //  Get the starting and ending points of the wall line
    const points = wallLine.points();
    const x1 = points[0],
      y1 = points[1],
      x2 = points[2],
      y2 = points[3];

    //  Calculate the wall's total horizontal (dx) and vertical (dy) distance
    const dx = x2 - x1,
      dy = y2 - y1;

    //  Calculate the total physical length of the wall
    const length = Math.sqrt(dx * dx + dy * dy);

    //  Calculate the angle (in degrees) so windows can be rotated to match the wall
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    // If this wall has no window data saved, there's nothing else to do
    if (!userData.windows) return;

    // Loop through every saved window for this wall and draw it
    userData.windows.forEach((window) => {
      // Create a container group for the window
      // Position it exactly at the saved offset along the wall line
      const windowGroup = new Konva.Group({
        name: NodeName.WINDOW_GROUP,
        x: x1 + (window.offset / length) * dx,
        y: y1 + (window.offset / length) * dy,
        rotation: angle,
        entityId: window.id,
      });

      // Create the visual rectangle that represents the window
      const rect = new Konva.Rect({
        x: -(window.width / this.unit_conversion_factor) / 2, // Center the rectangle horizontally
        y: -(VisualStyle.WALL_STROKE_WIDTH as number) / 2, // Center the rectangle vertically over the wall line
        width: window.width / this.unit_conversion_factor, // Set custom window width
        height: VisualStyle.WALL_STROKE_WIDTH as number, // Match the wall's thickness
        fill: VisualStyle.WINDOW_FILL as string, // Background color
        stroke: VisualStyle.WINDOW_STROKE as string, // Border color
        strokeWidth: VisualStyle.WINDOW_STROKE_WIDTH as number,
        name: NodeName.WINDOW,
      });

      // Add the rectangle to its container group
      windowGroup.add(rect);
      //create dimensions for window and render it
      this.renderOpeningDimensions(windowGroup, window.offset, length, VisualStyle.WINDOW_STROKE as string);
      // Add the window container to the main wall group so they move together
      wallGroup.add(windowGroup);
    });
  }

  /**
   * Finds a wall group under the specified world coordinates.
   * @param x World X coordinate of the mouse pointer
   * @param y World Y coordinate of the mouse pointer
   * @returns The wall group and line if found, or null
   */
  private getWallUnderPointer(): { wallGroup: Konva.Group; wallLine: Konva.Line } | null {
    // Get the floorplan layer
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return null;

    // Use the actual pointer position on the stage (Screen/Pixel coordinates)
    const pointerPos = this.stage.getPointerPosition();
    if (!pointerPos) return null;

    const shape = floorplanLayer.getIntersection(pointerPos);

    //  If a shape was found and it's a wall line, return its group and the line itself
    if (shape && shape instanceof Konva.Line && shape.name() === NodeName.WALL) {
      return {
        wallGroup: shape.getParent() as Konva.Group,
        wallLine: shape
      };
    }

    return null;
  }

  /**
   * Updates the visual preview of a door being placed.
   * @param x World X coordinate of the mouse pointer
   * @param y World Y coordinate of the mouse pointer
   */
  private updateDoorPreview(x: number, y: number) {
    const wallInfo = this.getWallUnderPointer();

    if (wallInfo) {
      // Hide the current wall's total dimension to avoid overlap
      wallInfo.wallGroup.findOne(`.${NodeName.DIMENSION_GROUP}`)?.visible(false);

      const { wallLine } = wallInfo;
      const points = wallLine.points();
      const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
      const dx = x2 - x1, dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);
      const doorWidth = Config.DEFAULT_DOOR_WIDTH as number;
      const doorCanvasWidth = this.getOpeningCanvasWidth(doorWidth);
      const halfWidth = doorCanvasWidth / 2;
      const offset = Math.max(halfWidth, Math.min(length - halfWidth, t * length));

      if (this.previewDoor) {
        this.previewDoor.x(x1 + (offset / length) * dx);
        this.previewDoor.y(y1 + (offset / length) * dy);
        this.previewDoor.rotation(angle);

        const isOverlapping = this.isItemOverlapping(
          wallInfo.wallGroup.getAttr("userData") as WallUserData,
          offset,
          doorCanvasWidth
        );

        const previewBg = this.previewDoor.findOne(`.${NodeName.DOOR}`) as Konva.Rect;
        const previewLeaf = this.previewDoor.findOne(`.${NodeName.DOOR_LEAF}`) as Konva.Line;
        const previewSwing = this.previewDoor.findOne(`.${NodeName.DOOR_SWING}`) as Konva.Arc;

        if (previewBg) {
          previewBg.fill(isOverlapping ? VisualStyle.DOOR_ERROR_FILL as string : VisualStyle.DOOR_FILL as string);
        }
        if (previewLeaf) {
          previewLeaf.stroke(isOverlapping ? VisualStyle.DOOR_ERROR_STROKE as string : VisualStyle.DOOR_STROKE as string);
        }
        if (previewSwing) {
          previewSwing.stroke(isOverlapping ? VisualStyle.DOOR_ERROR_STROKE as string : VisualStyle.DOOR_STROKE as string);
        }

        this.previewDoor.visible(true);
      }

      // update Dimension Previews for the door
      const interactionLayer = this.getLayer(NodeName.INTERACTION_LAYER);
      if (interactionLayer) {
        // Clear old dimension previews
        interactionLayer.find(`.door-preview-dimension`).forEach(node => node.destroy());

        // distance from wall startpoint to nearer door edge 
        const startOffset = offset - doorCanvasWidth / 2;
        // distance from wall startpoint to farther door edge 
        const endOffset = offset + doorCanvasWidth / 2;

        // wall unit vector along x
        const ux = dx / length;
        // wall unit vector along y
        const uy = dy / length;

        const doorStartX = x1 + startOffset * ux;
        const doorStartY = y1 + startOffset * uy;
        const doorEndX = x1 + endOffset * ux;
        const doorEndY = y1 + endOffset * uy;

        const doorMidX = (doorStartX + doorEndX) / 2;
        const doorMidY = (doorStartY + doorEndY) / 2;

        if (startOffset > 5) {
          const dimStart = this.createDimension(
            x1, y1, doorMidX, doorMidY,
            VisualStyle.DOOR_STROKE as string
          );
          if (dimStart) {
            dimStart.name("door-preview-dimension");
            interactionLayer.add(dimStart);
          }
        }

        if (length - endOffset > 5) {
          const dimEnd = this.createDimension(
            doorMidX, doorMidY, x2, y2,
            VisualStyle.DOOR_STROKE as string
          );
          if (dimEnd) {
            dimEnd.name("door-preview-dimension");
            interactionLayer.add(dimEnd);
          }
        }
        interactionLayer.batchDraw();
      }
    } else {
      if (this.previewDoor) this.previewDoor.visible(false);
      this.getLayer(NodeName.INTERACTION_LAYER)?.find(`.door-preview-dimension`).forEach(node => node.destroy());
      // Restore all wall dimensions to visibility
      this.restoreWallDimensions();
    }
    this.getLayer(NodeName.INTERACTION_LAYER)?.batchDraw();
  }

  /**
   * Renders doors for a specific wall group.
   * @param wallGroup The wall's Konva group
   * @param userData The wall's user data containing doors
   */
  private renderDoors(wallGroup: Konva.Group, userData: WallUserData) {
    let doorGroup = wallGroup.findOne(`.${NodeName.DOOR_GROUP}`) as Konva.Group;
    if (!doorGroup) {
      doorGroup = new Konva.Group({ name: NodeName.DOOR_GROUP });
      wallGroup.add(doorGroup);
    }
    doorGroup.destroyChildren();

    if (!userData.doors) return;

    const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    const points = wallLine.points();
    const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
    const dx = x2 - x1, dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    userData.doors.forEach((door) => {
      const doorInstanceGroup = new Konva.Group({
        x: x1 + (door.offset / length) * dx,
        y: y1 + (door.offset / length) * dy,
        rotation: angle,
        name: NodeName.DOOR_GROUP,
        entityId: door.id,
      });
      // Bounding box for door 
      const bboxDoor = new Konva.Rect({
        x: -(door.width / this.unit_conversion_factor) / 2,
        y: -(door.width / this.unit_conversion_factor),
        width: door.width / this.unit_conversion_factor,
        height: (door.width / this.unit_conversion_factor),
        fill: 'transparent',
        name: NodeName.DOOR_BBOX,
        listening: true
      });
      doorInstanceGroup.add(bboxDoor);
      //  Background Rect (to "cut" the wall)
      doorInstanceGroup.add(
        new Konva.Rect({
          x: -(door.width / this.unit_conversion_factor) / 2,
          y: -(VisualStyle.WALL_STROKE_WIDTH as number) / 2,
          width: door.width / this.unit_conversion_factor,
          height: VisualStyle.WALL_STROKE_WIDTH as number,
          fill: VisualStyle.DOOR_FILL as string,
          name: NodeName.DOOR
        })
      );

      //  Door Leaf
      doorInstanceGroup.add(
        new Konva.Line({
          points: [-(door.width / this.unit_conversion_factor) / 2, 0, -(door.width / this.unit_conversion_factor) / 2 + (door.width / this.unit_conversion_factor) * Math.cos(Math.PI / 4), -(door.width / this.unit_conversion_factor) * Math.sin(Math.PI / 4)],
          stroke: VisualStyle.DOOR_STROKE as string,
          strokeWidth: VisualStyle.DOOR_STROKE_WIDTH as number,
          name: NodeName.DOOR_LEAF
        })
      );

      //  Swing Arc
      doorInstanceGroup.add(
        new Konva.Arc({
          x: -(door.width / this.unit_conversion_factor) / 2,
          y: 0,
          innerRadius: 0,
          outerRadius: (door.width / this.unit_conversion_factor),
          angle: 45,
          rotation: -45,
          stroke: VisualStyle.DOOR_STROKE as string,
          strokeWidth: 1,
          dash: [5, 5],
          name: NodeName.DOOR_SWING
        })
      );
      //create dimensions for the door and render it
      this.renderOpeningDimensions(doorInstanceGroup, door.offset, length, VisualStyle.DOOR_STROKE as string);
      doorGroup.add(doorInstanceGroup);
    });
  }

  /**
   * Checks if a potential wall segment (x1, y1)-(x2, y2) overlaps an existing wall.
   * Only detects collinear overlaps.
   */
  private isWallOverlapping(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    ignoredGroup?: Konva.Group
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;

    // square of the length of the new wall segment
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) return false;    // if close to zero return

    // length of the new wall segment
    const len = Math.sqrt(lenSq);

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return false;

    const children = floorplanLayer.getChildren();
    const tolerance = 5.0; // Tolerance for endpoint matching and slope issues

    for (const child of children) {
      if (ignoredGroup && child === ignoredGroup) continue;
      if (child instanceof Konva.Group) {
        const wall = child.findOne(`.${NodeName.WALL}`) as Konva.Line;
        if (wall) {
          const points = wall.points();
          if (points.length >= 4) {
            const wx1 = points[0],
              wy1 = points[1],
              wx2 = points[2],
              wy2 = points[3];

            // Calculate distance of existing endpoints from the new line (x1, y1)-(x2, y2)
            const dist1 = Math.abs(dy * wx1 - dx * wy1 + x2 * y1 - y2 * x1) / len;
            const dist2 = Math.abs(dy * wx2 - dx * wy2 + x2 * y1 - y2 * x1) / len;


            // t1 and t2 tell you where an existing line starts and ends relative to current drawn line. overlapStartT and overlapEndT find the part where they both exist at the same time. overlapPixels is the actual length of that "double-drawn" section in millimeters.
            if (dist1 < tolerance && dist2 < tolerance) {
              //  project the existing wall endpoints onto the new wall's T-parameter [0, 1]
              const t1 = ((wx1 - x1) * dx + (wy1 - y1) * dy) / lenSq;
              const t2 = ((wx2 - x1) * dx + (wy2 - y1) * dy) / lenSq;

              const overlapStartT = Math.max(0, Math.min(t1, t2));
              const overlapEndT = Math.min(1, Math.max(t1, t2));

              const overlapPixels = (overlapEndT - overlapStartT) * len;
              // If the overlap exceeds the tolerance, we consider it a duplicate/overlapping wall
              if (overlapPixels > tolerance) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

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
  private isWallThroughOpening(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    ignoredGroup?: Konva.Group
  ): boolean {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return false;

    const children = floorplanLayer.getChildren();

    for (const child of children) {
      if (ignoredGroup && child === ignoredGroup) continue;
      if (!(child instanceof Konva.Group)) continue;

      const wall = child.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (!wall) continue;

      const userData = child.getAttr("userData") as WallUserData;
      if (!userData) continue;

      for (const door of userData.doors || []) {
        if (this.isWallThroughDoor(x1, y1, x2, y2, wall, door)) {
          return true;
        }
      }

      for (const window of userData.windows || []) {
        if (this.isWallThroughWindow(x1, y1, x2, y2, wall, window)) {
          return true;
        }
      }
    }

    return false;
  }

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
  private isWallThroughDoor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    wall: Konva.Line,
    door: DoorData
  ): boolean {
    const points = wall.points();

    if (points.length < 4) return false;

    const wx1 = points[0];
    const wy1 = points[1];
    const wx2 = points[2];
    const wy2 = points[3];

    const wdx = wx2 - wx1;
    const wdy = wy2 - wy1;

    const wallLenSq = wdx * wdx + wdy * wdy;

    if (wallLenSq < 1e-6) return false;

    const wallLen = Math.sqrt(wallLenSq);

    const ux = wdx / wallLen;
    const uy = wdy / wallLen;

    const nx = -uy;
    const ny = ux;

    const W = this.getOpeningCanvasWidth(door.width);
    const WALL_H = VisualStyle.WALL_STROKE_WIDTH as number;
    const SIN45 = Math.SQRT1_2;

    const doorCx = wx1 + ux * door.offset;
    const doorCy = wy1 + uy * door.offset;

    const localCenterY =
      (-W * SIN45 + WALL_H / 2) / 2;

    const obbCx = doorCx + nx * localCenterY;
    const obbCy = doorCy + ny * localCenterY;

    const obbWidth = W;
    const obbHeight = W * SIN45 + WALL_H / 2;

    return this.isLineIntersectingOBB(x1, y1, x2, y2, obbCx, obbCy, ux, uy, obbWidth, obbHeight);
  }

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
  private isWallThroughWindow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    wall: Konva.Line,
    window: WindowData
  ): boolean {
    const points = wall.points();

    if (points.length < 4) return false;

    const wx1 = points[0];
    const wy1 = points[1];
    const wx2 = points[2];
    const wy2 = points[3];

    const wdx = wx2 - wx1;
    const wdy = wy2 - wy1;

    const wallLenSq = wdx * wdx + wdy * wdy;

    if (wallLenSq < 1e-6) return false;

    const wallLen = Math.sqrt(wallLenSq);

    const ux = wdx / wallLen;
    const uy = wdy / wallLen;

    const winCx = wx1 + ux * window.offset;
    const winCy = wy1 + uy * window.offset;

    return this.isLineIntersectingOBB(x1, y1, x2, y2, winCx, winCy, ux, uy, this.getOpeningCanvasWidth(window.width), VisualStyle.WALL_STROKE_WIDTH as number);
  }

  /**
   * Checks if a line segment (x1,y1)-(x2,y2) intersects an Oriented Bounding Box (OBB).
   * The OBB is centred at (cx, cy) with local X-axis (ux, uy) and local Y-axis (-uy, ux).
   * width and height are the FULL extents (not half).
   */
  private isLineIntersectingOBB(
    x1: number, y1: number,
    x2: number, y2: number,
    cx: number, cy: number,
    ux: number, uy: number,
    width: number, height: number
  ): boolean {
    const nx = -uy;
    const ny = ux;
    const hw = width / 2;
    const hh = height / 2;

    const corners = [
      { x: cx + ux * hw + nx * hh, y: cy + uy * hw + ny * hh },
      { x: cx - ux * hw + nx * hh, y: cy - uy * hw + ny * hh },
      { x: cx - ux * hw - nx * hh, y: cy - uy * hw - ny * hh },
      { x: cx + ux * hw - nx * hh, y: cy + uy * hw - ny * hh },
    ];

    //  Does the new wall cross any of the 4 OBB edges
    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      const hit = this.getLineSegmentIntersection(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y);
      if (hit && hit.t2 > 0.01 && hit.t2 < 0.99) return true;
    }

    //  Is either endpoint of the new wall inside the OBB
    const inside = (px: number, py: number) => {
      const dx = px - cx, dy = py - cy;
      return Math.abs(dx * ux + dy * uy) <= hw
        && Math.abs(dx * nx + dy * ny) <= hh;
    };

    return inside(x1, y1) || inside(x2, y2);
  }

  /**
   * Calculates the mathematical intersection point between two line segments.
   */
  private getLineSegmentIntersection(
    p0x: number, p0y: number,
    p1x: number, p1y: number,
    p2x: number, p2y: number,
    p3x: number, p3y: number
  ): { x: number, y: number, t1: number, t2: number } | null {
    const s1x = p1x - p0x;
    const s1y = p1y - p0y;
    const s2x = p3x - p2x;
    const s2y = p3y - p2y;

    const denominator = -s2x * s1y + s1x * s2y;

    // If denominator is 0, lines are parallel
    if (Math.abs(denominator) < 1e-6) return null;

    const s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / denominator;
    const t = (s2x * (p0y - p2y) - s2y * (p0x - p2x)) / denominator;

    // Use a small tolerance for snapping inaccuracies
    if (s >= -1e-6 && s <= 1 + 1e-6 && t >= -1e-6 && t <= 1 + 1e-6) {
      return {
        x: p0x + (t * s1x),
        y: p0y + (t * s1y),
        t1: Math.max(0, Math.min(1, t)),
        t2: Math.max(0, Math.min(1, s))
      };
    }

    return null;
  }

  /**
   * Checks if a new placement (window or door) overlaps with any existing items on a wall.
   * @param userData The wall's user data
   * @param newOffset The offset along the wall line for the new item
   * @param newWidth The width of the new item
   * @param excludeId Optional ID of the item to ignore when checking overlap
   * @returns boolean true if overlapping, false otherwise
   */
  private isItemOverlapping(userData: WallUserData, newOffset: number, newWidth: number, excludeId?: string): boolean {
    const items = [...(userData.windows || []), ...(userData.doors || [])];
    const newStart = newOffset - newWidth / 2;
    const newEnd = newOffset + newWidth / 2;

    if (items.length > 0) {
      for (const item of items) {
        if (excludeId && item.id === excludeId) continue;

        const itemCanvasWidth = this.getOpeningCanvasWidth(item.width);
        const existingStart = item.offset - itemCanvasWidth / 2;
        const existingEnd = item.offset + itemCanvasWidth / 2;

        if (newStart < existingEnd - 1 && newEnd > existingStart + 1) {
          return true;
        }
      }
    }

    // Check against wall intersections
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (floorplanLayer && userData.startPoint && userData.endPoint) {
      const p1x = userData.startPoint.x;
      const p1y = userData.startPoint.y;
      const p2x = userData.endPoint.x;
      const p2y = userData.endPoint.y;
      const wallLen = Math.hypot(p2x - p1x, p2y - p1y);
      const wallThickness = Config.WALL_THICKNESS as number;

      for (const node of floorplanLayer.find(`.${NodeName.LINE_GROUP}`)) {
        const group = node as Konva.Group;
        const otherUserData = group.getAttr("userData") as WallUserData;
        if (!otherUserData || otherUserData.id === userData.id) continue;
        if (!otherUserData.startPoint || !otherUserData.endPoint) continue;

        const p3x = otherUserData.startPoint.x;
        const p3y = otherUserData.startPoint.y;
        const p4x = otherUserData.endPoint.x;
        const p4y = otherUserData.endPoint.y;

        const intersection = this.getLineSegmentIntersection(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y);
        if (intersection) {
          if (this.isEndpointIntersection(intersection.t1, intersection.t2)) {
            continue;
          }

          const intersectionOffset = intersection.t1 * wallLen;

          const dx1 = p2x - p1x;
          const dy1 = p2y - p1y;
          const dx2 = p4x - p3x;
          const dy2 = p4y - p3y;
          const len1 = Math.hypot(dx1, dy1);
          const len2 = Math.hypot(dx2, dy2);

          let crossProduct = Math.abs((dx1 / len1) * (dy2 / len2) - (dy1 / len1) * (dx2 / len2));
          if (crossProduct < 0.1) crossProduct = 0.1;

          const intersectionWidth = wallThickness / crossProduct;
          const intersectionStart = intersectionOffset - intersectionWidth / 2;
          const intersectionEnd = intersectionOffset + intersectionWidth / 2;

          if (newStart < intersectionEnd - 1 && newEnd > intersectionStart + 1) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Draws the layout based on the provided JSON data.
   * @param jsonData The JSON object containing detections with drawing points for walls.
   */
  public drawFromJson(jsonData: any) {
    if (!jsonData || !jsonData.detections) {
      return;
    }

    const detections = jsonData.detections;

    let i = 0;

    detections.forEach((detection: any) => {
      if (detection.label === "Wall" && detection.drawing_points) {
        const points = detection.drawing_points;
        if (points.length >= 2) {
          const x1 = points[0].x;
          const y1 = points[0].y;
          const x2 = points[1].x;
          const y2 = points[1].y;

          const wallGroup = this.floorplan.newWall(x1, y1, x2, y2);
          i++;

          // Create permanent dimension for the new wall
          const dimension = this.createDimension(
            x1,
            y1,
            x2,
            y2,
            VisualStyle.DIMENSION_COLOR as string,
          );

          if (dimension) {
            wallGroup.add(dimension);
          }
        }
      }
    });

    this.draw(); // Ensure walls are rendered before detection
    this.detectRooms();

    // Process doors and windows after drawing walls
    detections.forEach((detection: any) => {
      if (detection.label === "Door" || detection.label === "Window") {
        let attachX = 0, attachY = 0, itemWidth = 0;

        if ((detection.label === "Window" || detection.label === "Door") && detection.drawing_points && detection.drawing_points.length >= 2) {
          const pt1 = detection.drawing_points[0];
          const pt2 = detection.drawing_points[1];
          attachX = (pt1.x + pt2.x) / 2;
          attachY = (pt1.y + pt2.y) / 2;
          itemWidth = Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);      // euclidean distance between 2 drawing points
        } else if (detection.label === "Door" && detection.drawing_point) {
          attachX = detection.drawing_point.x;
          attachY = detection.drawing_point.y;
          if (detection.bbox) {
            itemWidth = Math.max(detection.bbox.x2 - detection.bbox.x1, detection.bbox.y2 - detection.bbox.y1);
          } else {
            itemWidth = Config.DEFAULT_DOOR_WIDTH as number;
          }
        } else {
          return; // Skip if no proper drawing points
        }

        const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
        if (!floorplanLayer) return;

        let closestWallGroup: Konva.Group | null = null;
        let minDistance = Infinity;
        let closestOffset = 0;
        let closestLength = 0;

        for (const node of floorplanLayer.find(`.${NodeName.LINE_GROUP}`)) {
          const group = node as Konva.Group;
          const wallLine = group.findOne(`.${NodeName.WALL}`) as Konva.Line;
          if (wallLine) {
            const points = wallLine.points();
            const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
            const dx = x2 - x1, dy = y2 - y1;
            const lengthSq = dx * dx + dy * dy;
            if (lengthSq === 0) continue;
            const length = Math.sqrt(lengthSq);

            let t = ((attachX - x1) * dx + (attachY - y1) * dy) / lengthSq;    // t represents where the perpendicular projection of the target point falls along the infinite line containing the wall
            t = Math.max(0, Math.min(1, t));                                   // ensures the projected point is restricted to the finite wall segment

            // The coordinates of the closest point on the wall segment.
            const projX = x1 + t * dx;
            const projY = y1 + t * dy;

            const dist = Math.hypot(attachX - projX, attachY - projY);

            // Give a reasonable tolerance for snapping
            if (dist < minDistance && dist < 100) {
              minDistance = dist;
              closestWallGroup = group as Konva.Group;
              closestOffset = t * length;
              closestLength = length;      // wall length of the closest wall
            }
          }
        }

        if (closestWallGroup) {
          const userData = closestWallGroup.getAttr("userData") as WallUserData;
          if (!userData) return;

          const halfWidth = itemWidth / 2;
          const offset = Math.max(halfWidth, Math.min(closestLength - halfWidth, closestOffset));

          const isOverlapping = this.isItemOverlapping(userData, offset, itemWidth);

          if (!isOverlapping) {
            if (detection.label === "Window") {
              if (!userData.windows) userData.windows = [];
              userData.windows.push({ id: uuidv4(), offset: offset, width: itemWidth });
            } else if (detection.label === "Door") {
              if (!userData.doors) userData.doors = [];
              userData.doors.push({ id: uuidv4(), offset: offset, width: itemWidth });
            }
          }
        }
      }
    });

    // Center and scale the layout in the canvas if valid points were found
    this.fitLayout();

    // Redraw to render the newly attached windows and doors
    this.draw();
  }

  /**
   * Automatically scales and centers the drawing to fit the canvas view.
   */
  public fitLayout() {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer || floorplanLayer.children.length === 0) return;

    const box = floorplanLayer.getClientRect({ skipTransform: true }); //returns the bounding rectangle of all shapes inside the layer
    if (box.width === 0 && box.height === 0) return;

    const minX = box.x;
    const minY = box.y;
    const maxX = box.x + box.width;
    const maxY = box.y + box.height;

    //total width and height of the floorplan
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;

    const stageWidth = this.stage.width();
    const stageHeight = this.stage.height();

    // Calculate scale to fit the layout within 60% of the canvas (leaving 20% padding on all sides)
    const padding = 0.6;
    const scaleX = (stageWidth * padding) / bboxWidth;
    const scaleY = (stageHeight * padding) / bboxHeight;

    // Choose the smaller scale to guarantee it fits on both axes
    const scale = Math.min(scaleX, scaleY);

    // Apply the new zoom level
    this.stage.scale({ x: scale, y: scale });

    // Calculate the center of the drawing area and the stage
    const bboxCenterX = minX + bboxWidth / 2;
    const bboxCenterY = minY + bboxHeight / 2;

    const stageCenterX = stageWidth / 2;
    const stageCenterY = stageHeight / 2;

    // Determine the precise offset to align the centers considering the scale
    const offsetX = stageCenterX - (bboxCenterX * scale);
    const offsetY = stageCenterY - (bboxCenterY * scale);

    // Reposition the stage
    this.stage.position({ x: offsetX, y: offsetY });

    // Ensure wall hit areas stay clickable even if scaled out
    if (floorplanLayer) {
      floorplanLayer.find(`.${NodeName.WALL}`).forEach((wall) => {
        wall.setAttr("hitStrokeWidth", 20 / scale);
      });
    }

    // Sync background and redraw
    this.syncBackgroundToStage();
    this.stage.batchDraw();
  }

  /**
 * Deletes the currently selected entity.
 * Supports selected walls, window, and door.
 */
  public deleteSelectedEntity() {
    // Delete selected wall
    if (this.selectedWallGroups.length !== 0) {
      this.selectedWallGroups.forEach(group => group.destroy());
      this.selectedWallGroups = [];

      this.draw();
      this.detectRooms();
      this.stage.batchDraw();
      return;
    }

    // Delete selected window or door
    if (this.selectedOpening) {
      const { type, group } = this.selectedOpening;

      const wallGroup =
        type === "window"
          ? (group.getParent() as Konva.Group)
          : (group.getParent()?.getParent() as Konva.Group);

      const userData = wallGroup?.getAttr("userData") as WallUserData | undefined;

      if (userData) {
        if (type === "window") {
          const windowId = group.getAttr("entityId") as string | undefined;

          if (windowId) {
            userData.windows = (userData.windows || []).filter(
              (window) => window.id !== windowId,
            );
          }
        }

        if (type === "door") {
          const doorId = group.getAttr("entityId") as string | undefined;

          if (doorId) {
            userData.doors = (userData.doors || []).filter(
              (door) => door.id !== doorId,
            );
          }
        }
      }
      wallGroup?.findOne(`.${NodeName.DIMENSION_GROUP}`)?.visible(true);

      group.destroy();
      this.selectedOpening = null;

      this.draw();
      this.detectRooms();
      this.stage.batchDraw();
    }
  }

  /**
   * Clears all 2D drawings from the canvas.
   */
  public clearAll(): void {
    if (this.selectedWallGroups.length > 0) {
      this.deselectWall();
    }

    this.getLayer(NodeName.FLOORPLAN_LAYER)?.destroyChildren();
    this.getLayer(NodeName.ROOM_FILL_LAYER)?.destroyChildren();
    this.getLayer(NodeName.ROOM_LABEL_LAYER)?.destroyChildren();

    this.lastPoint = null;
    this.draw();
  }

  /**
   * Get opening under pointer.
   *
   * @returns {} Description of return value.
   */
  private getOpeningUnderPointer():
    | { openingGroup: Konva.Group; type: "window" | "door"; wallGroup: Konva.Group }
    | null {

    // get floorplan layer
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return null;

    // get pointer position
    const pointerPos = this.stage.getPointerPosition();
    if (!pointerPos) return null;

    // get the shape under the pointer
    const shape = floorplanLayer.getIntersection(pointerPos);
    if (!shape) return null;

    if (shape.name() === NodeName.WINDOW) {
      const openingGroup = shape.getParent() as Konva.Group;
      // get parent wall group
      const wallGroup = openingGroup?.getParent() as Konva.Group;

      if (openingGroup && wallGroup) {
        return { openingGroup, type: "window", wallGroup };
      }
    }

    const isDoorShape =
      shape.name() === NodeName.DOOR ||
      shape.name() === NodeName.DOOR_LEAF ||
      shape.name() === NodeName.DOOR_SWING;

    if (isDoorShape) {
      const openingGroup = shape.getParent() as Konva.Group;
      const doorContainer = openingGroup?.getParent() as Konva.Group;
      const wallGroup = doorContainer?.getParent() as Konva.Group;

      if (openingGroup && wallGroup) {
        return { openingGroup, type: "door", wallGroup };
      }
    }

    return null;
  }

  /**
   * Select opening.
   *
   * @param {Konva.Group} openingGroup - Parameter description.
   * @param {"window" | "door"} type - Parameter description.
   * @returns {void}
   */
  private selectOpening(openingGroup: Konva.Group, type: "window" | "door") {
    if (this.selectedOpening?.group === openingGroup) return;

    this.clearHoveredEntity();
    this.deselectWall();
    this.deselectOpening();

    this.selectedOpening = {
      type,
      group: openingGroup,
    };

    this.applyEntityStyle(type, openingGroup, "selected");
    openingGroup.findOne(`.${NodeName.OPENING_DIMENSION_GROUP}`)?.show();
    const wallGroup = this.getWallGroupForOpening(openingGroup, type);
    wallGroup?.findOne(`.${NodeName.DIMENSION_GROUP}`)?.visible(false);
    this.stage.batchDraw();
  }

  /**
   * Deselect opening.
   *
   * @returns {void}
   */
  private deselectOpening() {
    if (!this.selectedOpening) return;

    const { type, group } = this.selectedOpening;

    this.applyEntityStyle(type, group, "normal");
    group.findOne(`.${NodeName.OPENING_DIMENSION_GROUP}`)?.hide();

    const wallGroup = this.getWallGroupForOpening(group, type);
    wallGroup?.findOne(`.${NodeName.DIMENSION_GROUP}`)?.visible(true);

    this.selectedOpening = null;
    this.stage.batchDraw();
  }

  /**
   * update hover highlight.
   *
   * @returns {void}
   */
  private updateHoverHighlight() {
    const openingInfo = this.getOpeningUnderPointer();

    if (openingInfo) {
      this.setHoveredEntity({
        type: openingInfo.type,
        group: openingInfo.openingGroup,
      });
      return;
    }

    const wallInfo = this.getWallUnderPointer();

    if (wallInfo) {
      this.setHoveredEntity({
        type: "wall",
        group: wallInfo.wallGroup,
      });
      return;
    }

    this.clearHoveredEntity();
  }

  /**
   * Sets the specified entity as hovered and updates its style.
   *
   * @param entity - The hovered entity object (wall, window, or door).
   */
  private setHoveredEntity(
    entity:
      | { type: "wall"; group: Konva.Group }
      | { type: "window"; group: Konva.Group }
      | { type: "door"; group: Konva.Group },
  ) {
    if (
      this.hoveredEntity &&
      this.hoveredEntity.type === entity.type &&
      this.hoveredEntity.group === entity.group
    ) {
      return;
    }

    this.clearHoveredEntity();
    this.hoveredEntity = entity;

    if (this.isEntitySelected(entity.type, entity.group)) {
      return;
    }

    this.applyEntityStyle(entity.type, entity.group, "hover");
    this.stage.batchDraw();
  }

  /**
   * Clear hovered entity.
   *
   * @returns {void}
   */
  private clearHoveredEntity() {
    if (!this.hoveredEntity) return;

    const { type, group } = this.hoveredEntity;

    if (!this.isEntitySelected(type, group)) {
      this.applyEntityStyle(type, group, "normal");
    }

    this.hoveredEntity = null;
    this.stage.batchDraw();
  }

  /**
   * Checks if the given entity is currently selected.
   *
   * @param type - The type of the entity ("wall" | "window" | "door").
   * @param group - The Konva.Group associated with the entity.
   * @returns `true` if the entity is selected, `false` otherwise.
   */
  private isEntitySelected(
    type: "wall" | "window" | "door",
    group: Konva.Group,
  ): boolean {
    if (type === "wall") {
      return this.selectedWallGroups.includes(group);
    }

    return (
      this.selectedOpening?.type === type &&
      this.selectedOpening.group === group
    );
  }

  /**
   * Applies styling properties to a wall or opening based on its current interaction state.
   *
   * @param type - The entity type ("wall" | "window" | "door").
   * @param group - The Konva.Group representing the entity.
   * @param state - The visual state to apply ("normal" | "hover" | "selected").
   */
  private applyEntityStyle(
    type: "wall" | "window" | "door",
    group: Konva.Group,
    state: "normal" | "hover" | "selected",
  ) {
    const hoverColor = VisualStyle.HOVER_STROKE as string;
    const selectedColor = VisualStyle.PREVIEW_STROKE as string;

    if (type === "wall") {
      const wallLine = group.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (!wallLine) return;

      if (state === "normal") {
        wallLine.stroke(this.getDefaultWallStroke());
      } else if (state === "hover") {
        wallLine.stroke(hoverColor);
      } else {
        wallLine.stroke(selectedColor);
      }

      return;
    }

    if (type === "window") {
      const rect = group.findOne(`.${NodeName.WINDOW}`) as Konva.Rect;
      if (!rect) return;

      if (state === "normal") {
        rect.stroke(VisualStyle.WINDOW_STROKE as string);
        rect.strokeWidth(VisualStyle.WINDOW_STROKE_WIDTH as number);
      } else if (state === "hover") {
        rect.stroke(hoverColor);
        rect.strokeWidth(3);
      } else {
        rect.stroke(selectedColor);
        rect.strokeWidth(3);
      }

      return;
    }

    if (type === "door") {
      const bg = group.findOne(`.${NodeName.DOOR}`) as Konva.Rect;
      const leaf = group.findOne(`.${NodeName.DOOR_LEAF}`) as Konva.Line;
      const swing = group.findOne(`.${NodeName.DOOR_SWING}`) as Konva.Arc;

      const color =
        state === "normal"
          ? (VisualStyle.DOOR_STROKE as string)
          : state === "hover"
            ? hoverColor
            : selectedColor;

      if (bg) {
        if (state === "normal") {
          bg.stroke("");
          bg.strokeWidth(0);
        } else {
          bg.stroke(color);
          bg.strokeWidth(2);
        }
      }

      if (leaf) {
        leaf.stroke(color);
        leaf.strokeWidth(
          state === "normal"
            ? (VisualStyle.DOOR_STROKE_WIDTH as number)
            : (VisualStyle.DOOR_STROKE_WIDTH as number) + 1,
        );
      }

      if (swing) {
        swing.stroke(color);
        swing.strokeWidth(state === "normal" ? 1 : 2);
      }
    }
  }

  /**
   * Retrieves the parent wall group containing the specified window or door opening.
   *
   * @param openingGroup - The Konva.Group of the window or door.
   * @param type - The opening type ("window" | "door").
   * @returns The parent wall Konva.Group, or null if not found.
   */
  private getWallGroupForOpening(
    openingGroup: Konva.Group,
    type: "window" | "door",
  ): Konva.Group | null {
    if (type === "window") {
      return openingGroup.getParent() as Konva.Group;
    }

    const doorContainer = openingGroup.getParent();
    return doorContainer?.getParent() as Konva.Group;
  }

  /**
   * Creates/recalculates the start-to-center and center-to-end dimension lines
   * for an opening, stored as permanent children of the opening's own group.
   * Visibility is tied to whether this opening is currently selected.
   */
  private renderOpeningDimensions(
    openingGroup: Konva.Group,
    offset: number,
    wallLength: number,
    color: string,
  ) {
    openingGroup.findOne(`.${NodeName.OPENING_DIMENSION_GROUP}`)?.destroy();
    openingGroup.findOne(`.${NodeName.OPENING_DIMENSION_GROUP}`);
    const openingDimensionsGroup = new Konva.Group({
      name: NodeName.OPENING_DIMENSION_GROUP,
      listening: false,
    });
    const leftDimension = this.createDimension(-offset, 0, 0, 0, color);
    if (leftDimension) {
      leftDimension.name(NodeName.OPENING_LEFT_SIDE_DIMENSION);
      openingDimensionsGroup.add(leftDimension);
    }

    const rightDimension = this.createDimension(0, 0, wallLength - offset, 0, color);
    if (rightDimension) {
      rightDimension.name(NodeName.OPENING_RIGHT_SIDE_DIMENSION);
      openingDimensionsGroup.add(rightDimension);
    }

    //collectively add start and end to the main dimension group for openings
    openingGroup.add(openingDimensionsGroup);
    const isSelected = this.selectedOpening?.group === openingGroup;

    openingDimensionsGroup.visible(isSelected);
  }

  /**
   * Sets the AI background image for the floorplan.
   * Processes the image using an offscreen canvas, applies cropping based on layout detection,
   * and dynamically updates pixels to support both light and dark themes.
   */
  public setAIBackgroundImage(imageUrl: string, layoutJson: any, isDarkTheme: boolean): void {
    if (this.backgroundRect) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        if (layoutJson && layoutJson.detections) {
          layoutJson.detections.forEach((d: any) => {
            if (d.drawing_points) {
              d.drawing_points.forEach((p: any) => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
              });
            }
          });
        }

        const pad = 30;
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const px = pixelIndex % canvas.width;
            const py = Math.floor(pixelIndex / canvas.width);

            const outOfBounds = (minX !== Infinity) && (px < minX - pad || px > maxX + pad || py < minY - pad || py > maxY + pad);
            if (outOfBounds) {
              data[i + 3] = 0;
              continue;
            }

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0;
            } else if (isDarkTheme) {
              data[i] = 255 - r;
              data[i + 1] = 255 - g;
              data[i + 2] = 255 - b;
            }
          }
          ctx.putImageData(imageData, 0, 0);

          this.backgroundRect.fillPatternImage(canvas);
          this.backgroundRect.fillPatternRepeat("no-repeat");
          this.backgroundRect.opacity(0.4);
          this.backgroundRect.visible(true);
          this.getLayer(NodeName.BACKGROUND_LAYER)?.batchDraw();
        }
      };
    }
  }

  /**
   * Clears the AI background image from the floorplan.
   */
  public clearAIBackgroundImage(): void {
    if (this.backgroundRect) {
      this.backgroundRect.visible(false);
      this.backgroundRect.fillPatternImage(null as any);
      this.getLayer(NodeName.BACKGROUND_LAYER)?.batchDraw();
    }
  }

  /**
   * Refresh preview window.
   *
   * @returns {void}
   */
  private refreshPreviewWindow(): void {

    const windowWidth = Config.DEFAULT_WINDOW_WIDTH as number;
    const wallStrokeWidth = VisualStyle.WALL_STROKE_WIDTH as number;
    if (this.previewWindow) {
      const rect = this.previewWindow.findOne(
        `.${NodeName.WINDOW}`
      ) as Konva.Rect;

      if (!rect) {
        return;
      }

      const scaledWidth = windowWidth / this.unit_conversion_factor;

      rect.setAttrs({
        x: -scaledWidth / 2,
        y: -wallStrokeWidth / 2,
        width: scaledWidth,
        height: wallStrokeWidth,
      });

      rect.getLayer()?.batchDraw();
    }
  }

  /**
   * Refresh preview door.
   *
   * @returns {void}
   */
  private refreshPreviewDoor(): void {


    const doorWidth = Config.DEFAULT_DOOR_WIDTH as number;
    const wallStrokeWidth = VisualStyle.WALL_STROKE_WIDTH as number;


    const scaledWidth = doorWidth / this.unit_conversion_factor;

    //  Door opening (Rect)
    const doorRect = this.previewDoor!.findOne(
      `.${NodeName.DOOR}`
    ) as Konva.Rect;

    if (doorRect) {
      doorRect.setAttrs({
        x: -scaledWidth / 2,
        y: -wallStrokeWidth / 2,
        width: scaledWidth,
        height: wallStrokeWidth,
      });
    }

    //  Door leaf (Line)
    const doorLeaf = this.previewDoor!.findOne(
      `.${NodeName.DOOR_LEAF}`
    ) as Konva.Line;

    if (doorLeaf) {
      doorLeaf.points([
        -scaledWidth / 2,
        0,
        -scaledWidth / 2 + scaledWidth * Math.cos(Math.PI / 4),
        -scaledWidth * Math.sin(Math.PI / 4),
      ]);
    }


    const doorSwing = this.previewDoor!.findOne(
      `.${NodeName.DOOR_SWING}`
    ) as Konva.Arc;

    if (doorSwing) {
      doorSwing.x(-scaledWidth / 2);
      doorSwing.y(0);
      doorSwing.innerRadius(scaledWidth);
      doorSwing.outerRadius(scaledWidth);
    }

    this.previewDoor!.getLayer()?.batchDraw();
  }

  /**
   * Calculates the snapped coordinates based on axis restrictions and segment snapping.
   *
   * @param startX - The X coordinate of the starting point.
   * @param startY - The Y coordinate of the starting point.
   * @param endX - The current X coordinate of the end point.
   * @param endY - The current Y coordinate of the end point.
   * @returns SnapResult containing snapped coordinates and information about the snapped segment/endpoint.
   */
  private getAxisSnappedPosition(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): SnapResult {

    const axisSnapped = this.applyAxisSnapping(
      startX,
      startY,
      endX,
      endY
    );

    const segmentSnap = this.getAxisSegmentSnap(
      startX,
      startY,
      axisSnapped.x,
      axisSnapped.y
    );

    if (segmentSnap.snapped) {
      return segmentSnap;
    }

    const endpointSnap = this.getAxisEndpointSnap(
      startX,
      startY,
      axisSnapped.x,
      axisSnapped.y
    );

    if (endpointSnap.snapped) {
      return endpointSnap;
    }

    const gridSnap = this.getAxisGridSnap(
      startX,
      startY,
      axisSnapped.x,
      axisSnapped.y
    );

    if (
      gridSnap.x !== axisSnapped.x ||
      gridSnap.y !== axisSnapped.y
    ) {
      return {
        x: gridSnap.x,
        y: gridSnap.y,
        snapped: true,
        parentGroup: null,
      };
    }

    return {
      x: axisSnapped.x,
      y: axisSnapped.y,
      snapped: false,
      parentGroup: null,
    };
  }

  /**
   * Exports the current Konva stage as a JSON file download.
   */
  public exportJson(): any {
    const json = this.stage.toJSON();

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "floorplan.json";
    // a.click();

    URL.revokeObjectURL(url);

    return json
  }

  /**
   * Loads a previously exported Konva stage JSON, replaces
   * all layers on the current stage, and re-binds internal
   * references that were destroyed during the process.
   *
   * @param json - Raw JSON string produced by `exportJson`
   */
  public loadKonvaJson(json: any): void {
    const stageObj = JSON.parse(json);

    this.stage.destroyChildren();

    stageObj.children.forEach((layerData: any) => {
      const layer = Konva.Node.create(JSON.stringify(layerData)) as Konva.Layer;
      this.stage.add(layer);
    });

    // Re-bind references to the newly created layer/node instances
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (floorplanLayer) {
      this.floorplan = new Floorplan(floorplanLayer);
    }

    const gridLayer = this.getLayer(NodeName.GRID_LAYER);
    if (gridLayer) {
      this.gridGroup = gridLayer.findOne(`.${NodeName.GRID_GROUP}`) as Konva.Group;
    }

    const backgroundLayer = this.getLayer(NodeName.BACKGROUND_LAYER);
    if (backgroundLayer) {
      this.backgroundRect = backgroundLayer.findOne((node: any) => node instanceof Konva.Rect) as Konva.Rect;
    }

    const interactionLayer = this.getLayer(NodeName.INTERACTION_LAYER);
    if (interactionLayer) {
      this.previewWindow = interactionLayer.findOne(`.${NodeName.WINDOW_GROUP}`) as Konva.Group;
      this.previewDoor = interactionLayer.findOne(`.${NodeName.DOOR_GROUP}`) as Konva.Group;
    }
    this.stage.draw();

    this.fitLayout();
  }

  /**
   * Adds a predefined shape layout to the canvas as a draggable preview group.
   *
   * @param shapeType - The predefined shape JSON string (representing L-Shape, Rectangle, Triangle, or Square).
   */
  public addPredefinedShape(
    shapeType:
      | Predefined2DShapes.L_SHAPE
      | Predefined2DShapes.RECTANGLE
      | Predefined2DShapes.TRIANGLE
      | Predefined2DShapes.SQUARE
  ) {
    const jsonData = JSON.parse(shapeType);
    const layerJson = Konva.Node.create(jsonData) as Konva.Layer;

    const preview = new Konva.Group({
      opacity: 0.5,
      listening: true,
      draggable: true,
      name: "previewFloorplan",
    });

    layerJson.getChildren().forEach((child) => {
      preview.add(child.clone());
    });

    const box = preview.getClientRect({
      skipTransform: true,
    });

    preview.offset({
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    });

    const worldPointer = this.getWorldPointerPosition();
    if (worldPointer) {
      preview.position(worldPointer);
    }

    this.previewGroup = preview;

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    floorplanLayer?.add(preview);

    // Begin dragging immediately
    preview.startDrag();
    preview.on("dragstart", () => {
    });

    preview.on("dragmove", () => {

    });

    preview.on("dragend", () => {
      this.placePreview();
      preview.stopDrag();
    });
  }

  /**
   * Place preview.
   *
   * @returns {void}
   */
  private placePreview() {
    if (!this.previewGroup) return;

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    const children = [...this.previewGroup.getChildren()];

    children.forEach((child) => {
      // Absolute position before changing parent
      const absPos = child.getAbsolutePosition();

      child.moveTo(floorplanLayer);

      // Convert absolute position to floorplanLayer coordinates
      const transform = floorplanLayer.getAbsoluteTransform().copy();
      transform.invert();

      const localPos = transform.point(absPos);

      child.position(localPos);

      const lines = (child as Konva.Group).find("Line") as Konva.Line[];

      if (lines) {
        let points = lines[0].points();

        let sx = points[0] + localPos.x;
        let sy = points[1] + localPos.y;
        let ex = points[2] + localPos.x;
        let ey = points[3] + localPos.y;

        const wall = this.floorplan.newWall(sx, sy, ex, ey);
        // Create permanent dimension for the new wall
        const dimension = this.createDimension(sx, sy, ex, ey, VisualStyle.DIMENSION_COLOR as string);

        if (dimension) {
          wall.add(dimension);
        }
      }

      child.opacity(1);
      child.listening(true);
      child.destroy();
    });

    this.previewGroup.destroy();
    this.previewGroup = null;
    this.stage.off(".preview");

    floorplanLayer.draw();
    this.detectRooms();
  }
}
