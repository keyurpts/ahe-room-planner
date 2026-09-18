import * as THREE from "three";
import { DoorTypes } from "../Constants";
export type DoorType = DoorTypes.SINGLE | DoorTypes.DOUBLE | DoorTypes.SLIDING | "single" | "double" | "sliding";
/**
 * Helper class for generating 3D door and window models.
 */
export declare class DoorWindowHelper {
    private static readonly casingMat;
    private static readonly doorMat;
    private static readonly moldingMat;
    private static readonly panelFaceMat;
    private static readonly handleMat;
    private static readonly trackMat;
    private static readonly frameMat;
    private static readonly glassMat;
    private static readonly DOOR_THRESHOLDS;
    /**
     * Builds a recessed or glass panel with a molding frame.
     * If `isGlass` is true, builds a mullion grid with glass panes instead of a solid panel face.
     *
     * @private
     * @param {number} pw - Width of the panel.
     * @param {number} ph - Height of the panel.
     * @param {number} leafD - Depth/thickness of the door leaf.
     * @param {number} moldW - Width of the molding frame.
     * @param {THREE.Material} faceMat - Material for the panel face or glass.
     * @param {boolean} [isGlass=false] - Whether this panel is a glass mullion window grid.
     * @param {number} [gridCols=0] - Number of columns for the glass mullion grid.
     * @param {number} [gridRows=0] - Number of rows for the glass mullion grid.
     * @returns {THREE.Group} A 3D Object3D group representing the constructed panel.
     */
    private static makeRecessedPanel;
    /**
     * Builds a vertical bar door handle for front and back surfaces of a door leaf.
     *
     * @private
     * @param {number} leafD - Depth/thickness of the door leaf.
     * @returns {THREE.Group} A 3D Object3D group representing the door handles.
     */
    private static makeDoorHandle;
    /**
     * Builds a 3-section door leaf featuring a glass grid top section (65%) and a solid recessed panel bottom section (35%).
     *
     * @private
     * @param {number} w - Width of the door leaf.
     * @param {number} h - Height of the door leaf.
     * @param {number} leafD - Depth/thickness of the door leaf.
     * @returns {THREE.Group} A 3D Object3D group representing the door leaf assembly.
     */
    private static build3PanelLeaf;
    /**
     * Builds a single door assembly comprising one leaf and handles.
     *
     * @private
     * @param {number} w - Width of the door.
     * @param {number} h - Height of the door.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the single door.
     */
    private static buildSingleDoor;
    /**
     * Builds a double door assembly comprising two leaves, a center mullion, and dual handles.
     *
     * @private
     * @param {number} w - Width of the double door opening.
     * @param {number} h - Height of the double door opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the double door.
     */
    private static buildDoubleDoor;
    /**
     * Builds a sliding door assembly comprising two overlapping panels and track hardware.
     *
     * @private
     * @param {number} w - Width of the sliding door opening.
     * @param {number} h - Height of the sliding door opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the sliding door.
     */
    private static buildSlidingDoor;
    /**
     * Creates a 3D door model dynamically selected based on width thresholds (single, double, or sliding).
     *
     * @public
     * @param {number} width - Total width of the door opening.
     * @param {number} height - Total height of the door opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the generated door.
     */
    static createDoor(width: number, height: number, wallThickness: number): THREE.Group;
    /**
     * Creates a 3D window model with sash frame, vertical/horizontal dividers, and glass panes.
     *
     * @public
     * @param {number} width - Total width of the window opening.
     * @param {number} height - Total height of the window opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the generated window.
     */
    static createWindow(width: number, height: number, wallThickness: number): THREE.Group;
}
export declare const createDoor: typeof DoorWindowHelper.createDoor;
export declare const createWindow: typeof DoorWindowHelper.createWindow;
