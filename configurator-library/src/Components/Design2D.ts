import Konva from "konva";
import { v4 as uuidv4 } from 'uuid';
import { Floorplan } from "../Model/Floorplan";
import { NodeName, VisualStyle, Config, RoomEditorMode } from "../Constants";
import { RoomDetector } from "../utils/RoomDetector";
import type { Room } from "../utils/RoomDetector";
import type { Predefined2DShapes } from "../shapeTemplates";
import { Events, ConfiguratorEventType } from "../event";
import { ActionType, type HistoryEntry, Design2DHistoryManager } from './Design2DHistoryManager';
import type { Undo_Redo_Payload } from "../event/ConfiguratorEventType";
import { LengthUnitConverter } from "./LengthUnitConverter";

/**
 * Enum for the different interaction modes in the 2D designer.
 */
type SnapResult = {
  x: number;
  y: number;
  snapped: boolean;
  parentGroup: Konva.Group | null;
};

/*
 * Represents a wall connected to a junction, storing its group, ID, endpoint type, and original geometry.
 */
type JunctionWall = {
  group: Konva.Group;
  wallId: string;
  endpoint: "start" | "end";
  originalPoints: number[];
  originalWindows: any[];
  originalDoors: any[];
  originalConnections: any[];
};

/*
 * Represents a junction point in the floorplan, storing its coordinates and connected walls.
 */
type JunctionData = {
  x: number;
  y: number;
  walls: JunctionWall[];
};

/*
 * Represents a connection between two walls, storing the connected wall's ID and the intersection point.
 */
export interface WallConnection {
  id: string;
  connectedLineId: string;
  intersectionPoint: { x: number; y: number };
}

/*
 * Represents a window in the floorplan, storing its dimensions and position.
 */
export interface WindowData {
  id: string;
  offset: number;
  width: number;
  height: number;
  windowFloorDistance: number;
  isInvalid?: boolean;
}

export interface DoorData {
  id: string;
  offset: number;
  width: number;
  height: number,
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
   * Unit conversion factor (e.g. 50/50 since 50 is the default grid size)
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
   *Indicates if the user wants wall dragging (in EDIT mode) to be enabled. This is set when the user hovers over a wall's midpoint.
   */
  private isWallDragging = true;

  /**
   *Indicates if the user wants junction dragging (in EDIT mode) to be enabled. This is set when the user hovers over a junction dot.
   */
  private isJunctionDragging = true;

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
   * Visual line indicator for axis snapping (horizontal/vertical)
   */
  private junctionDot: Konva.Group | null = null;


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
   * Flag to track if wall dimensions/measurements are visible globally
   */
  private areDimensionsVisible: boolean = true;

  /**
   * Currently selected wall groups in EDIT mode
   */
  private selectedWallGroups: Konva.Group[] = [];

