import Konva from "konva";
import { NodeName, VisualStyle } from "../Constants";
import type { WallUserData } from "../Components/Design2D";

export interface Room {
    walls: string[];
    center: { x: number; y: number };
    vertices: { x: number; y: number }[];
    boundaryWalls?: { id: string; isReversed: boolean }[];
}

interface Edge {
    wallId: string;
    to: string;
    angle: number;
}

export class RoomDetector {

    /**
     * Generates a string key representing rounded 2D coordinates for snapping.
     * @param x - The X coordinate.
     * @param y - The Y coordinate.
     * @returns A string key in the format "x,y".
     */
    private static getVertexKey(x: number, y: number): string {
        return `${Math.round(x)},${Math.round(y)}`;
    }

    /**
     * Detects internal rooms from the floorplan layout.
     * @param floorplanLayer - The Konva layer containing the walls.
     * @param wallData - Optional array of wall user data.
     * @returns An array of detected Room objects.
     */
    public static detectRooms(
        floorplanLayer: Konva.Layer,
        wallData?: WallUserData[]
    ): Room[] {

        const allCycles = this.findAllCycles(floorplanLayer, wallData);
        return allCycles.filter(r => r.area < -1);
    }

    /**
     * Detects the outer boundary walls of the house structure.
     * @param floorplanLayer - The Konva layer containing the walls.
     * @param wallData - Optional array of wall user data.
     * @returns The boundary Room object, or null if none detected.
     */
    public static detectHouseBoundary(
        floorplanLayer: Konva.Layer,
        wallData?: WallUserData[]
    ): Room | null {

        const allCycles = this.findAllCycles(floorplanLayer, wallData);
        const rooms = allCycles.filter(c => c.area < -1);

        const wallUsage = new Map<string, { isReversed: boolean }[]>();

        rooms.forEach((room) => {

            for (let i = 0; i < room.walls.length; i++) {

                const wallId = room.walls[i];
                const fromVertex = room.vertices[i];
                const fromKey = this.getVertexKey(fromVertex.x, fromVertex.y);

                let originalWall = wallData?.find(w => w.id === wallId) || null;

                if (!originalWall) {

                    const wallGroup = floorplanLayer.findOne((node: any) =>
                        node.name() === NodeName.LINE_GROUP &&
                        node.attrs?.userData?.id === wallId
                    ) as Konva.Group;

                    if (wallGroup) {
                        originalWall = wallGroup.getAttr("userData") as WallUserData;
                    }
                }

                let isReversed = false;

                if (originalWall) {

                    const p1Key = this.getVertexKey(
                        originalWall.startPoint.x,
                        originalWall.startPoint.y
                    );

                    isReversed = (fromKey !== p1Key);
                }

                const usage = wallUsage.get(wallId) || [];
                usage.push({ isReversed });

                wallUsage.set(wallId, usage);
            }
        });

        const boundaryWalls: { id: string; isReversed: boolean }[] = [];

        wallUsage.forEach((usages, id) => {

            if (usages.length === 1) {
                boundaryWalls.push({
                    id,
                    isReversed: usages[0].isReversed
                });
            }
        });

        if (boundaryWalls.length === 0) return null;

        return {
            walls: boundaryWalls.map(b => b.id),
            center: { x: 0, y: 0 },
            vertices: [],
            boundaryWalls
        };
    }

