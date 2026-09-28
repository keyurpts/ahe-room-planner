import { NodeName } from "../Constants";

export interface Wall3DData {
    id: string;
    points: number[]; // [x1, y1, x2, y2]
    windows?: any[];
    doors?: any[];
}

/**
 * Converter class handles the transformation of 2D floorplan data into 3D-compatible structures.
 */
export class Converter {
    /**
     * Converts 2D floorplan data to a 3D wall data representation.
     *
     * @param data - The 2D floorplan data object containing node and line group properties.
     * @returns An array of Wall3DData objects.
     */
    public convert2dto3d(data: any): Wall3DData[] {
        const walls: Wall3DData[] = [];

        if (data && data.children) {
            // Iterate through children of the layer which are Groups
            data.children.forEach((group: any) => {
                if (group.attrs && group.attrs.name === NodeName.LINE_GROUP) {
                    const userData = group.attrs.userData || {};
                    const wallId = userData.id || "";

                    // Find the wall line child
                    const wallLine = group.children?.find(
                        (child: any) => child.attrs?.name === NodeName.WALL
                    );

                    if (wallLine && wallLine.attrs && wallLine.attrs.points) {
                        walls.push({
                            id: wallId,
                            points: [userData.startPoint.x, userData.startPoint.y, userData.endPoint.x, userData.endPoint.y],
                            windows: userData.windows || [],
                            doors: userData.doors || []
                        });
                    }
                }
            });
        }
        return walls;
    }
}
