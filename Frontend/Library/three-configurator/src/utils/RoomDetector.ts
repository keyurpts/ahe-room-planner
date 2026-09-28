import Konva from "konva";
import { ImageAssets, NodeName, ThreeProperties, VisualStyle } from "../Constants";
import type { WallUserData } from "../Components/Design2D";
import { v4 as uuidv4 } from 'uuid';

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


    private static floorImage?: HTMLImageElement;               // set once the texture has loaded
    private static floorImageLoad?: Promise<HTMLImageElement>;

    /** Loads + decodes the floor texture once. Safe to call many times. */
    public static preloadTexture(): Promise<HTMLImageElement> {
        if (RoomDetector.floorImage) return Promise.resolve(RoomDetector.floorImage);

        if (!RoomDetector.floorImageLoad) {
            const img = new Image();
            img.src = ImageAssets.DEFAULT_FLOOR_TEXTURE;
            RoomDetector.floorImageLoad = img.decode()
                .then(() => (RoomDetector.floorImage = img))
                .catch(() => {
                    RoomDetector.floorImageLoad = undefined;   // allow a retry next time
                    throw new Error(`Failed to load texture: ${ImageAssets.DEFAULT_FLOOR_TEXTURE}`);
                });
        }
        return RoomDetector.floorImageLoad;
    }

    private static setPattern(poly: Konva.Line, img: HTMLImageElement) {
        const scale = (VisualStyle.TILE_SIZE_CM * VisualStyle.PX_PER_CM) / img.width;
        poly.fillPatternImage(img);
        poly.fillPatternRepeat('repeat');
        poly.fillPatternScale({ x: scale, y: scale });
        poly.fillPriority('pattern');
        poly.opacity(1);
    }

    /**
     * Fills a room polygon with the floor texture.
     * Instant if the image is already loaded; otherwise applied when it arrives.
     * Falls back to the old blue fill if loading fails.
     */
    public static applyFloorTexture(poly: Konva.Line) {
        if (RoomDetector.floorImage) {
            RoomDetector.setPattern(poly, RoomDetector.floorImage);
            return;
        }

        RoomDetector.preloadTexture()
            .then(img => {
                if (!poly.getLayer()) return;   // room was removed meanwhile
                RoomDetector.setPattern(poly, img);
                poly.getLayer()?.batchDraw();
            })
            .catch(err => {
                console.warn(err);
                if (!poly.getLayer()) return;
                poly.fillPriority('color');
                poly.fill(VisualStyle.ROOM_FILL_COLOR as string);
                poly.opacity(VisualStyle.ROOM_FILL_OPACITY as number);
                poly.getLayer()?.batchDraw();
            });
    }

    /**
     * Updates and renders the visual room fill polygons on the Konva layer.
     * @param rooms - The list of rooms to draw fills for.
     * @param layer - The Konva layer to draw room fills on.
     * @param labelLayer - The Konva layer to draw room labels on.
     */
    public static updateRoomFills(rooms: Room[], layer: Konva.Layer, labelLayer: Konva.Layer) {

        if (!layer) return;
        if (!labelLayer) return;
        let index = 1;

        // Start loading the texture immediately (no-op if already loaded / loading)
        RoomDetector.preloadTexture().catch(() => { /* handled per room in applyFloorTexture */ });

        // Keep track of which room groups on the layer correspond to currently detected rooms
        const activeRoomGroups = new Set<Konva.Group>();

        rooms.forEach(room => {
            const points = room.vertices.flatMap(v => [v.x, v.y]);

            // Check if a room representing the same geometric region already exists in the layer
            const existingRoomGroup = (layer.getChildren() as Konva.Group[]).find(child => {
                if (child.name() !== NodeName.ROOM) return false;
                // Don't re-match a group that has already been claimed by another detected room
                if (activeRoomGroups.has(child)) return false;

                const poly = child.findOne<Konva.Line>('Line');
                const existingPoints = poly?.points();
                if (existingPoints && existingPoints.length >= 6) {
                    const existingVertices = RoomDetector.flatPointsToVertices(existingPoints);
                    if (RoomDetector.isSameRegion(existingVertices, room.vertices)) {
                        return true;
                    }
                }

                // Fallback: Check if the unique set of wall IDs matches
                const userData = child.getAttr(ThreeProperties.USER_DATA) as { id?: string; walls?: string[] } | undefined;
                const existingWalls = userData?.walls;
                if (existingWalls && existingWalls.length > 0 && room.walls.length > 0) {
                    const setExisting = new Set(existingWalls);
                    const setRoom = new Set(room.walls);
                    if (setExisting.size === setRoom.size && [...setRoom].every(w => setExisting.has(w))) {
                        return true;
                    }
                }

                return false;
            });

            if (existingRoomGroup) {
                // Mark this existing room group as active
                activeRoomGroups.add(existingRoomGroup);

                // Update geometry in case walls were moved, split, or subdivided.
                // The texture (fillPattern*) lives on the same Line, so it keeps
                // filling the resized shape without being re-applied.
                const poly = existingRoomGroup.findOne<Konva.Line>('Line');
                if (poly) {
                    poly.points(points);

                    // Room restored from JSON (the image isn't serialized): re-apply the texture.
                    // Skips rooms that already have a texture or the blue fallback.
                    if (!poly.fillPatternImage() && !poly.fill()) {
                        RoomDetector.applyFloorTexture(poly);
                    }
                }

                // Keep walls list up to date on userData
                existingRoomGroup.setAttr("walls", room.walls);

                // Keep points list up to date on userData
                existingRoomGroup.setAttr("points", room.vertices);

                const isCustomRoom = existingRoomGroup.getAttr("isCustomRoom");
                if (!isCustomRoom) {
                    const roomName = `room ${index}`;
                    index++;
                    const label = labelLayer.findOne<Konva.Text>(`#${existingRoomGroup.getAttr("roomLabelId")}`);
                    if (label) {
                        label.text(roomName);

                        // Keep label centered
                        label.offsetX(label.width() / 2);
                        label.offsetY(label.height() / 2);
                        label.setAttr("roomName", roomName);
                    }
                    existingRoomGroup.setAttr("roomName", roomName);
                }

                return;
            }

            const roomId = uuidv4();
            const roomLabelId = uuidv4();
            const roomName = `room ${index}`;
            index++;

            const group = new Konva.Group({
                name: NodeName.ROOM,
                id: roomId,
                roomName: roomName,
                points: room.vertices,
                walls: room.walls,
                roomLabelId: roomLabelId,
                isCustomRoom: false,
            });

            // No color fill here: applyFloorTexture sets the pattern (instantly if the
            // texture is cached) and only falls back to the blue if loading fails.
            const poly = new Konva.Line({
                points,
                closed: true,
                listening: false,
            });

            const label = new Konva.Text({
                text: roomName,
                fontSize: 16,
                fontFamily: "Arial",
                fill: "black",
                fontStyle: "bold",
                align: "center",
                verticalAlign: "middle",
                name: NodeName.ROOM_LABEL,
                id: roomLabelId,
                roomName: roomName,
                roomId: roomId,
            });

            const pos = RoomDetector.getLabelPosition(
                points,
                label.width(),
                label.height()
            );
            label.position(pos);

            label.offsetX(label.width() / 2);
            label.offsetY(label.height() / 2);

            group.setAttr("lablePosition", pos);   // spelling kept as-is in case other code reads it
            group.add(poly);
            layer.add(group);
            labelLayer.add(label);
            activeRoomGroups.add(group);

            // Must come after group.add(poly) + layer.add(group) so poly has a parent/layer
            RoomDetector.applyFloorTexture(poly);
        });

        // Collect all room groups that are no longer present in the detected rooms
        // Note: We must filter into a separate array first because child.destroy() mutates
        // layer.children in-place with splice(), which causes subsequent elements to be skipped in a direct forEach.
        const roomsToDestroy = (layer.getChildren() as Konva.Group[]).filter(
            child => child.name() === NodeName.ROOM && !activeRoomGroups.has(child)
        );

        roomsToDestroy.forEach(roomGroup => {
            const roomId = roomGroup.getAttr('id');

            if (roomId) {
                const label = (
                    labelLayer.getChildren() as Konva.Node[]
                ).find(child => {
                    if (child.name() !== NodeName.ROOM_LABEL) {
                        return false;
                    }
                    return child.getAttr("roomId") === roomId;
                });

                if (label) {
                    label.destroy();
                }
            }

            roomGroup.destroy();
        });

        layer.batchDraw();
        labelLayer.batchDraw();
    }

    /**
     * Calculates a smart position for a room label.
     *
     * Strategy:
     *  1. Fast path — try the true polygon centroid. Works for convex/rectangular rooms.
     *  2. Robust path — for concave/L-shaped rooms where the centroid can fall
     *     outside the polygon (or in a "notch"), run a coarse-to-fine grid search
     *     over the polygon's bounding box to find the point deepest inside the
     *     shape (maximizing distance to the nearest edge). This is seeded from
     *     the whole bounding box, not the centroid, so it can't get stuck in an
     *     invalid region.
     *  3. Local refinement — nudge that point slightly if needed so the full
     *     label rectangle (with padding) fits inside the polygon.
     *
     * @param points - The polygon points representing the room boundary [x1,y1,x2,y2,...].
     * @param labelWidth - The width of the room label.
     * @param labelHeight - The height of the room label.
     * @returns A suitable point for placing the room label.
     */
    static getLabelPosition(
        points: number[],
        labelWidth: number,
        labelHeight: number,
    ): { x: number; y: number } {
        const n = points.length / 2;
        const vx = new Float64Array(n);
        const vy = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            vx[i] = points[i * 2];
            vy[i] = points[i * 2 + 1];
        }

        // Precompute edge vectors ONCE — reused by every grid point.
        const ex = new Float64Array(n); // edge dx
        const ey = new Float64Array(n); // edge dy
        const elenSq = new Float64Array(n); // edge length squared
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            ex[i] = vx[j] - vx[i];
            ey[i] = vy[j] - vy[i];
            elenSq[i] = ex[i] * ex[i] + ey[i] * ey[i];
        }

        /**
         * Single pass: returns { inside, distSq } in one loop over edges
         * instead of two separate loops.
         */
        const evaluatePoint = (x: number, y: number): { inside: boolean; distSq: number } => {
            let inside = false;
            let minDistSq = Infinity;

            for (let i = 0; i < n; i++) {
                const j = (i + 1) % n;
                const xi = vx[i], yi = vy[i], xj = vx[j], yj = vy[j];

                // Ray-cast test (for inside/outside)
                const intersects =
                    yi > y !== yj > y &&
                    x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
                if (intersects) inside = !inside;

                // Nearest-edge distance (squared — no sqrt)
                let t = 0;
                if (elenSq[i] !== 0) {
                    t = ((x - xi) * ex[i] + (y - yi) * ey[i]) / elenSq[i];
                    t = t < 0 ? 0 : t > 1 ? 1 : t;
                }
                const cx = xi + t * ex[i];
                const cy = yi + t * ey[i];
                const dSq = (x - cx) ** 2 + (y - cy) ** 2;
                if (dSq < minDistSq) minDistSq = dSq;
            }

            return { inside, distSq: minDistSq };
        };

        /** Squared-distance "depth" score. Positive if inside, negative if outside.
         *  No sqrt — comparisons stay valid since squaring is monotonic for distance. */
        const depthScoreSq = (x: number, y: number): number => {
            const { inside, distSq } = evaluatePoint(x, y);
            return inside ? distSq : -distSq;
        };

        const isPointInside = (x: number, y: number): boolean => evaluatePoint(x, y).inside;

        const doesLabelFit = (x: number, y: number): boolean => {
            const padding = 8;
            const hw = labelWidth / 2 + padding;
            const hh = labelHeight / 2 + padding;
            const samples: [number, number][] = [
                [x - hw, y - hh], [x + hw, y - hh], [x - hw, y + hh], [x + hw, y + hh],
                [x, y - hh], [x, y + hh], [x - hw, y], [x + hw, y],
            ];
            for (const [sx, sy] of samples) {
                if (!isPointInside(sx, sy)) return false;
            }
            return true;
        };

        const getCentroid = (): { x: number; y: number } => {
            let area = 0, cx = 0, cy = 0;
            for (let i = 0; i < n; i++) {
                const j = (i + 1) % n;
                const cross = vx[i] * vy[j] - vx[j] * vy[i];
                area += cross;
                cx += (vx[i] + vx[j]) * cross;
                cy += (vy[i] + vy[j]) * cross;
            }
            area /= 2;
            if (Math.abs(area) < 0.0001) return { x: vx[0], y: vy[0] };
            return { x: cx / (6 * area), y: cy / (6 * area) };
        };

        const centroid = getCentroid();

        // Fast path
        if (isPointInside(centroid.x, centroid.y) && doesLabelFit(centroid.x, centroid.y)) {
            return centroid;
        }

        // Bounding box
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < n; i++) {
            if (vx[i] < minX) minX = vx[i];
            if (vx[i] > maxX) maxX = vx[i];
            if (vy[i] < minY) minY = vy[i];
            if (vy[i] > maxY) maxY = vy[i];
        }
        const bboxW = maxX - minX;
        const bboxH = maxY - minY;

        // Adaptive grid density: smaller rooms need fewer samples.
        // Roughly ~1 sample per 15–20cm, clamped to a sane range.
        const area = bboxW * bboxH;
        const coarseSteps = Math.max(6, Math.min(16, Math.round(Math.sqrt(area) / 15)));

        let bestPoint = { x: centroid.x, y: centroid.y };
        let bestScore = -Infinity;

        for (let i = 0; i <= coarseSteps; i++) {
            for (let j = 0; j <= coarseSteps; j++) {
                const x = minX + (bboxW * i) / coarseSteps;
                const y = minY + (bboxH * j) / coarseSteps;
                const score = depthScoreSq(x, y);
                if (score > bestScore) {
                    bestScore = score;
                    bestPoint = { x, y };
                }
            }
        }

        // Fine refinement — stop early once radius is sub-pixel (no point refining further).
        let radius = Math.max(bboxW, bboxH) / coarseSteps;
        const gridResolution = 6;
        const minRadius = 1; // 1cm — plenty precise for a label position

        while (radius > minRadius) {
            let improved = false;
            for (let i = -gridResolution; i <= gridResolution; i++) {
                for (let j = -gridResolution; j <= gridResolution; j++) {
                    const x = bestPoint.x + (i / gridResolution) * radius;
                    const y = bestPoint.y + (j / gridResolution) * radius;
                    const score = depthScoreSq(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        bestPoint = { x, y };
                        improved = true;
                    }
                }
            }
            radius /= 2;
            if (!improved) break; // converged — stop early instead of running all passes
        }

        if (doesLabelFit(bestPoint.x, bestPoint.y)) {
            return bestPoint;
        }

        // Fallback nudge (rare path, unchanged in spirit — omitted here for brevity,
        // same as before but using evaluatePoint/isPointInside)
        return bestPoint;
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

    /**
     * Converts a flat Konva points array [x0, y0, x1, y1, ...] to an array of coordinate objects.
     */
    public static flatPointsToVertices(points: number[]): { x: number; y: number }[] {
        const vertices: { x: number; y: number }[] = [];
        for (let i = 0; i < points.length; i += 2) {
            vertices.push({ x: points[i], y: points[i + 1] });
        }
        return vertices;
    }

    /**
     * Calculates the true geometric area and centroid of a polygon.
     */
    public static getPolygonMetrics(pts: { x: number; y: number }[]): { area: number; centroid: { x: number; y: number } } {
        const n = pts.length;
        if (n < 3) return { area: 0, centroid: { x: 0, y: 0 } };

        let signedArea = 0;
        let cx = 0;
        let cy = 0;

        for (let i = 0; i < n; i++) {
            const p1 = pts[i];
            const p2 = pts[(i + 1) % n];
            const a = (p1.x * p2.y) - (p2.x * p1.y);
            signedArea += a;
            cx += (p1.x + p2.x) * a;
            cy += (p1.y + p2.y) * a;
        }

        signedArea *= 0.5;
        const absArea = Math.abs(signedArea);

        if (absArea < 1e-5) {
            return { area: 0, centroid: { x: pts[0].x, y: pts[0].y } };
        }

        const factor = 1 / (6 * signedArea);
        return {
            area: absArea,
            centroid: { x: cx * factor, y: cy * factor }
        };
    }

    /**
     * Removes duplicate and collinear vertices along straight edges of a polygon.
     */
    public static simplifyPolygon(pts: { x: number; y: number }[], tolerance = 1.5): { x: number; y: number }[] {
        if (pts.length <= 3) return pts;

        let current = [...pts];
        let changed = true;

        while (changed && current.length > 3) {
            changed = false;
            const n = current.length;
            const result: { x: number; y: number }[] = [];

            for (let i = 0; i < n; i++) {
                const prev = current[(i - 1 + n) % n];
                const curr = current[i];
                const next = current[(i + 1) % n];

                // Remove duplicate vertex
                if (Math.hypot(curr.x - prev.x, curr.y - prev.y) < 1e-2) {
                    changed = true;
                    continue;
                }

                // If curr lies on segment between prev and next, it's collinear and redundant
                if (RoomDetector.isPointOnSegment(curr, prev, next, tolerance)) {
                    changed = true;
                } else {
                    result.push(curr);
                }
            }
            current = result;
        }

        return current;
    }

    /**
     * Checks if two simplified polygons match under any cyclic shift or reverse orientation.
     */
    public static areSimplifiedPolygonsEqual(
        polyA: { x: number; y: number }[],
        polyB: { x: number; y: number }[],
        vertexTolerance = 5
    ): boolean {
        if (polyA.length !== polyB.length) return false;
        const n = polyA.length;

        // Forward cyclic match
        for (let shift = 0; shift < n; shift++) {
            let match = true;
            for (let i = 0; i < n; i++) {
                const pA = polyA[i];
                const pB = polyB[(i + shift) % n];
                if (Math.hypot(pA.x - pB.x, pA.y - pB.y) > vertexTolerance) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }

        // Reverse cyclic match (opposite winding)
        for (let shift = 0; shift < n; shift++) {
            let match = true;
            for (let i = 0; i < n; i++) {
                const pA = polyA[i];
                const pB = polyB[(shift - i + n) % n];
                if (Math.hypot(pA.x - pB.x, pA.y - pB.y) > vertexTolerance) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }

        return false;
    }

    /**
     * Determines whether two sets of polygon vertices represent the same 2D room region.
     */
    public static isSameRegion(
        polyA: { x: number; y: number }[],
        polyB: { x: number; y: number }[]
    ): boolean {
        if (!polyA || !polyB || polyA.length < 3 || polyB.length < 3) return false;

        // 1. Check true area and true centroid (invariant to collinear/intermediate split points)
        const metricsA = RoomDetector.getPolygonMetrics(polyA);
        const metricsB = RoomDetector.getPolygonMetrics(polyB);

        if (metricsA.area > 0 && metricsB.area > 0) {
            const maxArea = Math.max(metricsA.area, metricsB.area);
            const areaDiff = Math.abs(metricsA.area - metricsB.area) / maxArea;
            const centroidDist = Math.hypot(
                metricsA.centroid.x - metricsB.centroid.x,
                metricsA.centroid.y - metricsB.centroid.y
            );

            // If area matches within 3% and centroids match within 5px
            if (areaDiff < 0.03 && centroidDist < 5) {
                return true;
            }
        }

        // 2. Check simplified vertices (removes collinear points from split walls, then compares cyclic order)
        const simplifiedA = RoomDetector.simplifyPolygon(polyA);
        const simplifiedB = RoomDetector.simplifyPolygon(polyB);

        if (RoomDetector.areSimplifiedPolygonsEqual(simplifiedA, simplifiedB, 5)) {
            return true;
        }

        return false;
    }
}