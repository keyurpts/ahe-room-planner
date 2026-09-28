import * as THREE from "three";
import { Text } from "troika-three-text";
import { ANNOTATION_DEFAULTS, AnnotationMode } from "../Constants";
import { interBold, interRegular } from '../Fonts';

export interface LabelData {
    id: string;
    roomName: string;
    startPosition: THREE.Vector3;
    area?: string;

    // Optional floor height used by FLOOR mode. Falls back to startPosition.y.
    floorY?: number;

    // Wall height, used by LINE_ANNOTATION mode as the target height for the
    wallHeight?: number;

    // Center of the complete model
    center: THREE.Vector3;

    // Radius of the complete model
    radius: number;
}

interface TextCardOptions {
    // true -> (0,0) is the card center, false -> (0,0) is the top-center.
    centered?: boolean;

    // Whether the card's materials are depth tested.
    depthTest?: boolean;

    // Overrides DEFAULTS_CONFIG.BACKGROUND_OPACITY for this card's background quad.
    // Pass 1 for a fully solid (non-transparent-looking) background.
    backgroundOpacity?: number;

    // Whether to create the rounded-rect background quad at all. Default true.
    // Pass false for a text-only card with no background/pill behind it.
    showBackground?: boolean;

    // Overrides DEFAULTS_CONFIG.TEXT_COLOR for this card's title text.
    textColor?: THREE.ColorRepresentation;

    fontSize?: number;
}

// Positions used to build/reposition a LINE_ANNOTATION label.
interface LineAnnotationPositions {
    startPosition: THREE.Vector3;
    elbowPosition: THREE.Vector3;
    endPosition: THREE.Vector3;
}

const DEFAULTS_CONFIG = ANNOTATION_DEFAULTS;

// Scratch vector reused every frame in update() to avoid per-frame allocation.
const _worldPosHelper = new THREE.Vector3();

export class RoomAnnotationManager {
    private static instance: RoomAnnotationManager;

    // The root object (a per-floor `floorGroup`) that the manager
    // traverses on demand to find every label it has created, instead of
    // keeping its own labels/cards registries in sync. 
    private rootGroup: THREE.Object3D | undefined;

    private _mode: AnnotationMode = AnnotationMode.LINE_ANNOTATION;

    // Wall height shared by every room. Set via updateWallHeight() and used
    // to seed any label created afterwards, so callers don't have to pass
    // wallHeight into every createLabel() call individually.
    private _currentWallHeight: number | undefined;

    private constructor() { }

    /**
     * Currently active annotation mode (read-only; use setMode() to change it).
     */
    public get mode(): AnnotationMode {
        return this._mode;
    }

    /**
     * Registers the root object (the `floorGroup`) that the manager should
     * traverse when it needs to find every label it has created 
     * @param rootGroup - The object under which labels will be nested.
     * @returns void
     */
    public registerRootGroup(rootGroup: THREE.Object3D): void {
        this.rootGroup = rootGroup;
    }

    /**
     * Stops the manager from traversing the currently registered root
     * (e.g. when the floor is torn down). Does not dispose or remove
     * anything itself — callers should dispose the labels (see
     * disposeLabel) and/or the root object separately.
     * @returns void
     */
    public unregisterRootGroup(): void {
        this.rootGroup = undefined;
    }

    /**
     * Walks the registered root group and invokes callback for each label
     * group found under it (identified by userData.type === "room-label",
     * set in createLabel), regardless of how deeply it's nested (e.g.
     * under a floorMesh). This is the single place that knows how to find
     * "every label", replacing what used to be a `labels` Map kept in
     * sync by hand. No-op if no root is registered yet.
     * @param callback - Invoked once per label group with its group and data.
     * @returns void
     */
    private forEachLabel(
        callback: (label: THREE.Group, data: LabelData) => void
    ): void {
        if (!this.rootGroup) {
            return;
        }

        this.rootGroup.traverse((object) => {
            if (object.userData?.type !== "room-label") {
                return;
            }

            const data = object.userData?.data as LabelData | undefined;

            if (!data) {
                return;
            }

            callback(object as THREE.Group, data);
        });
    }