    /**
     * Finds all polygon cycles (rooms and boundary shapes) in the layout.
     * @param floorplanLayer - The Konva layer containing the walls.
     * @param wallData - Optional array of wall user data.
     * @returns An array of detected cycles with room details and areas.
     */
    private static findAllCycles(
        floorplanLayer: Konva.Layer,
        wallData?: WallUserData[]
    ): (Room & { area: number })[] {

        const graph: Map<string, Edge[]> = new Map();
        const vertexMap: Map<string, { x: number; y: number }> = new Map();
        const walls: WallUserData[] = [];

        if (wallData) {
            walls.push(...wallData);
        } else {
            const wallNodes = floorplanLayer.find(`.${NodeName.WALL}`);
            wallNodes.forEach((node) => {
                if (node instanceof Konva.Line) {
                    const data = node.getParent()?.getAttr("userData") as WallUserData;
                    if (data && data.id) {
                        // Rounding at collection time
                        const x1 = Math.round(data.startPoint.x);
                        const y1 = Math.round(data.startPoint.y);
                        const x2 = Math.round(data.endPoint.x);
                        const y2 = Math.round(data.endPoint.y);

                        // Filter out zero-length or extremely short walls 
                        if (Math.hypot(x2 - x1, y2 - y1) < 2) return;

                        data.startPoint = { x: x1, y: y1 };
                        data.endPoint = { x: x2, y: y2 };
                        walls.push(data);
                    }
                }
            });
        }

        const getVertexKey = (x: number, y: number) => RoomDetector.getVertexKey(x, y);

        // Deduplicate walls by normalized endpoints
        const uniqueWallsMap = new Map<string, WallUserData>();
        walls.forEach(w => {
            const k1 = getVertexKey(w.startPoint.x, w.startPoint.y);
            const k2 = getVertexKey(w.endPoint.x, w.endPoint.y);
            const wallKey = [k1, k2].sort().join("_");
            if (!uniqueWallsMap.has(wallKey)) {
                uniqueWallsMap.set(wallKey, w);
            }
        });
        const uniqueWalls = Array.from(uniqueWallsMap.values());

        const allEndpoints: { x: number; y: number }[] = [];
        uniqueWalls.forEach(w => {
            allEndpoints.push({ x: w.startPoint.x, y: w.startPoint.y });
            allEndpoints.push({ x: w.endPoint.x, y: w.endPoint.y });
        });

        // Helper to find intersection between two line segments
        const getIntersection = (
            p0: { x: number; y: number },
            p1: { x: number; y: number },
            p2: { x: number; y: number },
            p3: { x: number; y: number }
        ) => {
            const s1_x = p1.x - p0.x;
            const s1_y = p1.y - p0.y;
            const s2_x = p3.x - p2.x;
            const s2_y = p3.y - p2.y;

            const denom = -s2_x * s1_y + s1_x * s2_y;      // cross product of s1 and s2
            if (Math.abs(denom) < 1e-6) return null; // Parallel or collinear

            const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / denom;      // distance parameter along Segment 1 
            const t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / denom;       // distance parameter along Segment 2 

            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {        // This ensures that the intersection point actually lies on the finite segments themselves, rather than on their imaginary infinite extensions.
                return {
                    x: p0.x + (t * s1_x),
                    y: p0.y + (t * s1_y)
                };
            }
            return null;
        };

        // Add intersections of crossing walls so they act as junctions
        for (let i = 0; i < uniqueWalls.length; i++) {
            for (let j = i + 1; j < uniqueWalls.length; j++) {
                const w1 = uniqueWalls[i];
                const w2 = uniqueWalls[j];
                const intersection = getIntersection(
                    w1.startPoint, w1.endPoint,
                    w2.startPoint, w2.endPoint
                );
                if (intersection) {
                    allEndpoints.push(intersection);
                }
            }
        }

        const isSameJunction = (p1: any, p2: any) =>
            getVertexKey(p1.x, p1.y) === getVertexKey(p2.x, p2.y);

        walls.forEach(wall => {
            const p1 = wall.startPoint;
            const p2 = wall.endPoint;
            const junctions = [
                { x: p1.x, y: p1.y, dist: 0 },
                { x: p2.x, y: p2.y, dist: Math.hypot(p2.x - p1.x, p2.y - p1.y) }
            ];

            allEndpoints.forEach(pt => {
                if (
                    getVertexKey(pt.x, pt.y) !== getVertexKey(p1.x, p1.y) &&
                    getVertexKey(pt.x, pt.y) !== getVertexKey(p2.x, p2.y)
                ) {
                    if (this.isPointOnSegment(pt, p1, p2)) {
                        junctions.push({
                            x: pt.x,
                            y: pt.y,
                            dist: Math.hypot(pt.x - p1.x, pt.y - p1.y)
                        });
                    }
                }
            });

            junctions.sort((a, b) => a.dist - b.dist);
            const unique: typeof junctions = [];
            junctions.forEach(j => {
                if (
                    unique.length === 0 ||
                    !isSameJunction(j, unique[unique.length - 1])
                ) {
                    unique.push(j);
                }
            });

            for (let i = 0; i < unique.length - 1; i++) {
                const start = unique[i];
                const end = unique[i + 1];

                const k1 = getVertexKey(start.x, start.y);
                const k2 = getVertexKey(end.x, end.y);

                if (k1 === k2) continue; // Skip zero-length segments

                if (!vertexMap.has(k1)) vertexMap.set(k1, { x: start.x, y: start.y });
                if (!vertexMap.has(k2)) vertexMap.set(k2, { x: end.x, y: end.y });

                const angle12 = Math.atan2(end.y - start.y, end.x - start.x);
                const angle21 = Math.atan2(start.y - end.y, start.x - end.x);

                const e1 = graph.get(k1) || [];
                e1.push({ wallId: wall.id, to: k2, angle: angle12 });
                graph.set(k1, e1);

                const e2 = graph.get(k2) || [];
                e2.push({ wallId: wall.id, to: k1, angle: angle21 });
                graph.set(k2, e2);
            }
        });

        graph.forEach((edges, key) => {
            const uniqueEdgesMap = new Map<string, Edge>();
            edges.forEach(e => {
                const toKey = e.to;
                if (toKey !== key) {
                    // Use a key that combines destination and angle to catch duplicates
                    const edgeKey = `${toKey}_${e.angle.toFixed(4)}`;
                    if (!uniqueEdgesMap.has(edgeKey)) {
                        uniqueEdgesMap.set(edgeKey, e);
                    }
                }
            });

            const filtered = Array.from(uniqueEdgesMap.values());
            filtered.sort((a, b) => a.angle - b.angle);
            graph.set(key, filtered);
        });

        // Dead-end pruning
        // A vertex with only 1 neighbour can never be part of a closed polygon.
        // Dangling / open-ended lines whose free tip sits inside a room create
        // exactly such a degree-1 vertex.  Without this step the "next most-
        // clockwise edge" traversal below picks the stub edge at the T-junction
        // instead of continuing around the room boundary, then hits the dead-end
        // and aborts – so the room is never detected.
        //
        // We prune iteratively: removing a leaf may expose a new leaf at its
        // neighbour (e.g. a stub that only touches one other stub).
        let pruned = true;
        // Keep pruning as long as we remove dead-ends (at least one per pass)
        while (pruned) {
            // Assume initially that nothing will be removed in this pass
            pruned = false;
            for (const [key, edges] of graph) {
                if (edges.length === 1) {
                    const neighborKey = edges[0].to;
                    graph.delete(key);
                    vertexMap.delete(key);

                    const neighborEdges = graph.get(neighborKey);
                    if (neighborEdges) {
                        const filtered = neighborEdges.filter(e => e.to !== key);
                        if (filtered.length === 0) {
                            graph.delete(neighborKey);
                            vertexMap.delete(neighborKey);
                        } else {
                            graph.set(neighborKey, filtered);
                        }
                    }
                    pruned = true;
                }
            }
        }

        const visitedEdges = new Set<string>();
        const cycles: (Room & { area: number })[] = [];
        const junctionKeys = Array.from(graph.keys());

        for (const fromKey of junctionKeys) {
            const edges = graph.get(fromKey)!;
            for (const startEdge of edges) {
                const initialEdgeId = `${fromKey}->${startEdge.to}`;
                if (visitedEdges.has(initialEdgeId)) continue;

                const cycleWalls: string[] = [];
                const cycleKeys: string[] = [];

                let curVertex = fromKey;
                let nextVertex = startEdge.to;
                let curWallId = startEdge.wallId;

                const currentVisited = new Set<string>();

                while (true) {
                    const stepId = `${curVertex}->${nextVertex}`;
                    if (
                        visitedEdges.has(stepId) ||
                        currentVisited.has(stepId)
                    ) break;

                    currentVisited.add(stepId);
                    cycleWalls.push(curWallId);
                    cycleKeys.push(curVertex);

                    if (nextVertex === fromKey) {
                        const area = this.calculateSignedArea(cycleKeys, vertexMap);
                        let sumX = 0;
                        let sumY = 0;

                        cycleKeys.forEach(key => {
                            const v = vertexMap.get(key)!;
                            sumX += v.x;
                            sumY += v.y;
                        });

                        const center = {
                            x: sumX / cycleKeys.length,
                            y: sumY / cycleKeys.length
                        };

                        const vertices = cycleKeys.map(k => vertexMap.get(k)!);

                        cycles.push({
                            walls: [...cycleWalls],
                            center,
                            vertices,
                            area
                        });

                        currentVisited.forEach(e => visitedEdges.add(e));
                        break;
                    }

                    const neighbors = graph.get(nextVertex);
                    if (!neighbors || neighbors.length < 2) break;

                    const incomingAngle = Math.atan2(
                        vertexMap.get(curVertex)!.y - vertexMap.get(nextVertex)!.y,
                        vertexMap.get(curVertex)!.x - vertexMap.get(nextVertex)!.x
                    );

                    const incomingIdx = neighbors.findIndex(
                        e => {
                            let diff = Math.abs(e.angle - incomingAngle);
                            // Handle periodicity of angles (-PI to PI)
                            if (diff > Math.PI) diff = 2 * Math.PI - diff;
                            return diff < 0.01;
                        }
                    );

                    if (incomingIdx === -1) break;

                    const nextEdge = neighbors[(incomingIdx + 1) % neighbors.length];
                    if (nextEdge.to === curVertex && neighbors.length > 1) break;

                    curVertex = nextVertex;
                    nextVertex = nextEdge.to;
                    curWallId = nextEdge.wallId;

                    if (cycleKeys.length > graph.size * 2) break;
                }
                visitedEdges.add(initialEdgeId);
            }
        }
        return cycles;
    }

