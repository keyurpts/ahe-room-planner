import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';
import { NodeName, VisualStyle, ThreeProperties } from '../Constants';

/**
 * Floorplan class manages the collection of walls using the Konva Layer as the primary storage.
 * This version is simplified to only handle basic addition and retrieval of nodes.
 */
export class Floorplan {
    /**
     * The Konva layer used to render and store 2D floorplan elements.
     */
    private layer: Konva.Layer;

    /**
     * Creates an instance of Floorplan.
     * @param layer - The Konva layer where the floorplan elements are rendered.
     */
    constructor(layer: Konva.Layer) {
        this.layer = layer;
    }

    /**
     * Creates a new wall between two points and adds it to the floorplan.
     * @param x1 Starting X coordinate
     * @param y1 Starting Y coordinate
     * @param x2 Ending X coordinate
     * @param y2 Ending Y coordinate
     * @returns The newly created wall group
     */
    public newWall(x1: number, y1: number, x2: number, y2: number): Konva.Group {
        const wallId = uuidv4();

        const group = new Konva.Group({ name: NodeName.LINE_GROUP });

        const line = this.createWallLine([x1, y1, x2, y2]);

        const userData = {
            id: wallId,
            startPoint: { x: x1, y: y1 },
            endPoint: { x: x2, y: y2 },
            isConnected: false,
            connections: [],
            windows: [],
            doors: []
        };
        group.setAttr(ThreeProperties.USER_DATA, userData);

        group.add(line);
        this.layer.add(group);

        return group;
    }

    /**
     * Creates a new Konva.Line instance for a wall.
     * @param points Array of coordinates [x1, y1, x2, y2]
     * @returns A new Konva.Line instance
     */
    private createWallLine(points: number[]): Konva.Line {
        return new Konva.Line({
            points: points,
            stroke: VisualStyle.WALL_STROKE as string,
            strokeWidth: VisualStyle.WALL_STROKE_WIDTH as number,
            hitStrokeWidth: (VisualStyle.WALL_STROKE_WIDTH as number) + 20, 
            name: NodeName.WALL,
        });
    }
}