    /**
     * Switches the annotation mode. If the mode actually changed, the old
     * content of every existing label is removed/disposed and new content
     * for the new mode is built from the data stored in each group's userData.
     * The label groups themselves are kept, so they stay attached to the scene.
     * @param mode - The mode to activate.
     * @returns void
     */
    public setMode(mode: AnnotationMode): void {
        if (mode === this._mode) {
            return;
        }

        this._mode = mode;

        this.forEachLabel((group) => {
            this.clearContent(group);

            this.buildContent(group);
        });
    }

    /**
     * Updates the wall height for every label at once (all walls share the
     * same height) and repositions them accordingly.
     * Also updates the manager's current height, so any label created
     * afterwards via createLabel() is automatically seeded with it.
     * @param wallHeight - The new wall height, shared by every room.
     * @returns void
     */
    public refreshAnnotationByWallHeight(wallHeight: number): void {
        if (this._currentWallHeight === wallHeight) {
            return; // already current, nothing to do for anyone
        }

        this._currentWallHeight = wallHeight;

        this.forEachLabel((group, data) => {
            if (data.wallHeight === wallHeight) {
                return;
            }

            data.wallHeight = wallHeight;

            if (this._mode === AnnotationMode.LINE_ANNOTATION) {
                this.repositionLineAnnotation(group, data);
            }
        });
    }

    /**
     * Call once per frame, BEFORE renderer.render(scene, camera), for
     * every active LINE_ANNOTATION label to face the camera and hold a constant
     * screen size.
     * @param camera - The active scene camera.
     * @returns void
     */
    public update(camera: THREE.Camera): void {
        if (this._mode !== AnnotationMode.LINE_ANNOTATION || !this.rootGroup) {
            return;
        }

        this.rootGroup.traverse((object) => {
            if (!object.name.startsWith("LabelCard_")) {
                return;
            }

            const card = object as THREE.Group;

            card.getWorldPosition(_worldPosHelper);

            const distance = camera.position.distanceTo(_worldPosHelper);

            const scale = distance * DEFAULTS_CONFIG.SCREEN_SPACE_SCALE;

            card.quaternion.copy(camera.quaternion);

            card.scale.set(scale, scale, scale);
        });
    }

    /**
     * Returns the singleton instance of the manager, creating it on
     * first use.
     * @returns The shared RoomAnnotationManager instance.
     */
    public static getInstance(): RoomAnnotationManager {
        if (!RoomAnnotationManager.instance) {
            RoomAnnotationManager.instance = new RoomAnnotationManager();
        }

        return RoomAnnotationManager.instance;
    }

    /**
     * Creates the label group, stores the label data in its userData, and
     * fills it according to the active mode. The returned group is stable:
     * changing the mode later rebuilds its children, not the group itself.
     * In NONE mode the group is returned empty.
     * @param data - Room, position, and model context for the label.
     * @returns A THREE.Group that holds the label content for the active mode.
     */
    public createLabel(data: LabelData): THREE.Group {
        const group = new THREE.Group();

        group.name = `Label_${data.id}`;

        group.userData = {
            type: "room-label",
            id: data.id,
            roomName: data.roomName,

            // Full label data, kept so the label can be rebuilt on mode change.
            // wallHeight falls back to the manager's shared height (set via
            // updateWallHeight()) when the caller doesn't pass one.
            data: {
                ...data,
                wallHeight: data.wallHeight ?? this._currentWallHeight,
                startPosition: data.startPosition.clone(),
                center: data.center.clone(),
            } as LabelData,
        };

        // Not registered anywhere here — the caller is responsible for
        // attaching `group` somewhere under a root that was passed to
        // registerRootGroup(), which is how forEachLabel() will find it
        // later (via userData.type === "room-label", set above).
        this.buildContent(group);

        return group;
    }

    /**
     * Fills a label group with content for the currently active mode,
     * using the LabelData stored in the group's userData.
     * @param group - The label group created by createLabel.
     * @returns void
     */
    private buildContent(group: THREE.Group): void {
        const data = group.userData?.data as LabelData | undefined;

        if (!data) {
            return;
        }

        switch (this._mode) {
            case AnnotationMode.LINE_ANNOTATION:
                this.buildLineAnnotation(group, data);

                break;

            case AnnotationMode.FLOOR_ANNOTATION:
                this.buildFloor(group, data);

                break;

            case AnnotationMode.NONE:
            default:
                break;
        }
    }

    /**
     * Removes and disposes everything inside a label group (the group
     * itself is kept) and unregisters its billboard card.
     * @param group - The label group to empty.
     * @returns void
     */
    private clearContent(group: THREE.Group): void {
        [...group.children].forEach((child) => {
            this.disposeObject(child);

            group.remove(child);
        });
    }