    /**
     * Updates and renders the room name labels on the Konva layer.
     * @param rooms - The list of rooms to label.
     * @param layer - The Konva layer to draw labels on.
     */
    public static updateRoomLabels(rooms: Room[], layer: Konva.Layer) {

        if (!layer) return;

        layer.destroyChildren();

        rooms.forEach((room, index) => {

            const label = new Konva.Text({
                x: room.center.x,
                y: room.center.y,
                text: `room ${index + 1}`,
                fontSize: 16,
                fontFamily: "Arial",
                fill: "black",
                fontStyle: "bold",
                align: "center",
                verticalAlign: "middle",
                name: NodeName.ROOM_LABEL
            });

            label.offsetX(label.width() / 2);
            label.offsetY(label.height() / 2);

            layer.add(label);
        });
        layer.batchDraw();
    }

    /**
     * Updates and renders the visual room fill polygons on the Konva layer.
     * @param rooms - The list of rooms to draw fills for.
     * @param layer - The Konva layer to draw room fills on.
     */
    public static updateRoomFills(rooms: Room[], layer: Konva.Layer) {

        if (!layer) return;

        layer.destroyChildren();

        rooms.forEach(room => {

            const points = room.vertices.flatMap(v => [v.x, v.y]);

            const poly = new Konva.Line({
                points,
                fill: VisualStyle.ROOM_FILL_COLOR as string,
                opacity: VisualStyle.ROOM_FILL_OPACITY as number,
                closed: true,
                listening: false
            });

            layer.add(poly);
        });
        layer.batchDraw();
    }

