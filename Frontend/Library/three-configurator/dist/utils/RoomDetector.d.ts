import Konva from "konva";
import type { WallUserData } from "../Components/Design2D";
export interface Room {
    walls: string[];
    center: {
        x: number;
        y: number;
    };
    vertices: {
        x: number;
        y: number;
    }[];
    boundaryWalls?: {
        id: string;
        isReversed: boolean;
    }[];
}
export declare class RoomDetector {
    /**
     * Generates a string key representing rounded 2D coordinates for snapping.
     * @param x - The X coordinate.
     * @param y - The Y coordinate.
     * @returns A string key in the format "x,y".
     */
    private static getVertexKey;
    /**
     * Detects internal rooms from the floorplan layout.
     * @param floorplanLayer - The Konva layer containing the walls.
     * @param wallData - Optional array of wall user data.
     * @returns An array of detected Room objects.
     */
    static detectRooms(floorplanLayer: Konva.Layer, wallData?: WallUserData[]): Room[];
    /**
     * Detects the outer boundary walls of the house structure.
     * @param floorplanLayer - The Konva layer containing the walls.
     * @param wallData - Optional array of wall user data.
     * @returns The boundary Room object, or null if none detected.
     */
    static detectHouseBoundary(floorplanLayer: Konva.Layer, wallData?: WallUserData[]): Room | null;
    /**
     * Finds all polygon cycles (rooms and boundary shapes) in the layout.
     * @param floorplanLayer - The Konva layer containing the walls.
     * @param wallData - Optional array of wall user data.
     * @returns An array of detected cycles with room details and areas.
     */
    private static findAllCycles;
    /**
     * Updates and renders the room name labels on the Konva layer.
     * @param rooms - The list of rooms to label.
     * @param layer - The Konva layer to draw labels on.
     */
    static updateRoomLabels(rooms: Room[], layer: Konva.Layer): void;
    /**
     * Updates and renders the visual room fill polygons on the Konva layer.
     * @param rooms - The list of rooms to draw fills for.
     * @param layer - The Konva layer to draw room fills on.
     */
    static updateRoomFills(rooms: Room[], layer: Konva.Layer): void;
    /**
     * Calculates the signed area of a polygon using the Shoelace formula.
     * @param keys - The keys of the vertices in order.
     * @param vertices - The map containing coordinate objects by key.
     * @returns The calculated signed area.
     */
    private static calculateSignedArea;
    /**
     * Checks if a point lies on a given line/wall segment within a tolerance.
     * @param p - The point to check.
     * @param s - The start point of the segment.
     * @param e - The end point of the segment.
     * @param epsilon - The tolerance value (default is 1.0).
     * @returns True if the point lies on the segment, false otherwise.
     */
    static isPointOnSegment(p: {
        x: number;
        y: number;
    }, s: {
        x: number;
        y: number;
    }, e: {
        x: number;
        y: number;
    }, epsilon?: number): boolean;
}