    /**
     * Computes the start/elbow/end world positions for a LINE_ANNOTATION label from
     * its data. Shared by buildLineAnnotation() (fresh build) and
     * repositionLineAnnotation() (in-place update), so the geometry math lives in
     * exactly one place.
     * @param data - Room, position, and model context for the label.
     * @returns The three world-space points of the leader line.
     */
    private computeLineAnnotationPositions(data: LabelData): LineAnnotationPositions {
        const labelHeight =
            data.wallHeight !== undefined ? data.wallHeight * DEFAULTS_CONFIG.WALL_HEIGHT_UNIT_SCALE : DEFAULTS_CONFIG.LABEL_HEIGHT;

        const startPosition = data.startPosition.clone();

        // Direction from model center -> room; pushes the label outside the model.
        const outwardDirection = new THREE.Vector3().subVectors(startPosition, data.center).setY(0);

        // Safety case: room is exactly at model center.
        if (outwardDirection.lengthSq() < 0.0001) {
            outwardDirection.set(1, 0, 0);
        }

        outwardDirection.normalize();

        const rise = labelHeight - startPosition.y;

        const run = DEFAULTS_CONFIG.LINE_SLOPE > 0 ? rise / DEFAULTS_CONFIG.LINE_SLOPE : 0;

        const elbowPosition = startPosition.clone().addScaledVector(outwardDirection, Math.max(0, run));

        elbowPosition.y = labelHeight;

        // endPosition is the TOP-CENTER anchor point of the label card.
        const endPosition = elbowPosition.clone().addScaledVector(outwardDirection, DEFAULTS_CONFIG.HORIZONTAL_SEGMENT_LENGTH);

        endPosition.y = labelHeight;

        return { startPosition, elbowPosition, endPosition };
    }

    /**
     * LINE_ANNOTATION mode: connector lines, anchor dot, and an SDF/MSDF text card
     * (troika-three-text) that billboards to the camera and holds constant
     * screen size.
     * @param group - Label group to fill.
     * @param data - Room, position, and model context for the label.
     * @returns void
     */
    private buildLineAnnotation(group: THREE.Group, data: LabelData): void {
        const { startPosition, elbowPosition, endPosition } = this.computeLineAnnotationPositions(data);

        const diagonalLine = this.createGradientLine(
            [startPosition, elbowPosition],
            [DEFAULTS_CONFIG.LINE_FADE_START_ALPHA as number, 1],
            `LabelDiagonalLine_${data.id}`
        );

        group.add(diagonalLine);

        const horizontalLine = this.createGradientLine([elbowPosition, endPosition], [1, 1], `LabelHorizontalLine_${data.id}`);

        group.add(horizontalLine);

        const dot = this.createDot(endPosition, data.id);

        group.add(dot);

        const card = this.createTextCard(data, endPosition);

        group.add(card);
    }

    /**
     * Repositions an existing LINE_ANNOTATION label's leader lines, dot, and card to
     * match the label's current data (e.g. after updateWallHeight()) without
     * disposing/recreating the troika text nodes or the background mesh.
     * @param group - The label group, already built in LINE_ANNOTATION mode.
     * @param data - Room, position, and model context for the label.
     * @returns void
     */
    private repositionLineAnnotation(group: THREE.Group, data: LabelData): void {
        const { startPosition, elbowPosition, endPosition } = this.computeLineAnnotationPositions(data);

        const diagonalLine = group.getObjectByName(`LabelDiagonalLine_${data.id}`) as THREE.Line | undefined;

        if (diagonalLine) {
            this.setLinePoints(diagonalLine, startPosition, elbowPosition);
        }

        const horizontalLine = group.getObjectByName(`LabelHorizontalLine_${data.id}`) as THREE.Line | undefined;

        if (horizontalLine) {
            this.setLinePoints(horizontalLine, elbowPosition, endPosition);
        }

        const dot = group.getObjectByName(`LabelDot_${data.id}`) as THREE.Sprite | undefined;

        dot?.position.copy(endPosition);

        const card = group.getObjectByName(`LabelCard_${data.id}`) as THREE.Group | undefined;

        card?.position.copy(endPosition);
    }

