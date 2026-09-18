import { ConfiguratorCore } from "../ConfiguratorCore";
/**
 * Design3D class handles the 3D representation of the floorplan.
 * It uses ConfiguratorCore for scene management and Three.js for rendering.
 */
export declare class Design3D {
    /**
     * ConfiguratorCore instance handling the 3D scene, rendering, and camera controls.
     */
    private core;
    /**
     * Converter instance for transforming 2D floorplan data into 3D objects.
     */
    private converter;
    /**
     * Raw wall meshes (input to WallCutter)
     */
    private sourceWallGroup;
    /**
     * The CSG-trimmed group that is actually added to the scene
     */
    private active3DWallGroup;
    /**
     * Group containing generated 3D floor meshes.
     */
    private floorGroup;
    /**
     * Extruded geometry group used to trim the ground plane around floor bounds.
     */
    private floorGroupTrimmer;
    /**
     * Main container group for rooms, walls, and floors.
     */
    private roomGroup;
    /**
     * Factor used to convert drawing unit scales (e.g. cm to meters).
     */
    private unit_conversion_factor;
    /**
     * WallCutter helper instance for carving window and door openings into walls.
     */
    private wallCutter;
    /**
     * Retrieves the current unit conversion scale factor.
     * @returns The unit conversion factor as a number.
     */
    private getUnitScaleFactor;
    /**
     * Initializes the 3D designer.
     * @param container - The HTML element to host the 3D canvas.
     */
    constructor(container: HTMLDivElement);
    /**
     * Creates 3D meshes for the walls based on 2D floorplan data and loads them into the core.
     * @param wallData - Array of wall data objects.
     * @param houseBoundary - Optional house boundary room.
     */
    private make3DMesh;
    /**
     * Helper method to add the door and windows to the roomGroup by creating them.
     * @param doorWindows - Array of door and window data.
     * @param wallThickness - Thickness of the walls.
     */
    private addDoorAndWindow;
    /**
     * Converts 2D data to 3D walls and floors and renders them.
     * @param data - The JSON dataset containing layout information.
     */
    loadFromJson(data: any): void;
    /**
     * Creates 3D floors for each room based on room layout.
     * @param rooms - Array of room objects containing vertices.
     */
    private makeFloorMesh;
    /**
     * Creates an extruded geometry group from the room vertices to act as a trimmer for the ground plane.
     * @param rooms - The list of rooms, each containing its 2D vertices.
     */
    private makeFloorMeshTrimmer;
    /**
     * Adds a textured ground plane underneath the model based on its bounding box size and center.
     * @param model - The 3D model object to reference for positioning and scaling.
     * @returns The generated ground plane THREE.Object3D.
     */
    private addGroundPlane;
    /**
     * Configures and returns the repeating floor texture, while also computing geometry normals.
     * @param geometry - The geometry to configure texture for.
     * @returns The configured THREE.Texture.
     */
    private getFloorTexture;
    /**
     * Removes all 3D wall meshes from the scene.
     */
    clearWalls(): void;
    /**
     * Activates the 3D renderer, initializing it if needed
     * and applying any pending wall data.
     */
    enter3DView(): void;
    /**
     * Pauses 3D rendering without destroying state.
     */
    exit3DView(): void;
    /**
     * Clean up resources.
     */
    dispose(): void;
    /**
     * Returns the ConfiguratorCore instance if it exists.
     * @returns The ConfiguratorCore instance or undefined.
     */
    getCore(): ConfiguratorCore | undefined;
}