    /**
     * Calculates the signed area of a polygon using the Shoelace formula.
     * @param keys - The keys of the vertices in order.
     * @param vertices - The map containing coordinate objects by key.
     * @returns The calculated signed area.
     */
    private static calculateSignedArea(
        keys: string[],
        vertices: Map<string, { x: number; y: number }>
    ): number {

        let area = 0;

        for (let i = 0; i < keys.length; i++) {

            const p1 = vertices.get(keys[i])!;
            const p2 = vertices.get(keys[(i + 1) % keys.length])!;

            area += (p1.x * p2.y) - (p2.x * p1.y);
        }
        return area / 2;
    }

    /**
     * Checks if a point lies on a given line/wall segment within a tolerance.
     * @param p - The point to check.
     * @param s - The start point of the segment.
     * @param e - The end point of the segment.
     * @param epsilon - The tolerance value (default is 1.0).
     * @returns True if the point lies on the segment, false otherwise.
     */
    public static isPointOnSegment(
        p: { x: number; y: number },
        s: { x: number; y: number },
        e: { x: number; y: number },
        epsilon = 1.0
    ): boolean {

        const cross = Math.abs(
            (p.y - s.y) * (e.x - s.x) -
            (p.x - s.x) * (e.y - s.y)
        );

        if (cross > epsilon * Math.hypot(e.x - s.x, e.y - s.y)) return false;

        const dot =
            (p.x - s.x) * (e.x - s.x) +
            (p.y - s.y) * (e.y - s.y);

        if (dot < 0) return false;

        const sqLen =
            (e.x - s.x) * (e.x - s.x) +
            (e.y - s.y) * (e.y - s.y);

        if (dot > sqLen) return false;

        return true;
    }
}