    /**
     * Overwrites both endpoints of a two-point gradient line's position
     * attribute in place and flags it for a GPU upload, avoiding a
     * geometry/material rebuild for a simple reposition.
     * @param line - The line created by createGradientLine.
     * @param start - New world-space position of the first vertex.
     * @param end - New world-space position of the second vertex.
     * @returns void
     */
    private setLinePoints(line: THREE.Line, start: THREE.Vector3, end: THREE.Vector3): void {
        const positionAttribute = line.geometry.getAttribute("position") as THREE.BufferAttribute;

        positionAttribute.setXYZ(0, start.x, start.y, start.z);

        positionAttribute.setXYZ(1, end.x, end.y, end.z);

        positionAttribute.needsUpdate = true;

        line.geometry.computeBoundingSphere();
    }

    /**
     * FLOOR mode: a flat text card lying on the floor at the room position.
     * It is not billboarded and not registered in `cards`, so update() never
     * touches it; it keeps a fixed world-space size relative to the model.
     * @param group - Label group to fill.
     * @param data - Room, position, and model context for the label.
     * @returns void
     */
    private buildFloor(group: THREE.Group, data: LabelData): void {
        const floorY = data.floorY ?? data.startPosition.y;

        const position = new THREE.Vector3(
            data.startPosition.x,
            floorY + data.radius * DEFAULTS_CONFIG.FLOOR_LABEL_LIFT_PER_RADIUS,
            data.startPosition.z
        );

        const card = this.createTextCard(data, position, {
            centered: true,
            depthTest: true,
            showBackground: false,
            textColor: DEFAULTS_CONFIG.FLOOR_LABEL_TEXT_COLOR,
            fontSize: DEFAULTS_CONFIG.FONT_SIZE_FLOOR_ANNOTATION as number,
        });

        card.name = `LabelFloorCard_${data.id}`;

        // Lay the card flat: local +Y (text "up") -> world -Z, local +Z (normal) -> world +Y.
        card.rotation.x = -Math.PI / 2;

        const scale = Math.max(data.radius * DEFAULTS_CONFIG.FLOOR_LABEL_SCALE_PER_RADIUS, 0.000001);

        card.scale.setScalar(scale);

        group.add(card);
    }

