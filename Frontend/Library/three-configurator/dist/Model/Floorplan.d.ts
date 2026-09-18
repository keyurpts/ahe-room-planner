import Konva from 'konva';
/**
 * Floorplan class manages the collection of walls using the Konva Layer as the primary storage.
 * This version is simplified to only handle basic addition and retrieval of nodes.
 */
export declare class Floorplan {
    /**
     * The Konva layer used to render and store 2D floorplan elements.
     */
    private layer;
    /**
     * Creates an instance of Floorplan.
     * @param layer - The Konva layer where the floorplan elements are rendered.
     */
    constructor(layer: Konva.Layer);
    /**
     * Creates a new wall between two points and adds it to the floorplan.
     * @param x1 Starting X coordinate
     * @param y1 Starting Y coordinate
     * @param x2 Ending X coordinate
     * @param y2 Ending Y coordinate
     * @returns The newly created wall group
     */
    newWall(x1: number, y1: number, x2: number, y2: number): Konva.Group;
    /**
     * Creates a new Konva.Line instance for a wall.
     * @param points Array of coordinates [x1, y1, x2, y2]
     * @returns A new Konva.Line instance
     */
    private createWallLine;
}