  /**
   * Design2DHistoryManager instance
   */
  protected design2DHistoryManager: Design2DHistoryManager;

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
    | { type: "wall"; group: Konva.Group[] }
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
    oldWallGroup: string;
    affectedRoomGroups: Map<string, string>;
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
    oldWallGroup: string;
  } | null = null;

  /**
   * Tracks the wall midpoint currently being dragged
   */
  private draggingWallMid: {
    wallGroup: Konva.Group;
    axis: { x: number; y: number };
    originalPoints: number[];
    originalWindows: any[];   // keep your existing types
    originalDoors: any[];
    startWorldPos: { x: number; y: number };
    connectedOriginals: Map<string, { points: number[]; windows: any[]; doors: any[] }>;
    connectedWallGroupData : string[];
  } | null = null;

  /**
   * Tracks the junction currently being dragged
   */
  private draggingJunction: {
    walls: JunctionWall[];
    connectedWallGroupData: any[];
    isInvalid: boolean;
  } | null = null;

  /**
   * Stores data related to the junction being edited
   */
  private junctionData: JunctionData | null = null;

  /**
   * Stores the custom resize cursors for wall endpoints
   */
  private resizeCursors?: {
    dynamic: (angle: number) => string;
  };

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
    this.design2DHistoryManager=new Design2DHistoryManager();

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
   * Undo
   */
  public undo(){
    const historyEntry = this.design2DHistoryManager.undo();
    if(historyEntry){
      this.apply(historyEntry, "undo");
    }
  }

  /**
   * Redo
   */
  public redo(){
    const historyEntry = this.design2DHistoryManager.redo();
    if(historyEntry){
      this.apply(historyEntry, "redo");
    }
  }
  
  /**
   * Apply the history entry according to the requested mode.
   * @param {HistoryEntry} entry
   * @param {string} mode
   */
  protected apply(entry: HistoryEntry, mode: string): void {
    switch (entry.action) {
      case ActionType.UPDATE_WALL: {
        const { oldGroups, newGroups, affectedRoomNames } = entry.data;

        this.handleUpdate(oldGroups, newGroups, mode);
        this.detectRooms();

        if (mode === "undo" && affectedRoomNames) {
          this.restoreRoomNames(affectedRoomNames);
        }
        break;
      }

      case ActionType.ADD_WALL: {
        const { newGroups } = entry.data;

        this.handleAdd(newGroups, mode);
        this.detectRooms();
        break;
      }

      case ActionType.DELETE_WALL: {
        const { oldGroups, affectedRoomNames } = entry.data;

        this.handleDelete(oldGroups, mode);
        this.detectRooms();

        if (mode === "undo") {
          this.restoreRoomNames(affectedRoomNames);
        }

        break;
      }

      case ActionType.UPDATE_ROOM_NAME: {
        const { oldRoomNames, newRoomNames } = entry.data;

        this.handleRoomNameUpdate(oldRoomNames, newRoomNames, mode);
        break;
      }
    }

    this.stage.batchDraw();
  }

  /**
   * Restores room names for detected rooms using the saved room label IDs.
   * @param {Map<string, string>} affectedRoomNames
   */
  private restoreRoomNames(affectedRoomNames: Map<string, string>): void {
    const roomFillLayer = this.getLayer(NodeName.ROOM_FILL_LAYER);
    const roomLabelLayer = this.getLayer(NodeName.ROOM_LABEL_LAYER);

    if (!roomFillLayer || !roomLabelLayer) {
      return;
    }

    affectedRoomNames.forEach((roomName, roomLabelId) => {
      // Find the text label using its ID.
      const label = roomLabelLayer.findOne<Konva.Text>(`#${roomLabelId}`);

      if (!label) return;

      // Find the room group associated with this label.
      const roomGroup = roomFillLayer.findOne<Konva.Group>(
        (node: Konva.Node) => node.getAttr("roomLabelId") === roomLabelId
      );

      if (!roomGroup) return;

      RoomDetector.setRoomName(roomGroup, label, roomName);
    });
  }

  /**
   * UPDATE:
   * Undo: remove new groups and restore old groups.
   * Redo: remove old groups and restore new groups.
   * @param {string[]} oldGroups
   * @param {string[]} newGroups
   * @param {string} mode
   */
  private handleUpdate(oldGroups: string[], newGroups: string[], mode: string,): void {
    if (mode === "undo") {
      this.removeGroups(newGroups);
      this.restoreGroups(oldGroups);
    } else {
      this.removeGroups(oldGroups);
      this.restoreGroups(newGroups);
    }
  }

  /**
   * ADD:
   * Undo: remove added groups.
   * Redo: restore added groups.
   * @param {string[]} newGroups
   * @param {string} mode
   */
  private handleAdd(newGroups: string[], mode: string): void {
    if (mode === "undo") {
      this.removeGroups(newGroups);
    } else {
      this.restoreGroups(newGroups);
    }
  }

  /**
   * DELETE:
   * Undo: restore deleted groups.
   * Redo: remove deleted groups.
   * @param {string[]} oldGroups
   * @param {string} mode
   */
  private handleDelete(oldGroups: string[], mode: string): void {
    if (mode === "undo") {
      this.restoreGroups(oldGroups);
    } else {
      this.removeGroups(oldGroups);
    }
  }

  /**
   * Handle Room name update
   * @param {Map<string, string>} oldRoomNames
   * @param {Map<string, string>} newRoomNames
   * @param {string} mode
  */
  private handleRoomNameUpdate(oldRoomNames : Map<string, string> , newRoomNames : Map<string, string>, mode : string){
    if (mode === "undo"){
      this.restoreRoomNames(oldRoomNames);
    }
    else{
      this.restoreRoomNames(newRoomNames);
    }
  }

  /**
   * Remove Konva groups matching the IDs in the serialized JSON.
   * @param {string[]} groups
   */
  private removeGroups(groups: string[]): void {
    for (const groupJson of groups) {
      const parsedGroup = JSON.parse(groupJson);
      const groupId = parsedGroup.attrs?.userData?.id;

      if (!groupId) {
        continue;
      }

      const existingGroups = this.stage.find(
        (node: Konva.Node) =>
          node instanceof Konva.Group &&
          node.getAttr("userData")?.id === groupId,
      );

      existingGroups.forEach((group) => group.destroy());
    }
  }

  /**
   * Restore serialized Konva groups to the floorplan layer.
   * @param {string[]} groups
   */
  private restoreGroups(groups: string[]): void {
    const layer = this.getLayer(NodeName.FLOORPLAN_LAYER);

    if (!layer) {
      console.error("Floorplan layer not found.");
      return;
    }

    for (const groupJson of groups) {
      const group = Konva.Node.create(groupJson);
      const originalIndex = group.getAttr("index");
      
      if (!(group instanceof Konva.Group)) {
        group.destroy();
        console.error("Serialized node is not a Konva.Group.");
        continue;
      }

      const groupId = group?.getAttr("userData")?.id;

      // Prevent duplicate groups with the same ID.
      if (
        groupId &&
        this.stage.find(
          (node: Konva.Node) =>
            node instanceof Konva.Group && node.getAttr("userData")?.id === groupId
        ).length > 0
      ) {
        group.destroy();
        continue;
      }

      // Make dimensions visible after restoring the group.
      const dimensionGroup = group.findOne(`.${NodeName.DIMENSION_GROUP}`);

      dimensionGroup?.visible(true);

      layer.add(group);
      if (typeof originalIndex === "number") {
        group.setZIndex(
          Math.min(originalIndex, layer.getChildren().length - 1)
        );
      }
      group.setAttr("index",group.getZIndex());
    }
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
   * Cancels any active predefined shape placement.
   */
  private cancelPredefinedShapePlacement() {
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
      this.cancelPredefinedShapePlacement();
    } else if (e.evt.button === 0) {
      // Interaction Logic on left click
      this.mouseMoved = false;


      if (this.mode === RoomEditorMode.WINDOW || this.mode === RoomEditorMode.DOOR) {
        return;
      }

      const worldPos = this.getWorldPointerPosition();
      if (!worldPos) return;

      // Red junction dot: select all connected walls and start a junction drag
      if (this.isJunctionDragging && (this.junctionDot?.visible() && this.junctionData)) {
        const walls = this.junctionData.walls;
        const connectedWallGroupData = this.getJunctionData(this.junctionData.walls);
        if (this.mode !== RoomEditorMode.EDIT) {
          this.setMode(RoomEditorMode.EDIT, true);
        }

        this.deselectWall();
        this.deselectOpening();
        walls.forEach((w, index) => this.selectWall(w.group, index > 0));

        this.draggingJunction = { walls, connectedWallGroupData,  isInvalid: false };
        return; // keep the dot visible, it follows the pointer
      }

      const isActivelyDrawing = this.mode === RoomEditorMode.DRAW && this.lastPoint !== null;

      // Check if clicking near an endpoint or midpoint of the selected wall
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
              originalDoors: userData?.doors ? userData.doors.map(d => ({ ...d })) : [],
              oldWallGroup: this.sanitizeWallHistoryJson(selectedGroup.toJSON()),
              affectedRoomGroups : this.getAffectedRoomGroups([selectedGroup])
            };
            this.showSnapIndicator(points[0], points[1], selectedGroup);
            return;
          } else if (Math.hypot(worldPos.x - points[2], worldPos.y - points[3]) < snapRadius) {
            this.draggingEndpoint = {
              wallGroup: selectedGroup,
              point: "end",
              originalPoints: [...points],
              originalWindows: userData?.windows ? userData.windows.map(w => ({ ...w })) : [],
              originalDoors: userData?.doors ? userData.doors.map(d => ({ ...d })) : [],
              oldWallGroup: this.sanitizeWallHistoryJson(selectedGroup.toJSON()),
              affectedRoomGroups : this.getAffectedRoomGroups([selectedGroup])
            };
            this.showSnapIndicator(points[2], points[3], selectedGroup);
            return;
          }
        }
      }
      if (this.isWallDragging && this.mode !== RoomEditorMode.DRAW && !e.evt.ctrlKey) {
        const info = this.getWallUnderPointer();

        if (info) {
          const targetGroup = info.wallGroup;
          const points = info.wallLine.points();
          const snapRadius = Config.SNAP_RADIUS as number;
          if (this.isPointerOnWallMid(worldPos, points, snapRadius, 0.6)) {
            if (this.mode !== RoomEditorMode.EDIT) {
              this.setMode(RoomEditorMode.EDIT, true);
            }

            // replaces any other selection with this wall (no-op if it is already the only one selected)
            this.selectWall(targetGroup, false);

            const userData = targetGroup.getAttr("userData") as WallUserData;
            const dx = points[2] - points[0];
            const dy = points[3] - points[1];
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length === 0) return;

            const perpendicularAxis = {
              x: -dy / length,
              y: dx / length,
            };

            this.stage.container().style.cursor = this.getResizeCursor(perpendicularAxis);
            this.draggingWallMid = {
              wallGroup: targetGroup,
              axis: perpendicularAxis,
              originalPoints: [...points],
              originalWindows: userData?.windows ? userData.windows.map(w => ({ ...w })) : [],
              originalDoors: userData?.doors ? userData.doors.map(d => ({ ...d })) : [],
              startWorldPos: { x: worldPos.x, y: worldPos.y },
              connectedOriginals: new Map(),
              connectedWallGroupData: this.getConnectedWallGroupData(targetGroup),
            };
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
          const item = items?.find((i) => i.id === entityId);
          if (item) initialOffset = item.offset;
        }

        this.draggingOpening = {
          group: openingInfo.openingGroup,
          type: openingInfo.type,
          wallGroup: openingInfo.wallGroup,
          entityId,
          initialOffset,
          oldWallGroup: this.sanitizeWallHistoryJson(openingInfo.wallGroup.toJSON()),
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
   * Method to get the junction wall groups JSON for history.
   * @param walls - Walls connected to the junction.
   * @returns JSON strings of the connected wall groups.
   */
  private getJunctionData(walls: JunctionWall[]): string[] {
    return walls.map(({ group }) =>
      this.sanitizeWallHistoryJson(group.toJSON())
    );
  }

  /**
   * Removes temporary selection and hit-point visuals from wall history JSON.
   */
  private sanitizeWallHistoryJson(wallJson: string): string {
    const wallData = JSON.parse(wallJson);

    // Find the wall line and restore its default stroke in the JSON only.
    const wallLine = wallData.children?.find(
      (child: any) => child.attrs?.name === NodeName.WALL
    );

    if (wallLine) {
      wallLine.attrs.stroke = this.getDefaultWallStroke();
    }

    // Remove temporary hit-point indicators from the history.
    wallData.children = wallData.children?.filter(
      (child: any) => child.attrs?.name !== "endpoint-circle-snap"
    );

    return JSON.stringify(wallData);
  }

  /**
  * Determines the appropriate cursor style for resizing a wall based on its orientation.
   *
   * @param wallDx - the horizontal displacement of the wall
   * @param wallDy - the vertical displacement of the wall
   * @returns The appropriate cursor style for resizing the wall.
   */
  private getResizeCursor(axis: { x: number; y: number }): string {
    if (!this.resizeCursors) {
      // horizontal double arrow in a 32x32 box: left head, bar, right head
      const ARROW_PATH = VisualStyle.BOLD_ARROW_PATH;

      this.resizeCursors = {
        dynamic: (angle: number) => {
          const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 48 32">` +
            `<path d="${ARROW_PATH}" transform="rotate(${angle} 16 16)" ` +
            `fill="#333333" stroke="#333333" stroke-width="0.5" stroke-linejoin="round"/>` +
            `</svg>`;

          return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, crosshair`;
        },
      };
    }

    const angle = Math.atan2(axis.y, axis.x) * (180 / Math.PI);

    return this.resizeCursors.dynamic(angle);
  }

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
  private handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
      // Junction drag takes over, so hover logic can't hide the dot mid-drag
      if (this.isJunctionDragging && this.draggingJunction) {
        const worldPos = this.getWorldPointerPosition();
        if (worldPos) this.handleJunctionDragging(worldPos.x, worldPos.y);
        return;
      }

      let isHoveringJunction = false;
      let isHoveringEndpoint = false;
      let isHoveringWallMid = false;

      if (!this.draggingEndpoint && !this.draggingOpening && !this.draggingWallMid) {
        if (
          this.mode !== RoomEditorMode.DRAW &&
          this.mode !== RoomEditorMode.WINDOW &&
          this.mode !== RoomEditorMode.DOOR
        ) {
          const worldPos = this.getWorldPointerPosition();
          if (!worldPos) return;
          const snapRadius = Config.SNAP_RADIUS as number;

          // junction only when nothing is selected
          const junction =this.isJunctionDragging ? this.findJunctionNear(worldPos.x, worldPos.y, snapRadius) : null;

          if (junction) {
            isHoveringJunction = true;
            this.showJunctionIndicator(junction);
            //for the junction dot, we want to hide the cursor so it doesn't obscure the dot
            this.stage.container().style.cursor = "none";
          } else {
            this.hideJunctionIndicator(); // clears junctionData before the highlight check

            // selected wall first (geometry test, works at the very tip),
            // then the wall under the pointer
            const candidates: { group: Konva.Group; line: Konva.Line }[] = [];
            if (this.selectedWallGroups.length === 1) {
              const g = this.selectedWallGroups[0];
              const l = g.findOne(`.${NodeName.WALL}`) as Konva.Line | null;
              if (l) candidates.push({ group: g, line: l });
            }
            const wallInfo = this.getWallUnderPointer();
            if (wallInfo && !candidates.some((c) => c.group === wallInfo.wallGroup)) {
              candidates.push({ group: wallInfo.wallGroup, line: wallInfo.wallLine });
            }

            for (const c of candidates) {
              const points = c.line.points();
              // endpoint drag is only allowed on the single selected wall (same rule as mouse down)
              const isSelectedWall =
                this.selectedWallGroups.length === 1 && this.selectedWallGroups[0] === c.group;
              if (isSelectedWall && Math.hypot(worldPos.x - points[0], worldPos.y - points[1]) < snapRadius) {
                this.showSnapIndicator(points[0], points[1], c.group, false);
                isHoveringEndpoint = true;
              } else if (isSelectedWall && Math.hypot(worldPos.x - points[2], worldPos.y - points[3]) < snapRadius) {
                this.showSnapIndicator(points[2], points[3], c.group, false);
                isHoveringEndpoint = true;
              } else if (this.isWallDragging && !e.evt.ctrlKey && this.isPointerOnWallMid(worldPos, points, snapRadius, 0.6)) {
                isHoveringWallMid = true;
                const dx = points[2] - points[0];
                const dy = points[3] - points[1];
                const length = Math.hypot(dx, dy);

                if (length > 0) {
                  const axis = {
                    x: -dy / length,
                    y: dx / length,
                  };

                  this.stage.container().style.cursor = this.getResizeCursor(axis);
                  // Apply cursor using your existing Konva/container cursor logic.
                }
              }
              if (isHoveringEndpoint || isHoveringWallMid) break;
            }

            // nothing hovered: reset here, otherwise the cursor stays stuck
            if (!isHoveringEndpoint && !isHoveringWallMid) {
              this.hideSnapIndicator();
              this.stage.container().style.cursor = "default";
            }
          }

          // all junction walls if the dot is visible, usual hover otherwise
          this.updateHoverHighlight();
        }
      }

      if (!isHoveringJunction) {
        this.hideJunctionIndicator();
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

        if (this.isWallDragging && this.draggingWallMid) {
          this.handleWallMidDragging(worldPos.x, worldPos.y);
        }
        else if (this.draggingEndpoint) {
          this.handleEndpointDragging(worldPos.x, worldPos.y);
        }
        else if (this.draggingOpening) {
          const worldPos = this.getWorldPointerPosition();
          if (!worldPos) return;

          this.handleOpeningDragging(worldPos.x, worldPos.y);
        }
        // no hover handling here: the top block already does it for every wall
      }
    }
  };

  /**
   * Handles the dragging of a junction, updating the positions of all connected walls.
   * @param x - the x-coordinate of the mouse position
   * @param y - the y-coordinate of the mouse position
   */
  private handleJunctionDragging(x: number, y: number) {
    const drag = this.draggingJunction;
    if (!drag) return;

    this.mouseMoved = true;

    // snapping on: snap to the grid intersection, snapping off: follow the pointer freely
    const snapped = this.isAxisSnappingEnabled
      ? this.getIntersectionSnappedPosition(x, y)
      : { x, y };
    const finalX = snapped.x;
    const finalY = snapped.y;

    const TOL = 1; // stored points can differ slightly from line points
    const draggedIds = new Set(drag.walls.map((w) => w.wallId).filter(Boolean));

    // move the shared endpoint of every wall and keep userData in sync
    for (const w of drag.walls) {
      const line = w.group.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (!line) continue;

      const pts = [...w.originalPoints];
      const o = w.endpoint === "start" ? 0 : 2;
      pts[o] = finalX;
      pts[o + 1] = finalY;
      line.points(pts);

      const ud = w.group.getAttr("userData") as WallUserData | undefined;
      if (!ud) continue;

      ud.startPoint = { x: pts[0], y: pts[1] };
      ud.endPoint = { x: pts[2], y: pts[3] };

      // rebuilt from the originals on every move, so the old junction position is never lost
      const oldX = w.originalPoints[o];
      const oldY = w.originalPoints[o + 1];
      ud.connections = w.originalConnections.map((c) =>
        draggedIds.has(c.connectedLineId) &&
          Math.hypot(c.intersectionPoint.x - oldX, c.intersectionPoint.y - oldY) <= TOL
          ? { ...c, intersectionPoint: { x: finalX, y: finalY } }
          : { ...c, intersectionPoint: { ...c.intersectionPoint } }
      );
    }

    // validate once every wall is at its new position
    let invalid = false;
    for (const w of drag.walls) {
      const line = w.group.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (!line) continue;
      const p = line.points();
      if (
        this.isWallThroughOpening(p[0], p[1], p[2], p[3], w.group) ||
        this.isWallOverlapping(p[0], p[1], p[2], p[3], w.group)
      ) {
        invalid = true;
        break;
      }
    }
    drag.isInvalid = invalid;

    for (const w of drag.walls) this.refreshJunctionWall(w, invalid);

    // the red dot follows the final position
    if (this.junctionDot) {
      this.junctionDot.position({ x: finalX, y: finalY });
      this.junctionDot.moveToTop();
    }

    // cursor: "not-allowed" if any wall is invalid, junction - otherwise hide the cursor so the dot is visible
    this.stage.container().style.cursor = invalid ? "not-allowed" : "none";
    this.stage.batchDraw();
    this.detectRooms();
  }

  /**
   * Refreshes the visual representation of a junction wall during dragging.
   * @param w - the junction wall being dragged
   * @param invalid - whether the wall is in an invalid state
   */
  private refreshJunctionWall(w: JunctionWall, invalid: boolean) {
    const line = w.group.findOne(`.${NodeName.WALL}`) as Konva.Line;
    if (!line) return;

    const p = line.points();
    const ud = w.group.getAttr("userData") as WallUserData;

    line.stroke(
      invalid ? (VisualStyle.WALL_ERROR_STROKE as string) : (VisualStyle.PREVIEW_STROKE as string)
    );

    w.group.findOne(`.${NodeName.DIMENSION_GROUP}`)?.destroy();
    const dimension = this.createDimension(
      p[0], p[1], p[2], p[3],
      invalid ? (VisualStyle.WALL_ERROR_STROKE as string) : (VisualStyle.DIMENSION_COLOR as string)
    );
    if (dimension) w.group.add(dimension);

    if (ud) {
      const o = w.originalPoints;
      const oldLength = Math.hypot(o[2] - o[0], o[3] - o[1]);
      const newLength = Math.hypot(p[2] - p[0], p[3] - p[1]);

      this.repositionOpeningsOnWall(w.group, oldLength, newLength, w.originalWindows, w.originalDoors);
      this.resolveAndValidateOpeningsOnWall(w.group);

      if (ud.windows) this.renderWindows(w.group, ud);
      if (ud.doors) this.renderDoors(w.group, ud);
    }
  }


  /**
   * Walls whose hit area is under or around the pointer. Cost is a few pixel reads, independent of wall count.
   * @param radius - the radius around the pointer to search for walls
   */
  private getWallLinesNearPointer(radius: number): Konva.Line[] | null {
    const pos = this.stage.getPointerPosition(); // screen coords, which is what getIntersection expects
    const layer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!pos || !layer) return null; // null = gate unavailable, caller falls back to a full scan

    const r = radius * (this.stage.scaleX() || 1); // world radius -> screen px
    const rings: { factor: number; count: number }[] = [
      { factor: 0.35, count: 6 },
      { factor: 0.7, count: 12 },
      { factor: 1.0, count: 16 },
    ];

    const offsets: [number, number][] = [[0, 0]];
    for (const { factor, count } of rings) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        offsets.push([Math.cos(angle) * r * factor, Math.sin(angle) * r * factor]);
      }
    }

    const found = new Set<Konva.Line>();
    for (const [dx, dy] of offsets) {
      const shape = layer.getIntersection({ x: pos.x + dx, y: pos.y + dy });
      if (shape && shape.hasName(NodeName.WALL)) found.add(shape as Konva.Line);
    }
    return [...found];
  }

  /**
   * Finds a junction (shared endpoint) near the given coordinates, if any.
   * @param x - the x-coordinate of the mouse position
   * @param y - the y-coordinate of the mouse position
   * @param radius - the radius within which to search for junctions
   * @returns The junction data if a junction is found, otherwise null
   */
  private findJunctionNear(x: number, y: number, radius: number): JunctionData | null {
    const EPS = 0.5;

    // 1) cheap gate: which walls are near the pointer? (no traversal)
    const nearby = this.getWallLinesNearPointer(radius);
    if (nearby && nearby.length === 0) return null;

    // 2) candidate endpoints: only the endpoints of those few walls, within radius
    const sourceLines = nearby ?? (this.stage.find(`.${NodeName.WALL}`) as Konva.Line[]);
    const candidates: { x: number; y: number; dist: number }[] = [];
    for (const line of sourceLines) {
      const p = line.points();
      for (const [px, py] of [[p[0], p[1]], [p[2], p[3]]]) {
        const dist = Math.hypot(x - px, y - py);
        if (dist <= radius) candidates.push({ x: px, y: py, dist });
      }
    }
    if (candidates.length === 0) return null; // pointer is on a wall but not near an end

    candidates.sort((a, b) => a.dist - b.dist);

    // 3) the full scan runs only now, near a real endpoint
    const walls = this.stage.find(`.${NodeName.WALL}`) as Konva.Line[];

    for (const c of candidates) {
      const connected = new Map<Konva.Group, JunctionWall>();

      for (const wall of walls) {
        const p = wall.points();
        let endpoint: "start" | "end" | null = null;
        if (Math.hypot(p[0] - c.x, p[1] - c.y) <= EPS) endpoint = "start";
        else if (Math.hypot(p[2] - c.x, p[3] - c.y) <= EPS) endpoint = "end";
        if (!endpoint) continue;

        const group = wall.getParent() as Konva.Group;

        // Skip walls that are already selected
        if (this.selectedWallGroups.includes(group)) {
          return null;
        }

        if (connected.has(group)) continue;

        const ud = group.getAttr("userData") as WallUserData | undefined;
        connected.set(group, {
          group,
          wallId: ud?.id ?? "",
          endpoint,
          originalPoints: [...p],
          originalWindows: ud?.windows ? ud.windows.map((w) => ({ ...w })) : [],
          originalDoors: ud?.doors ? ud.doors.map((d) => ({ ...d })) : [],
          originalConnections: ud?.connections ? ud.connections.map((c) => ({
            ...c,
            intersectionPoint: { ...c.intersectionPoint },
          })) : [],
        });
      }

      if (connected.size >= 2) {
        return { x: c.x, y: c.y, walls: [...connected.values()] };
      }
    }
    return null;
  }

  /**
   * Shows the junction indicator (red dot with crosshair) at the specified junction position.
   * @param junction - the junction data
   */
  private showJunctionIndicator(junction: JunctionData) {
    const layer = this.getLayer(NodeName.INTERACTION_LAYER);
    if (!layer) return;

    // drop a stale reference if the layer was cleared
    if (this.junctionDot && this.junctionDot.getParent() !== layer) {
      this.junctionDot.destroy();
      this.junctionDot = null;
    }

    if (!this.junctionDot) {
      this.junctionDot = this.createJunctionIndicator();
      layer.add(this.junctionDot);
    }

    this.junctionData = junction;
    this.junctionDot.setAttrs({
      x: junction.x,
      y: junction.y,
      visible: true,
      userData: {
        position: { x: junction.x, y: junction.y },
        connectedWalls: junction.walls.map((w) => ({ wallId: w.wallId, endpoint: w.endpoint })),
      },
    });

    this.junctionDot.moveToTop();
    layer.batchDraw();
  }

  /**
   * Hides the junction indicator (red dot with crosshair) and clears the junction data.
   */
  private hideJunctionIndicator() {
    this.junctionData = null;

    if (!this.junctionDot) return;

    if (!this.junctionDot.getParent()) {
      this.junctionDot = null;
      return;
    }
    if (this.junctionDot.visible()) {
      this.junctionDot.visible(false);
      this.junctionDot.setAttr("userData", null);
      this.junctionDot.getLayer()?.batchDraw();
    }
  }

  /**
   * Helper function to create the junction indicator (red dot with crosshair).
   * @returns A Konva.Group representing the junction indicator (red dot with crosshair).
   */
  private createJunctionIndicator(): Konva.Group {
    const fill = VisualStyle.JUNCTION_INDICATOR_FILL as string;
    const ringColor = (VisualStyle.JUNCTION_INDICATOR_RING as string) ?? "black";

    const inner = VisualStyle.SNAP_INDICATOR_RADIUS as number; // red center
    const ring = inner + 5;                                    // black ring
    const tickIn = ring - 3;                                   // ticks start slightly inside the ring
    const tickOut = ring + 7;                                  // and stick out past it

    const group = new Konva.Group({ name: "junction-indicator", listening: false });

    // black ring
    group.add(
      new Konva.Circle({
        radius: ring,
        fill: "transparent",
        stroke: ringColor,
        strokeWidth: 2,
        listening: false,
      })
    );

    // four crosshair ticks (up, down, left, right)
    const ticks: number[][] = [
      [0, -tickIn, 0, -tickOut],
      [0, tickIn, 0, tickOut],
      [-tickIn, 0, -tickOut, 0],
      [tickIn, 0, tickOut, 0],
    ];
    for (const points of ticks) {
      group.add(
        new Konva.Line({ points, stroke: ringColor, strokeWidth: 2, listening: false })
      );
    }

    // red center, added last so it draws on top
    group.add(
      new Konva.Circle({
        name: "junction-center",
        radius: inner,
        fill,
        listening: false,
      })
    );

    return group;
  }

  /**
   * Is pointer on wall mid
    * @param worldPos - The world position of the pointer.
    * @param points - The points of the wall line.
    * @param across - The distance across the wall.
    * @param zoneRatio - The ratio of the zone along the wall.
    * @returns {boolean} True if the pointer is on the wall mid, false otherwise.
   */
  private isPointerOnWallMid(
    worldPos: { x: number; y: number },
    points: number[],
    across: number,
    zoneRatio = 0.6
  ): boolean {
    const wallLen = Math.hypot(points[2] - points[0], points[3] - points[1]);
    if (wallLen === 0) return false;

    const midX = (points[0] + points[2]) / 2;
    const midY = (points[1] + points[3]) / 2;

    const ux = (points[2] - points[0]) / wallLen;
    const uy = (points[3] - points[1]) / wallLen;

    const px = worldPos.x - midX;
    const py = worldPos.y - midY;

    const alongDist = Math.abs(px * ux + py * uy);
    const acrossDist = Math.abs(-px * uy + py * ux);

    return alongDist <= (wallLen * zoneRatio) / 2 && acrossDist <= across;
  }

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
   */
  private handleDrawMode(worldPos: { x: number; y: number }, isDoubleClick: boolean = false) {
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
      // Prevent creating zero-length walls or extremely short walls
      const distance = Math.hypot(finalX - this.lastPoint.x, finalY - this.lastPoint.y);
      if (distance < 0.1) {
        return;
      }

      // Check for overlap before creating (collinear segments) or check whether the wall is getting passed through doors and windows
      if (this.isWallOverlapping(this.lastPoint.x, this.lastPoint.y, finalX, finalY) ||
        this.isWallThroughOpening(this.lastPoint.x, this.lastPoint.y, finalX, finalY)
      ) {
        // Block creation and return without updating lastPoint or finishing the line
        return;
      }

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

      // Wire up connections at both ends of the new wall to any wall(s)
      // touching those exact points — handles corners and T-junctions,
      // including junctions where more than one wall meets at once.
      this.connectWallAtPoint(wallGroup, { x: this.lastPoint.x, y: this.lastPoint.y });
      this.connectWallAtPoint(wallGroup, { x: finalX, y: finalY });
      this.design2DHistoryManager.push(
        {
          action : ActionType.ADD_WALL,
          data : {
            oldGroups : [],
            newGroups : [wallGroup.toJSON()]
          }
        }
      );
      this.draw(); // Ensure walls are rendered before detection
      this.detectRooms();
    }

    this.lastPoint = { x: finalX, y: finalY };
    this.draw();
  }

  /**
 * Finds every existing wall group whose line touches the given point,
 * either at an endpoint (corner) or along its length (T-junction).
 * Unlike getEndpointSnap/getSegmentSnap, this does not stop at the first match —
 * it's used specifically for wiring connections, where a point can be
 * shared by 2+ walls (e.g. a T-junction plus a corner at the same spot).
 */
  private getAllWallsTouchingPoint(
    x: number,
    y: number,
    excludeGroup?: Konva.Group
  ): Konva.Group[] {
    const results: Konva.Group[] = [];

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return results;

    const endpointTolerance = Config.SNAP_RADIUS as number;
    const segmentTolerance = Config.SEGMENT_SNAP_RADIUS as number;

    for (const child of floorplanLayer.getChildren()) {
      if (excludeGroup && child === excludeGroup) continue;
      if (!(child instanceof Konva.Group)) continue;

      const wall = child.findOne(`.${NodeName.WALL}`) as Konva.Line;
      if (!wall) continue;

      const points = wall.points();
      if (points.length < 4) continue;

      const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];

      // Endpoint match (corner)
      if (
        Math.hypot(x - x1, y - y1) < endpointTolerance ||
        Math.hypot(x - x2, y - y2) < endpointTolerance
      ) {
        results.push(child);
        continue;
      }

      // Segment match (T-junction: point lies along the wall, not at its ends)
      const dx = x2 - x1, dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;

      if (Math.hypot(x - projX, y - projY) < segmentTolerance) {
        results.push(child);
      }
    }

    return results;
  }
  /**
   * Wires up WallConnection entries between the newly created wall and
   * every existing wall touching the given endpoint. Handles junctions
   * where more than one wall meets at the same point (e.g. a T plus a corner).
   */
  private connectWallAtPoint(
    newWallGroup: Konva.Group,
    point: { x: number; y: number }
  ) {
    const newWallData = newWallGroup.getAttr("userData") as WallUserData;
    if (!newWallData) return;

    const touchingWalls = this.getAllWallsTouchingPoint(point.x, point.y, newWallGroup);

    for (const connectedWallGroup of touchingWalls) {
      const connectedData = connectedWallGroup.getAttr("userData") as WallUserData;
      if (!connectedData) continue;

      const connId = this.makeWallConnectionId(newWallData.id, connectedData.id, point);

      const alreadyOnNew = newWallData.connections?.some(c => c.id === connId);
      const alreadyOnConnected = connectedData.connections?.some(c => c.id === connId);

      if (!alreadyOnNew) {
        newWallData.connections = newWallData.connections ?? [];
        newWallData.connections.push({
          id: connId,
          connectedLineId: connectedData.id,
          intersectionPoint: { x: point.x, y: point.y },
        });
        newWallData.isConnected = true;
      }

      if (!alreadyOnConnected) {
        connectedData.connections = connectedData.connections ?? [];
        connectedData.connections.push({
          id: connId,
          connectedLineId: newWallData.id,
          intersectionPoint: { x: point.x, y: point.y },
        });
        connectedData.isConnected = true;
      }

      connectedWallGroup.setAttr("userData", connectedData);
    }

    newWallGroup.setAttr("userData", newWallData);
  }

  /**
   * Generates a unique identifier for a wall connection based on the IDs of the two walls and their intersection point.
   * @param wallIdA - the ID of the first wall
   * @param wallIdB - the ID of the second wall
   * @param pt - the intersection point of the two walls
   * @returns A unique string identifier for the wall connection
   */
  private makeWallConnectionId(
    wallIdA: string,
    wallIdB: string,
    pt: { x: number; y: number }
  ): string {
    const [first, second] = [wallIdA, wallIdB].sort();
    return `${first}_${second}_${Math.round(pt.x)}_${Math.round(pt.y)}`;
  }

  /**
 * After a wall endpoint is dragged to a new position, removes any
 * connections that were anchored to its OLD position (on both this wall
 * and the walls it was connected to), then wires fresh connections at
 * the NEW position using the same logic as draw-mode wall creation.
 */
  private updateWallConnectionsAfterEndpointDrag(
    wallGroup: Konva.Group,
    oldPoint: { x: number; y: number },
    newPoint: { x: number; y: number }
  ) {
    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (!userData) return;

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    const ENDPOINT_TOLERANCE = Config.SNAP_RADIUS as number;

    // 1. Find connections that were anchored to the endpoint we just moved
    //    (identified by proximity of intersectionPoint to its OLD position)
    const staleConnections = (userData.connections ?? []).filter(
      c => Math.hypot(c.intersectionPoint.x - oldPoint.x, c.intersectionPoint.y - oldPoint.y) < ENDPOINT_TOLERANCE
    );

    if (staleConnections.length > 0) {
      const staleIds = new Set(staleConnections.map(c => c.id));

      // Remove from this wall
      userData.connections = (userData.connections ?? []).filter(c => !staleIds.has(c.id));

      // Remove the mirrored entry from each wall it was connected to
      const groups = floorplanLayer.find(`.${NodeName.LINE_GROUP}`);
      staleConnections.forEach(c => {
        const connectedGroup = groups.find(
          g => (g.getAttr("userData") as WallUserData)?.id === c.connectedLineId
        ) as Konva.Group | undefined;
        if (!connectedGroup) return;

        const connectedData = connectedGroup.getAttr("userData") as WallUserData;
        if (!connectedData?.connections) return;

        connectedData.connections = connectedData.connections.filter(cc => cc.id !== c.id);
        connectedData.isConnected = connectedData.connections.length > 0;
        connectedGroup.setAttr("userData", connectedData);
      });

      userData.isConnected = (userData.connections?.length ?? 0) > 0;
      wallGroup.setAttr("userData", userData);
    }

    // 2. Wire fresh connections at the endpoint's new position
    this.connectWallAtPoint(wallGroup, newPoint);
  }



  /**
   * Listener for double click events on the stage to start wall drawing.
   */
  private handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {

    const pointerPos = this.stage.getPointerPosition();

    const shape = this.stage.getIntersection(pointerPos as any);
    if (shape && shape.name() === NodeName.DIMENSION_TEXT) {
      if (this.mode === RoomEditorMode.DRAW || this.mode === RoomEditorMode.WINDOW || this.mode === RoomEditorMode.DOOR) return;
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
    if (shape && shape.name() === NodeName.ROOM_LABEL) {
      const label = shape as Konva.Text;

      const roomId = label.getAttr("roomId");

      if (!roomId) {
        return;
      }

      const fillLayer = this.getLayer(NodeName.ROOM_FILL_LAYER);
      if (!fillLayer) return;

      const roomGroup = fillLayer.findOne(`#${roomId}`) as Konva.Group | undefined;

      if (!roomGroup) {
        return;
      }

      const currentName = roomGroup.getAttr("roomName");

      Events.emit(ConfiguratorEventType.EDIT_ROOM_NAME, {
        currentValue: currentName,
        clientX: e.evt.clientX,
        clientY: e.evt.clientY,

        setNewRoomName: (newName: string) => {
          this.setRoomName(roomGroup, label, newName);
        },
      });

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
    const oldWallGroup = this.sanitizeWallHistoryJson(wallGroup.toJSON());
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

    const lengthInCm = LengthUnitConverter.convertUnitToCentimeters( newLength, LengthUnitConverter.currentUnit);
    // Convert to konva unit
    newLength = lengthInCm / ((Config.KONVA_UNIT_TO_CM as number) * this.unit_conversion_factor);
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
    const newWallgroup = this.sanitizeWallHistoryJson(wallGroup.toJSON());
    this.design2DHistoryManager.push({
      action : ActionType.UPDATE_WALL,
      data : {
        oldGroups : [oldWallGroup],
        newGroups : [newWallgroup]
      }
    });

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
   * Edits the room name based on the new name.
   * @param roomGroup - The Konva group representing the room.
   * @param label - The new name in physical units.
   * @param newName - The edit reference point.
   * @returns Void.
   */
  private setRoomName(
    roomGroup: Konva.Group,
    label: Konva.Text,
    newName: string
  ): void {
    const roomLabelId = roomGroup.getAttr("roomLabelId");
    const oldLabel = roomGroup.getAttr("roomName");

    RoomDetector.setRoomName(roomGroup, label, newName);

    this.design2DHistoryManager.push({
      action: ActionType.UPDATE_ROOM_NAME,
      data: {
        oldRoomNames: new Map([
          [roomLabelId, oldLabel]
        ]),
        newRoomNames: new Map([
          [roomLabelId, newName]
        ])
      }
    });
    
    this.stage.batchDraw();
    this.detectRooms()
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
      const oldWallData=wallGroup.toJSON();
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
          height: Config.DEFAULT_WINDOW_HEIGHT as number,
          windowFloorDistance: Config.DEFAULT_WINDOW_FLOOR_DISTANCE as number,
        });

        this.renderWindows(wallGroup, userData);
        this.design2DHistoryManager.push({
          action : ActionType.UPDATE_WALL,
          data : {
            oldGroups : [oldWallData],
            newGroups : [wallGroup.toJSON()]
          }
        });
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
      const oldWallData=wallGroup.toJSON();
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
          height: Config.DEFAULT_DOOR_HEIGHT as number
        });

        this.renderDoors(wallGroup, userData);
        this.design2DHistoryManager.push({
          action : ActionType.UPDATE_WALL,
          data : {
            oldGroups : [oldWallData],
            newGroups : [wallGroup.toJSON()]
          }
        });
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
      let committed = false; // true only if the endpoint actually ended up at its dragged position

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

        committed = true; // valid so far — may still be reverted below by the overlap check
      }

      const { wallGroup, originalPoints, point } = this.draggingEndpoint;

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

          committed = false; // reverted — no connection update needed
        }
      }

      // Only update connections if the endpoint actually settled at a new position
      if (committed && wallLine) {
        const finalPoints = wallLine.points();
        const oldPoint =
          point === "start"
            ? { x: originalPoints[0], y: originalPoints[1] }
            : { x: originalPoints[2], y: originalPoints[3] };
        const newPoint =
          point === "start"
            ? { x: finalPoints[0], y: finalPoints[1] }
            : { x: finalPoints[2], y: finalPoints[3] };

        // Only bother if the endpoint actually moved
        if (Math.hypot(newPoint.x - oldPoint.x, newPoint.y - oldPoint.y) > 0.01) {
          this.updateWallConnectionsAfterEndpointDrag(wallGroup, oldPoint, newPoint);
          this.design2DHistoryManager.push(
            {
              action : ActionType.UPDATE_WALL,
              data : {
                oldGroups : [this.draggingEndpoint.oldWallGroup],
                newGroups : [this.sanitizeWallHistoryJson(wallGroup.toJSON())],
                affectedRoomNames : this.draggingEndpoint.affectedRoomGroups
              }
            }
          )
        }
      }

      this.hideSnapIndicator();
      this.draggingEndpoint = null;
      this.detectRooms();
      this.stage.batchDraw();
    }
    else if (this.draggingOpening) {
      const wallGroup = this.draggingOpening.wallGroup;
      this.design2DHistoryManager.push(
        {
          action : ActionType.UPDATE_WALL,
          data : {
            oldGroups : [this.draggingOpening.oldWallGroup],
            newGroups : [this.sanitizeWallHistoryJson(wallGroup.toJSON())]
          }
        }
      )
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

      // Finalize a junction drag, if one was in progress
      if (this.isJunctionDragging && this.draggingJunction) {
        this.finalizeJunctionDrag();
        return;
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

      // Finalize a wall midpoint drag, if one was in progress
      if (this.isWallDragging && this.draggingWallMid) {
        const oldGroups = this.draggingWallMid.connectedWallGroupData;
        const newGroups = this.getConnectedWallGroupData(this.draggingWallMid.wallGroup);
        this.design2DHistoryManager.push(
          {
            action : ActionType.UPDATE_WALL,
            data : {
              oldGroups : oldGroups,
              newGroups : newGroups

            }
          }
        )
        this.draggingWallMid = null;
        this.deselectWall();
        this.detectRooms();
      }
    }
  };

  /**
   * Finalizes the drag operation for a junction, restoring wall geometry and userData if the drop was invalid, and updating the stage accordingly.
   */
  private finalizeJunctionDrag() {
    const drag = this.draggingJunction;
    if (!drag) return;

    const moved = this.mouseMoved;
    const reverted = moved && drag.isInvalid;

    for (const w of drag.walls) {
      const line = w.group.findOne(`.${NodeName.WALL}`) as Konva.Line | null;
      const ud = w.group.getAttr("userData") as WallUserData | undefined;
      if (!line || !ud) continue;

      if (reverted) {
        // invalid drop: restore geometry and all userData
        line.points([...w.originalPoints]);
        ud.startPoint = { x: w.originalPoints[0], y: w.originalPoints[1] };
        ud.endPoint = { x: w.originalPoints[2], y: w.originalPoints[3] };
        ud.connections = w.originalConnections;
        if (ud.windows) ud.windows = w.originalWindows;
        if (ud.doors) ud.doors = w.originalDoors;
        this.refreshJunctionWall(w, false);
      }
      else {
        this.updateExistingConnections(w.group);
      }

      line.stroke(VisualStyle.PREVIEW_STROKE as string);
    }

    if (moved && !reverted) {
      const oldData = drag.connectedWallGroupData;
      const newData = this.getJunctionData(drag.walls);
      this.design2DHistoryManager.push({
        action : ActionType.UPDATE_WALL,
        data : {
          oldGroups : oldData,
          newGroups : newData
        }
      })
    }
    this.draggingJunction = null;

    this.hideSnapIndicator();
    this.hideJunctionIndicator();
    this.stage.container().style.cursor = "default";
    this.stage.batchDraw();
    this.deselectWall();

    // re-detect rooms only if the walls moved to a valid place
    this.detectRooms();

  }

  /**
   * Handles the movement logic for dragging a wall midpoint.
   * @param x New world X coordinate
   * @param y New world Y coordinate
   */
  private handleWallMidDragging(x: number, y: number) {
    if (!this.draggingWallMid) return;

    const { wallGroup, axis, originalPoints, startWorldPos } = this.draggingWallMid;

    const wallLine = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line;
    if (!wallLine) return;

    const deltaX = x - startWorldPos.x;
    const deltaY = y - startWorldPos.y;

    const distance = deltaX * axis.x + deltaY * axis.y;
    const moveX = axis.x * distance;
    const moveY = axis.y * distance;

    const prevPoints = [...wallLine.points()];
    const newPoints = [...originalPoints];

    newPoints[0] += moveX;
    newPoints[1] += moveY;
    newPoints[2] += moveX;
    newPoints[3] += moveY;

    wallLine.points(newPoints);

    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (userData) {
      userData.startPoint = { x: newPoints[0], y: newPoints[1] };
      userData.endPoint = { x: newPoints[2], y: newPoints[3] };
    }

    this.updateWallDimension(wallGroup);

    // Length is unchanged, so openings keep their position along the wall;
    // they only need to be redrawn at the wall's new location.
    if (userData) {
      if (userData.windows) this.renderWindows(wallGroup, userData);
      if (userData.doors) this.renderDoors(wallGroup, userData);
    }

    this.updateConnectedWallsForMidDrag(wallGroup, prevPoints, newPoints);
    this.detectRooms();
    this.stage.batchDraw();
  }

  /**
   * Return the array of JSON of all the connected wall groups to parent group.
   */
  private getConnectedWallGroupData(wallGroup: Konva.Group): string[] {
    const connectedWallGroupData: string[] = [];
    connectedWallGroupData.push(this.sanitizeWallHistoryJson(wallGroup.toJSON()));

    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (!userData?.connections?.length) return connectedWallGroupData;

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return connectedWallGroupData;

    const groups = floorplanLayer.find(`.${NodeName.LINE_GROUP}`);

    for (const connection of userData.connections) {
      const connectedWallGroup = groups.find(
        (group) =>
          (group.getAttr("userData") as WallUserData)?.id ===
          connection.connectedLineId
      ) as Konva.Group | undefined;

      if (!connectedWallGroup) continue;

      connectedWallGroupData.push(this.sanitizeWallHistoryJson(connectedWallGroup.toJSON()));
    }

    return connectedWallGroupData;
  }

  /**
   * Updates the positions of walls connected to the dragged wall midpoint.
   * @param wallGroup The Konva group of the wall being dragged
   * @param prevPoints The previous points of the dragged wall
   * @param newPoints The new points of the dragged wall
   */
  private updateConnectedWallsForMidDrag(
    wallGroup: Konva.Group,
    prevPoints: number[],
    newPoints: number[]
  ) {
    const userData = wallGroup.getAttr("userData") as WallUserData;
    if (!userData?.connections?.length) return;

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    // Movement of the dragged wall since the last frame
    const dx = newPoints[0] - prevPoints[0];
    const dy = newPoints[1] - prevPoints[1];
    if (dx === 0 && dy === 0) return;

    // How close a junction must be to an endpoint to count as a corner
    const ENDPOINT_TOLERANCE = 2;

    const groups = floorplanLayer.find(`.${NodeName.LINE_GROUP}`);

    for (const connection of userData.connections) {
      const connectedWallGroup = groups.find(
        (g) =>
          (g.getAttr("userData") as WallUserData)?.id ===
          connection.connectedLineId
      ) as Konva.Group | undefined;

      if (!connectedWallGroup) {
        console.warn("Connected wall not found:", connection.connectedLineId);
        continue;
      }

      const connectedWall = connectedWallGroup.findOne(
        `.${NodeName.WALL}`
      ) as Konva.Line;
      if (!connectedWall) continue;

      const pts = [...connectedWall.points()];
      const ip = connection.intersectionPoint;

      // Where is the junction on the CONNECTED wall?
      const dStart = Math.hypot(pts[0] - ip.x, pts[1] - ip.y);
      const dEnd = Math.hypot(pts[2] - ip.x, pts[3] - ip.y);

      const atStart = dStart <= ENDPOINT_TOLERANCE && dStart <= dEnd;
      const atEnd = dEnd <= ENDPOINT_TOLERANCE && dEnd < dStart;

      if (atStart || atEnd) {
        const connectedData = connectedWallGroup.getAttr("userData") as WallUserData;

        // Cache the state of this wall the first time we touch it (before moving it)
        const cache = this.draggingWallMid!.connectedOriginals;
        const wallId = connection.connectedLineId;
        if (!cache.has(wallId)) {
          cache.set(wallId, {
            points: [...pts],
            windows: connectedData?.windows ? connectedData.windows.map(w => ({ ...w })) : [],
            doors: connectedData?.doors ? connectedData.doors.map(d => ({ ...d })) : [],
          });
        }
        const orig = cache.get(wallId)!;

        if (atStart) {
          pts[0] += dx;
          pts[1] += dy;
        } else {
          pts[2] += dx;
          pts[3] += dy;
        }

        connectedWall.points(pts);

        if (connectedData) {
          connectedData.startPoint = { x: pts[0], y: pts[1] };
          connectedData.endPoint = { x: pts[2], y: pts[3] };
        }

        this.updateWallDimension(connectedWallGroup);

        // Its length changed, so reposition its doors/windows like in endpoint dragging
        if (connectedData) {
          const oldLength = Math.hypot(orig.points[2] - orig.points[0], orig.points[3] - orig.points[1]);
          const newLength = Math.hypot(pts[2] - pts[0], pts[3] - pts[1]);

          this.repositionOpeningsOnWall(
            connectedWallGroup,
            oldLength,
            newLength,
            orig.windows,
            orig.doors
          );
          this.resolveAndValidateOpeningsOnWall(connectedWallGroup);

          if (connectedData.windows) this.renderWindows(connectedWallGroup, connectedData);
          if (connectedData.doors) this.renderDoors(connectedWallGroup, connectedData);
        }
      }
      // else: T-JUNCTION on the middle of the connected wall
      // -> connected wall stays exactly where it is

      // The junction moves with the dragged wall in both cases
      connection.intersectionPoint = { x: ip.x + dx, y: ip.y + dy };

      // Keep the reverse connection (stored on the connected wall) in sync
      const connectedData = connectedWallGroup.getAttr(
        "userData"
      ) as WallUserData;
      connectedData?.connections?.forEach((c) => {
        if (c.connectedLineId === userData.id) {
          c.intersectionPoint = {
            x: c.intersectionPoint.x + dx,
            y: c.intersectionPoint.y + dy
          };
        }
      });
    }
  }

  /**
   * Updates the dimension display for a wall after it has been moved or resized.
   * @param wallGroup The Konva group representing the wall
   */
  private updateWallDimension(
    wallGroup: Konva.Group
  ) {
    const wallLine = wallGroup.findOne(
      `.${NodeName.WALL}`
    ) as Konva.Line;

    if (!wallLine) {
      return;
    }

    const points = wallLine.points();

    if (points.length < 4) {
      return;
    }

    // Remove old dimension
    wallGroup
      .findOne(`.${NodeName.DIMENSION_GROUP}`)
      ?.destroy();

    // Create dimension using CURRENT wall points
    const dimension = this.createDimension(
      points[0],
      points[1],
      points[2],
      points[3],
      VisualStyle.DIMENSION_COLOR as string
    );

    if (dimension) {
      wallGroup.add(dimension);
    }
  }

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
      text: LengthUnitConverter.formatCanvasLength( length, (Config.KONVA_UNIT_TO_CM as number) * this.unit_conversion_factor, LengthUnitConverter.currentUnit),
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
    this.cancelPredefinedShapePlacement();

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
    this.cancelPredefinedShapePlacement();


    this.unit_conversion_factor = cmValue / 50;    // 50 cm is the default grid size

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
        node.text(LengthUnitConverter.formatCanvasLength( length, (Config.KONVA_UNIT_TO_CM as number) * this.unit_conversion_factor, LengthUnitConverter.currentUnit))

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
    if (!this.areDimensionsVisible) return;
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
    this.cancelPredefinedShapePlacement();
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
    this.cancelPredefinedShapePlacement();
    this.isAxisSnappingEnabled = enabled;
    return this.isAxisSnappingEnabled;
  }

  /**
   * Enables or disables wall dragging (in EDIT mode).
   * @param enabled Whether wall dragging should be enabled
   * @returns The current state of wall dragging
   */
  public enableWallDragging(enabled: boolean): boolean {
    this.isWallDragging = enabled;
    return this.isWallDragging;
  }

  /**
   * Enables or disables junction dragging (in EDIT mode).
   * @param enabled Whether junction dragging should be enabled
   * @returns The current state of junction dragging
   */
  public enableJunctionDragging(enabled: boolean): boolean {
    this.isJunctionDragging = enabled;
    return this.isJunctionDragging;
  }

  /**
   * Toggles the visibility of wall dimensions.
   * @param visible Whether dimensions should be visible
   * @returns The new visibility state of the dimensions.
   */
  public toggleDimensions(visible: boolean): boolean {
    this.cancelPredefinedShapePlacement();
    this.areDimensionsVisible = visible;
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
  protected async detectRooms(wallData?: WallUserData[]): Promise<Room[]> {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return [];

    const rooms = RoomDetector.detectRooms(floorplanLayer, wallData);

    const fillLayer = this.getLayer(NodeName.ROOM_FILL_LAYER);
    const labelLayer = this.getLayer(NodeName.ROOM_LABEL_LAYER);

    if (fillLayer && labelLayer) RoomDetector.updateRoomFills(rooms, fillLayer, labelLayer);

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
  public async get2ddata(): Promise<{ layer: any, roomsLayer: any, houseBoundary: Room | null, unit_conversion_factor: number }> {
    this.cancelPredefinedShapePlacement();
    const layer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    const roomsLayer = this.getLayer(NodeName.ROOM_FILL_LAYER);
    if (!layer) {
      return { layer: null, roomsLayer: null, houseBoundary: null, unit_conversion_factor: this.unit_conversion_factor };
    } else {
      await this.detectRooms();
      const houseBoundary = await this.getHouseBoundary();

      const jsonString = layer.toJSON();
      const roomsJson = roomsLayer ? roomsLayer.toJSON() : "{}";

      return {
        layer: JSON.parse(jsonString),
        roomsLayer: roomsLayer ? JSON.parse(roomsJson) : {},
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
   * Gets the affected room names from the room-fill layer due to wall deletion.
   * @param deletedWallGroups - The wall groups being deleted.
   * @returns Map of room group IDs to room names.
   */
  private getAffectedRoomGroups(deletedWallGroups: Konva.Group[]): Map<string, string> {
    const roomFillLayer = this.getLayer(NodeName.ROOM_FILL_LAYER);
    const affectedRoomNames = new Map<string, string>();

    if (!roomFillLayer) {
      return affectedRoomNames;
    }

    // IDs of the walls being deleted.
    const deletedWallIds = new Set<string>(
      deletedWallGroups
        .map((group) => group.getAttr("userData")?.id)
        .filter((id): id is string => Boolean(id))
    );

    roomFillLayer.getChildren().forEach((node) => {
      if (!(node instanceof Konva.Group)) {
        return;
      }

      const roomWallIds: string[] = node.getAttr("walls") ?? [];

      // Check whether the room contains any deleted wall.
      const isAffected = roomWallIds.some((wallId) =>
        deletedWallIds.has(wallId)
      );

      if (isAffected) {
        const roomLabelId = node.getAttr("roomLabelId");
        const roomName = node.getAttr("roomName");

        if (roomLabelId && roomName) {
          affectedRoomNames.set(roomLabelId, roomName);
        }
      }
    });
    return affectedRoomNames;
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
    const wallHistory : any[] = [];
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
          wallHistory.push(wallGroup.toJSON())
        }

        this.design2DHistoryManager.push({
          action : ActionType.ADD_WALL,
          data : {
            oldGroups : [],
            newGroups : wallHistory
          }
        });        
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
              userData.windows.push({ id: uuidv4(), offset: offset, width: itemWidth, height: Config.DEFAULT_WINDOW_HEIGHT as number, windowFloorDistance: Config.DEFAULT_WINDOW_FLOOR_DISTANCE as number });
            } else if (detection.label === "Door") {
              if (!userData.doors) userData.doors = [];
              userData.doors.push({ id: uuidv4(), offset: offset, width: itemWidth, height: Config.DEFAULT_DOOR_HEIGHT as number });
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
    this.cancelPredefinedShapePlacement();
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
        const oldGroups = this.selectedWallGroups.map(group =>
            this.sanitizeWallHistoryJson(group.toJSON())
        );
        this.design2DHistoryManager.push({
          action : ActionType.DELETE_WALL,
          data : {
            oldGroups,
            affectedRoomNames : this.getAffectedRoomGroups(this.selectedWallGroups)
          }
        });

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
        
      const oldData=wallGroup.toJSON();

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
      if (this.areDimensionsVisible) {
        wallGroup?.findOne(`.${NodeName.DIMENSION_GROUP}`)?.visible(true);
      }

      group.destroy();
      this.selectedOpening = null;
      const newData = wallGroup.toJSON();
      this.design2DHistoryManager.push(
        {
          action : ActionType.UPDATE_WALL,
          data : {
            oldGroups : [oldData],
            newGroups : [newData]
          }
        }
      )
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
    this.design2DHistoryManager.clear();
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
    if (this.areDimensionsVisible) {
      wallGroup?.findOne(`.${NodeName.DIMENSION_GROUP}`)?.visible(true);
    }

    this.selectedOpening = null;
    this.stage.batchDraw();
  }

  /**
   * update hover highlight.
   *
   * @returns {void}
   */
  private updateHoverHighlight() {

    if (this.junctionDot?.visible() && this.junctionData) {
      this.setHoveredEntity({
        type: "wall",
        group: this.junctionData.walls.map((w) => w.group),
      });
      return;
    }

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
        group: [wallInfo.wallGroup],
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
      | { type: "wall"; group: Konva.Group[] }
      | { type: "window"; group: Konva.Group }
      | { type: "door"; group: Konva.Group },
  ) {
    const newGroups = Array.isArray(entity.group) ? entity.group : [entity.group];

    if (
      this.hoveredEntity &&
      this.hoveredEntity.type === entity.type
    ) {
      const curGroups = Array.isArray(this.hoveredEntity.group) ? this.hoveredEntity.group : [this.hoveredEntity.group];
      if (
        curGroups.length === newGroups.length &&
        curGroups.every((g) => newGroups.includes(g))
      ) {
        return; // same entity/walls as before, nothing to restyle
      }
    }

    this.clearHoveredEntity();
    this.hoveredEntity = entity;

    let changed = false;
    for (const g of newGroups) {
      if (this.isEntitySelected(entity.type, g)) continue; // keep the selected style
      this.applyEntityStyle(entity.type, g, "hover");
      changed = true;
    }
    if (changed) this.stage.batchDraw();
  }

  /**
   * Clear hovered entity.
   *
   * @returns {void}
   */
  private clearHoveredEntity() {
    if (!this.hoveredEntity) return;

    const { type } = this.hoveredEntity;
    for (const g of Array.isArray(this.hoveredEntity.group) ? this.hoveredEntity.group : [this.hoveredEntity.group]) {
      if (!this.isEntitySelected(type, g)) {
        this.applyEntityStyle(type, g, "normal");
      }
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
   * Serializes the current Konva stage as JSON.
   *
   * @returns {string} The serialized floorplan stage. This method does not trigger a file download.
   * @public
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

    this.stage.find<Konva.Group>(`.${NodeName.ROOM}`).forEach(group => {
      const poly = group.findOne<Konva.Line>('Line');
      if (poly && !poly.fillPatternImage() && !poly.fill()) {
        RoomDetector.applyFloorTexture(poly);
      }
    });
    const newWallGroups: string[] = [];

    this.stage
      .findOne<Konva.Layer>(`.${NodeName.FLOORPLAN_LAYER}`)
      ?.getChildren()
      .forEach((group) => {
        newWallGroups.push(
          this.sanitizeWallHistoryJson(group.toJSON())
        );
      });

    this.design2DHistoryManager.push({
      action: ActionType.ADD_WALL,
      data: {
        oldGroups: [],
        newGroups: newWallGroups,
      },
    });
    this.stage.draw();

    this.fitLayout();
  }

  /**
  * Adds a predefined floorplan shape (L-shape, Rectangle, Triangle, or Square)
  * either as a draggable preview or directly at the center of the canvas.
  *
  * @param shapeType - The predefined shape to add.
  * @param isPreview - Whether to add the shape as a draggable preview.
  */
  public addPredefinedShape(
    shapeType:
      | Predefined2DShapes.L_SHAPE
      | Predefined2DShapes.RECTANGLE
      | Predefined2DShapes.TRIANGLE
      | Predefined2DShapes.SQUARE,
     isPreview: boolean
  ): void {
    this.cancelPredefinedShapePlacement();

    const jsonData = JSON.parse(shapeType);
    const layerJson = Konva.Node.create(jsonData) as Konva.Layer;

    if (isPreview) {
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

      preview.on("dragstart", () => {});

      preview.on("dragmove", () => {});

      preview.on("dragend", (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (this.stage && e.evt?.target && this.stage.container().contains(e.evt.target as Node)) {
          //Valid drop place the shape permanently on the canvas
          this.placePreview(true);
        } else {
          // Clicked over Overlay UI keep the shape active on cursor
          if (this.previewGroup) {
            this.previewGroup.startDrag();
          }
        }
      });
    } else {
      // Get the floorplan layer where the shape will be placed
      const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
      if (!floorplanLayer) return;

      // Create a group to hold all wall elements of the predefined shape
      const shapeGroup = new Konva.Group();
      layerJson.getChildren().forEach((child) => {
        shapeGroup.add(child.clone());
      });

      // Calculate the shape bounding box and offset its origin to its center
      const box = shapeGroup.getClientRect({ skipTransform: true });
      shapeGroup.offset({
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      });

      // Convert the container center point to world coordinates using current stage scale and position
      const scale = this.stage.scaleX();
      const centerX = (this.container.clientWidth / 2 - this.stage.x()) / scale;
      const centerY = (this.container.clientHeight / 2 - this.stage.y()) / scale;
      shapeGroup.position({ x: centerX, y: centerY });

      // Add the shape directly to the floorplan layer and redraw
      floorplanLayer.add(shapeGroup);
      floorplanLayer.draw();
      this.previewGroup = shapeGroup;
      this.placePreview(false);
    }
  }

  /**
   * set undo-redo limit to stack
   * @param {Number} limit
   */
  public setUndoRedoLimit(limit : number){
    this.design2DHistoryManager?.setUndoRedoLimit(limit);
  }

  /**
   * Get the undo-redo-satck size
   * @returns {Undo_Redo_Payload} payload
   */
  public getUndoRedoPayload() : Undo_Redo_Payload{
    return this.design2DHistoryManager.getUndoRedoPayload();
  }

  /**
  * Finalizes the preview by adding its walls to the floorplan,
  * creating dimensions, establishing wall connections and updating history.
  *
  * @param isPreview - Whether the shape was added through preview placement.
  */
  private placePreview(isPreview: boolean): void {
    if (!this.previewGroup) return;

    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);
    if (!floorplanLayer) return;

    const children = [...this.previewGroup.getChildren()];

    // Track the wall groups created in this placement so we can wire
    // connections after ALL of them exist (a wall's neighbour might be
    // created later in this same loop).
    const newlyCreatedWalls: Konva.Group[] = [];
    const wallHistory : any[] = [];
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
        newlyCreatedWalls.push(wall);

        // Create permanent dimension for the new wall
        const dimension = this.createDimension(sx, sy, ex, ey, VisualStyle.DIMENSION_COLOR as string);

        if (dimension) {
          wall.add(dimension);
        }
        
      }
      if (isPreview) {
        child.opacity(1);
        child.listening(true);
      } 
      child.destroy();
    });


    // Wire connections for every wall placed in this shape:
    // - to its neighbours within the same shape (e.g. rectangle's own corners)
    // - to any pre-existing wall on the canvas the shape happens to touch/snap onto
    // Done after the loop above so every wall in the shape already exists
    // by the time we search for touching walls.
    newlyCreatedWalls.forEach((wallGroup) => {
      const userData = wallGroup.getAttr("userData") as WallUserData;
      if (!userData) return;

      this.connectWallAtPoint(wallGroup, userData.startPoint);
      this.connectWallAtPoint(wallGroup, userData.endPoint);
      wallHistory.push(wallGroup.toJSON()) 
    });
    this.design2DHistoryManager.push({
      action : ActionType.ADD_WALL,
      data : {
        oldGroups : [],
        newGroups :wallHistory
      }
    });

    this.previewGroup.destroy();
    this.previewGroup = null;
    if (isPreview) {
      this.stage.off(".preview");
    }

    floorplanLayer.draw();
    this.detectRooms();
  }

  /**
  * Updates the connections for an existing wall group.
  *
  * @param wallGroup - The Konva.Group representing the wall to update connections for.
  */
  private updateExistingConnections(wallGroup: Konva.Group) {
    const wallData =
      wallGroup.getAttr("userData") as WallUserData | undefined;

    if (!wallData?.connections?.length) return;

    const line = wallGroup.findOne(`.${NodeName.WALL}`) as Konva.Line | null;

    if (!line) return;

    const points = line.points();

    const start = {
      x: points[0], y: points[1],
    };

    const end = {
      x: points[2], y: points[3],
    };

    /*
     * Make a copy because connections can be removed
     * while iterating.
     */
    for (const connection of [...wallData.connections]) {

      const connectedGroup = this.getWallGroupById(connection.connectedLineId);

      if (!connectedGroup) {
        continue;
      }

      const connectedData = connectedGroup.getAttr("userData") as WallUserData | undefined;

      if (!connectedData) continue;

      const connectedLine = connectedGroup.findOne(`.${NodeName.WALL}`) as Konva.Line | null;

      if (!connectedLine) continue;

      const connectedPoints = connectedLine.points();

      if (connectedPoints.length < 4) continue;

      /*
       * Check the CURRENT geometry of both walls.
       */
      const intersection = this.getLineSegmentIntersection(
        start.x,
        start.y,
        end.x,
        end.y,

        connectedPoints[0],
        connectedPoints[1],
        connectedPoints[2],
        connectedPoints[3]
      );

      /*
       * They no longer intersect.
       *
       * Remove the connection from BOTH walls.
       */
      if (!intersection) {
        wallData.connections = wallData.connections.filter(c => c.id !== connection.id);

        connectedData.connections = (connectedData.connections ?? []).filter(c => c.id !== connection.id);

        wallData.isConnected = wallData.connections.length > 0;

        connectedData.isConnected = connectedData.connections.length > 0;

        connectedGroup.setAttr("userData", connectedData);

        continue;
      }

      /*
       * They are still connected.
       *
       * Keep the SAME connection ID.
       * Only update the intersection point.
       */
      const newIntersection = {
        x: intersection.x,
        y: intersection.y,
      };

      connection.intersectionPoint = { ...newIntersection, };

      /*
       * Find the mirrored connection using the
       * stable UUID.
       */
      const mirroredConnection = connectedData.connections?.find(
        c => c.id === connection.id
      );

      if (mirroredConnection) {
        mirroredConnection.intersectionPoint = { ...newIntersection, };
      }

      connectedGroup.setAttr("userData", connectedData);
    }

    wallData.isConnected = wallData.connections.length > 0;

    wallGroup.setAttr("userData", wallData);
  }

  /**
  * Retrieves the wall group associated with a given wall ID.
  *
  * @param wallId - The ID of the wall to retrieve.
  */
  private getWallGroupById(
    wallId: string
  ): Konva.Group | null {
    const floorplanLayer = this.getLayer(NodeName.FLOORPLAN_LAYER);

    if (!floorplanLayer) return null;

    const wallGroups = floorplanLayer.find(`.${NodeName.LINE_GROUP}`) as Konva.Group[];

    return (
      wallGroups.find(group => {
        const data = group.getAttr("userData") as WallUserData | undefined;

        return data?.id === wallId;
      }) ?? null
    );
  }

  /**
  * Sets the unit for displaying wall lengths and dimensions on the 2D canvas,
  * then refreshes all dimensions, window labels, and door labels.
  * @internal
  */
  public update2DLengthUnit(): void {
    this.refreshDimensions();
    this.refreshWindows();
    this.refreshDoors();
  }
}
