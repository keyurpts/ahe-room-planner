export interface Wall3DData {
    id: string;
    points: number[];
    windows?: any[];
    doors?: any[];
}
/**
 * Converter class handles the transformation of 2D floorplan data into 3D-compatible structures.
 */
export declare class Converter {
    /**
     * Converts 2D floorplan data to a 3D wall data representation.
     *
     * @param data - The 2D floorplan data object containing node and line group properties.
     * @returns An array of Wall3DData objects.
     */
    convert2dto3d(data: any): Wall3DData[];
}