    /**
     * Builds the text card: an SDF background quad plus one or two
     * troika-three-text (MSDF) nodes for the title/subtitle. Orientation and
     * scaling are applied by the caller (billboarded via update() for
     * LINE_ANNOTATION, laid flat for FLOOR).
     * @param data - Room data supplying the title/subtitle strings.
     * @param endPosition - World-space anchor for the card.
     * @param options - Anchor (top-center vs center), depth-test settings,
     * and an optional per-card fontSize override (LINE_ANNOTATION and
     * FLOOR_ANNOTATION use different sizes; see FONT_SIZE_LINE_ANNOTATION /
     * FONT_SIZE_FLOOR_ANNOTATION).
     * @returns A THREE.Group containing the card.
     */
    private createTextCard(
        data: LabelData,
        endPosition: THREE.Vector3,
        options: TextCardOptions = {}
    ): THREE.Group {
        const centered = options.centered ?? false;

        const depthTest = options.depthTest ?? false;

        const showBackground = options.showBackground ?? true;

        const textColor = options.textColor ?? DEFAULTS_CONFIG.TEXT_COLOR;

        const card = new THREE.Group();

        // Callers that don't pass an explicit fontSize (currently just
        // buildLineAnnotation) get the LINE_ANNOTATION size. buildFloor
        // always passes FONT_SIZE_FLOOR_ANNOTATION explicitly.
        const fontSize = options.fontSize ?? DEFAULTS_CONFIG.FONT_SIZE_LINE_ANNOTATION;

        card.name = `LabelCard_${data.id}`;

        card.position.copy(endPosition);

        const title = new Text();

        title.text = data.roomName;
        title.fontSize = fontSize;
        title.font = interBold; // undefined -> troika's bundled default font
        title.color = textColor;
        title.anchorX = "center";
        title.anchorY = "top";
        title.depthOffset = -1; // draw in front of the background quad
        title.material.depthTest = depthTest;
        title.renderOrder = 1;
        title.frustumCulled = false;
        title.name = `LabelTitle_${data.id}`;

        card.add(title);

        const areaText = data.area ? `Area: ${data.area} sq.m` : "";

        let subtitle: Text | null = null;

        if (areaText) {
            subtitle = new Text();

            subtitle.text = areaText;
            subtitle.fontSize = DEFAULTS_CONFIG.SUBTITLE_FONT_SIZE;
            subtitle.font = interRegular; // undefined -> troika's bundled default font
            subtitle.color = DEFAULTS_CONFIG.SUBTITLE_COLOR;
            subtitle.fillOpacity = DEFAULTS_CONFIG.SUBTITLE_OPACITY;
            subtitle.anchorX = "center";
            subtitle.anchorY = "top";
            subtitle.depthOffset = -1;
            subtitle.material.depthTest = depthTest;
            subtitle.renderOrder = 1;
            subtitle.frustumCulled = false;
            subtitle.name = `LabelSubtitle_${data.id}`;

            card.add(subtitle);
        }

        let background: THREE.Mesh | null = null;

        if (showBackground) {
            background = this.createRoundedRectMesh(`LabelBackground_${data.id}`);

            (background.material as THREE.ShaderMaterial).depthTest = depthTest;

            background.renderOrder = 0;

            card.add(background);
        }

        // Troika lays text out asynchronously (font load + glyph shaping),
        // so the background is sized/positioned once real measurements
        // ("textRenderInfo") are available for whichever node(s) exist.
        const layout = () => {
            const titleInfo = title.textRenderInfo;

            if (!titleInfo) {
                return;
            }

            const titleWidth = titleInfo.blockBounds[2] - titleInfo.blockBounds[0];

            // Use the fontSize actually resolved for THIS card (LINE_ANNOTATION
            // vs FLOOR_ANNOTATION use different sizes), not a fixed constant,
            // or the background/title vertical layout will be sized for the
            // wrong font size.
            const titleHeight = fontSize + 6;

            let subtitleWidth = 0;

            let subtitleHeight = 0;

            if (subtitle) {
                const subtitleInfo = subtitle.textRenderInfo;

                if (areaText && !subtitleInfo) {
                    return; // wait for subtitle layout too before sizing the card
                }

                if (subtitleInfo) {
                    subtitleWidth = subtitleInfo.blockBounds[2] - subtitleInfo.blockBounds[0];
                    subtitleHeight = DEFAULTS_CONFIG.SUBTITLE_FONT_SIZE + DEFAULTS_CONFIG.LINE_SPACING;
                }
            }

            const textWidth = Math.max(titleWidth, subtitleWidth);

            const cardWidth = textWidth + DEFAULTS_CONFIG.PADDING_X * 2;

            const cardHeight = titleHeight + subtitleHeight + DEFAULTS_CONFIG.PADDING_Y * 2;

            // Default anchor is top-center (0, 0) and the card grows downward.
            // When centered, shift everything up by half the height so (0, 0)
            // is the middle of the card.
            const yShift = centered ? cardHeight / 2 : 0;

            if (background) {
                background.scale.set(cardWidth, cardHeight, 1);

                background.position.set(0, -cardHeight / 2 + yShift, 0);
            }

            title.position.set(0, -DEFAULTS_CONFIG.PADDING_Y + yShift, 0.01);

            if (subtitle) {
                subtitle.position.set(0, -(DEFAULTS_CONFIG.PADDING_Y + titleHeight) + yShift, 0.01);
            }
        };

        title.sync(layout);

        if (subtitle) {
            subtitle.sync(layout);
        }

        return card;
    }

    /**
     * Procedural, resolution-independent rounded-rect quad rendered via
     * an SDF in the fragment shader — no per-label canvas/texture needed.
     * @param name - Name assigned to the resulting mesh.
     * @returns The background mesh.
     */
    private createRoundedRectMesh(name: string): THREE.Mesh {
        const geometry = new THREE.PlaneGeometry(1, 1);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(DEFAULTS_CONFIG.BACKGROUND_COLOR) },
                opacity: { value: DEFAULTS_CONFIG.BACKGROUND_OPACITY },
                radius: { value: 0.12 }, // normalized corner radius; tune against BORDER_RADIUS/PADDING ratio
            },

            vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(position, 1.0);
          }
        `,

            fragmentShader: `
          uniform vec3 color;
          uniform float opacity;
          uniform float radius;
          varying vec2 vUv;

          // Signed distance to a rounded box, centered at origin, half-size b, corner radius r.
          float sdRoundBox(vec2 p, vec2 b, float r) {
            vec2 q = abs(p) - b + r;
            return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
          }

          void main() {
            vec2 p = vUv - 0.5;

            float d = sdRoundBox(p, vec2(0.5), radius);

            float aa = fwidth(d);

            float alpha = 1.0 - smoothstep(-aa, aa, d);

            gl_FragColor = vec4(color, alpha * opacity);
          }
        `,

            transparent: true,
            depthTest: false,
            depthWrite: false,
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.name = name;
        mesh.frustumCulled = false;

        return mesh;
    }

    /**
     * Creates a connector line whose opacity is interpolated per-vertex
     * (e.g. faded out at the room end, solid by the label end). Uses a
     * ShaderMaterial since LineBasicMaterial only supports one flat
     * opacity for the whole line.
     * @param points - The line's vertices, in order.
     * @param alphas - Per-vertex alpha values, matching points by index.
     * @param name - Name assigned to the resulting THREE.Line.
     * @returns The gradient-opacity line.
     */
    private createGradientLine(
        points: THREE.Vector3[],
        alphas: number[],
        name: string
    ): THREE.Line {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        geometry.setAttribute("alpha", new THREE.Float32BufferAttribute(alphas, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(DEFAULTS_CONFIG.LINE_COLOR) },
                opacity: { value: DEFAULTS_CONFIG.LINE_OPACITY },
            },

            vertexShader: `
          attribute float alpha;
          varying float vAlpha;

          void main() {
            vAlpha = alpha;

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(position, 1.0);
          }
        `,

            fragmentShader: `
          uniform vec3 color;
          uniform float opacity;
          varying float vAlpha;

          void main() {
            gl_FragColor =
              vec4(color, vAlpha * opacity);
          }
        `,

            transparent: true,
            depthTest: false,
            depthWrite: false,
        });

        const line = new THREE.Line(geometry, material);

        line.name = name;

        return line;
    }

    /**
     * Creates the small anchor dot sprite marking the label's connection
     * point on the model.
     * @param position - World position for the dot.
     * @param id - Label id, used to name the sprite.
     * @returns The dot sprite.
     */
    private createDot(
        position: THREE.Vector3,
        id: string
    ): THREE.Sprite {
        const canvas = document.createElement("canvas");

        const size = 32;

        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Unable to create dot canvas context.");
        }

        context.clearRect(0, 0, size, size);

        context.beginPath();

        context.arc(size / 2, size / 2, 7, 0, Math.PI * 2);

        context.fillStyle = DEFAULTS_CONFIG.LINE_COLOR;

        context.fill();

        const texture = new THREE.CanvasTexture(canvas);

        texture.colorSpace = THREE.SRGBColorSpace;

        texture.minFilter = THREE.LinearFilter;

        texture.magFilter = THREE.LinearFilter;

        texture.generateMipmaps = false;

        const material = new THREE.SpriteMaterial({
            map: texture,

            transparent: true,

            depthTest: false,
            depthWrite: false,

            sizeAttenuation: false,
        });

        const sprite = new THREE.Sprite(material);

        sprite.name = `LabelDot_${id}`;

        sprite.position.copy(position);

        sprite.scale.set(0.02, 0.02, 0.02);

        return sprite;
    }

    /**
     * Disposes geometries, materials, and textures (including troika Text
     * nodes) of an object and all its descendants. Does not detach it.
     * @param root - The object whose subtree should be disposed.
     * @returns void
     */
    private disposeObject(root: THREE.Object3D): void {
        root.traverse((object) => {
            if (object instanceof Text) {
                object.dispose();

                return;
            }

            if (object instanceof THREE.Sprite) {
                const material = object.material as THREE.SpriteMaterial;

                if (material.map) {
                    material.map.dispose();
                }

                material.dispose();

                return;
            }

            if (object instanceof THREE.Line) {
                object.geometry.dispose();

                (object.material as THREE.Material).dispose();

                return;
            }

            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();

                (object.material as THREE.Material).dispose();
            }
        });
    }

    /**
     * Fully removes a label: disposes its content and detaches the group
     * from its parent. Since the manager no longer keeps its own
     * labels/cards registries, there's nothing further to unregister here —
     * once detached, forEachLabel()'s traversal simply won't find it
     * anymore. If the whole floor (the registered root itself) is being
     * torn down, also call unregisterRootGroup().
     * @param label - The label group returned by createLabel.
     * @returns void
     */
    public disposeLabel(label: THREE.Group): void {
        this.clearContent(label);

        label.removeFromParent();
    }
}