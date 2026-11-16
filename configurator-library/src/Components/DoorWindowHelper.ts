import * as THREE from "three";
import { Config, DoorTypes, FixtureType, ImageAssets } from "../Constants";
import { type DoorWindowData } from "./WallCutter";

export type DoorType = DoorTypes.SINGLE | DoorTypes.DOUBLE | DoorTypes.SLIDING | "single" | "double" | "sliding";


/**
 * Helper class for generating 3D door and window models.
 */
export class DoorWindowHelper {
    private static readonly textureLoader = new THREE.TextureLoader();
    private static readonly textureCache = new Map<string, THREE.Texture>();

    private static readonly casingMat = new THREE.MeshStandardMaterial({ color: 0xEFEFEF, roughness: 0.6, metalness: 0.08 });
    private static readonly doorMat = new THREE.MeshStandardMaterial({ color: 0xFAFAFA, roughness: 0.45, metalness: 0.04 });
    private static readonly moldingMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4, metalness: 0.05 });
    private static readonly panelFaceMat = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.55, metalness: 0.03 });
    private static readonly handleMat = new THREE.MeshStandardMaterial({ color: 0x8A8A8A, roughness: 0.6, metalness: 0.08 });
    private static readonly trackMat = new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.35, metalness: 0.75 });
    private static readonly frameMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.8 });
    private static readonly glassMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        metalness: 0.5,
    });

    /** URL of the wood texture applied to all door surfaces (except glass panes). */
    private static readonly DOOR_TEXTURE_URL = ImageAssets.DOOR_AND_WINDOW_TEXTURE;

    /** URL of the wood texture applied to all window frame surfaces. */
    private static readonly WINDOW_FRAME_TEXTURE_URL = ImageAssets.DOOR_AND_WINDOW_TEXTURE;

    /** URL of the metallic/leather texture applied to door handles. */
    private static readonly HANDLE_TEXTURE_URL = ImageAssets.DOOR_HANDLE_TEXTURE;

    private static readonly DOOR_THRESHOLDS: { maxWidth: number; type: DoorType }[] = [
        { maxWidth: 135, type: DoorTypes.SINGLE },
        { maxWidth: 225, type: DoorTypes.DOUBLE },
        { maxWidth: Infinity, type: DoorTypes.SLIDING },
    ];

    /**
     * Loads or retrieves a cached texture and configures texture repetition.
     */
    public static loadTexture(
        url: string,
        repeatX = 1,
        repeatY = 1
    ): THREE.Texture {
        const cacheKey = `${url}_${repeatX}_${repeatY}`;

        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey)!;
        }

        // Supports both:
        // 1. Complete Base64 data URI: data:image/jpeg;base64,...
        // 2. Raw Base64 string
        const textureSource = url.startsWith("data:image/")
            ? url
            : `data:image/jpeg;base64,${url}`;

        const texture = this.textureLoader.load(textureSource);

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.colorSpace = THREE.SRGBColorSpace;

        this.textureCache.set(cacheKey, texture);
        return texture;
    }

    /**
     * Helper to clone a base material and attach a texture map.
     */
    private static createTexturedMaterial(
        baseMat: THREE.MeshStandardMaterial,
        textureUrl?: string,
        repeatX = 1,
        repeatY = 1
    ): THREE.MeshStandardMaterial {
        if (!textureUrl) return baseMat;

        const mat = baseMat.clone();
        mat.color.setHex(0xffffff);

        const texture = this.loadTexture(textureUrl, repeatX, repeatY);

        mat.map = texture;
        mat.roughness = 0.6;
        mat.metalness = 0.0;
        mat.needsUpdate = true;

        return mat;
    }
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
     * @param {THREE.Material} frameMaterial material
     * @param {THREE.Material} moldingMaterial material
     * @returns {THREE.Group} A 3D Object3D group representing the constructed panel.
     */
    private static makeRecessedPanel(
        pw: number,
        ph: number,
        leafD: number,
        moldW: number,
        faceMat: THREE.Material,
        isGlass = false,
        gridCols = 0,
        gridRows = 0,
        frameMaterial: THREE.Material = DoorWindowHelper.frameMat,
        moldingMaterial: THREE.Material = DoorWindowHelper.moldingMat
    ): THREE.Group {
        const g = new THREE.Group();
        const moldD = 0.01;
        const panelD = 0.001;

        for (const zSign of [1, -1]) {
            const zOff = zSign * (leafD / 2);

            const topM = new THREE.Mesh(new THREE.BoxGeometry(pw, moldW, moldD), moldingMaterial);
            topM.position.set(0, ph / 2 - moldW / 2, zOff + (zSign * moldD) / 2);
            g.add(topM);

            const botM = new THREE.Mesh(new THREE.BoxGeometry(pw, moldW, moldD), moldingMaterial);
            botM.position.set(0, -ph / 2 + moldW / 2, zOff + (zSign * moldD) / 2);
            g.add(botM);

            const leftM = new THREE.Mesh(new THREE.BoxGeometry(moldW, ph - moldW * 2, moldD), moldingMaterial);
            leftM.position.set(-pw / 2 + moldW / 2, 0, zOff + (zSign * moldD) / 2);
            g.add(leftM);

            const rightM = new THREE.Mesh(new THREE.BoxGeometry(moldW, ph - moldW * 2, moldD), moldingMaterial);
            rightM.position.set(pw / 2 - moldW / 2, 0, zOff + (zSign * moldD) / 2);
            g.add(rightM);

            if (!isGlass) {
                const faceW = pw - moldW * 2;
                const faceH = ph - moldW * 2;
                const face = new THREE.Mesh(
                    new THREE.BoxGeometry(faceW, faceH, panelD),
                    faceMat ?? DoorWindowHelper.panelFaceMat
                );
                face.position.set(0, 0, zOff + zSign * (moldD + panelD / 2));
                g.add(face);
            }
        }

        if (isGlass) {
            const faceW = pw - moldW * 2;
            const faceH = ph - moldW * 2;

            const cols = gridCols > 0 ? gridCols : 1;
            const rows = gridRows > 0 ? gridRows : 1;
            const dividerW = 0.04;
            const innerDepth = 0.1;
            const innerFrameT = 0.06;

            const sashW = faceW;
            const sashH = faceH;

            const sashTopGeo = new THREE.BoxGeometry(sashW, innerFrameT, innerDepth);
            const sashTop = new THREE.Mesh(sashTopGeo, frameMaterial);
            sashTop.position.set(0, sashH / 2 - innerFrameT / 2, 0);
            g.add(sashTop);

            const sashBot = new THREE.Mesh(sashTopGeo, frameMaterial);
            sashBot.position.set(0, -sashH / 2 + innerFrameT / 2, 0);
            g.add(sashBot);

            const sashVertGeo = new THREE.BoxGeometry(
                innerFrameT,
                sashH - innerFrameT * 2,
                innerDepth
            );

            const sashLeft = new THREE.Mesh(sashVertGeo, frameMaterial);
            sashLeft.position.set(-sashW / 2 + innerFrameT / 2, 0, 0);
            g.add(sashLeft);

            const sashRight = new THREE.Mesh(sashVertGeo, frameMaterial);
            sashRight.position.set(sashW / 2 - innerFrameT / 2, 0, 0);
            g.add(sashRight);

            const glassAreaW = sashW - innerFrameT * 2;
            const glassAreaH = sashH - innerFrameT * 2;

            const paneW = (glassAreaW - (cols - 1) * dividerW) / cols;
            const paneH = (glassAreaH - (rows - 1) * dividerW) / rows;

            const vDivGeo = new THREE.BoxGeometry(dividerW, glassAreaH, innerDepth);

            for (let i = 1; i < cols; i++) {
                const vDiv = new THREE.Mesh(vDivGeo, frameMaterial);
                vDiv.position.x =
                    -glassAreaW / 2 + i * paneW + (i - 0.5) * dividerW;
                vDiv.position.z = 0;
                g.add(vDiv);
            }

            const hDivGeo = new THREE.BoxGeometry(glassAreaW, dividerW, innerDepth);

            for (let j = 1; j < rows; j++) {
                const hDiv = new THREE.Mesh(hDivGeo, frameMaterial);
                hDiv.position.y =
                    glassAreaH / 2 - j * paneH - (j - 0.5) * dividerW;
                hDiv.position.z = 0;
                g.add(hDiv);
            }

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const pane = new THREE.Mesh(
                        new THREE.BoxGeometry(paneW, paneH, 0.01),
                        faceMat ?? DoorWindowHelper.glassMat
                    );

                    pane.position.x =
                        -glassAreaW / 2 +
                        i * (paneW + dividerW) +
                        paneW / 2;

                    pane.position.y =
                        glassAreaH / 2 -
                        j * (paneH + dividerW) -
                        paneH / 2;

                    pane.position.z = 0;
                    g.add(pane);
                }
            }
        }

        return g;
    }

    /** 
     * Builds a vertical bar door handle for front and back surfaces of a door leaf.
     *
     * @private
     * @param {number} leafD - Depth/thickness of the door leaf.
     * @returns {THREE.Group} A 3D Object3D group representing the door handles.
     */
    private static makeDoorHandle(
        leafD: number,
        showPlate = true
    ): THREE.Group {
        const g = new THREE.Group();

        const activeHandleMat = DoorWindowHelper.createTexturedMaterial(
            DoorWindowHelper.handleMat,
            DoorWindowHelper.HANDLE_TEXTURE_URL,
            3,
            3
        );

        for (const zSign of [1, -1]) {
            const zOff = zSign * (leafD / 2);
            const sideGroup = new THREE.Group();

            const plateW = 0.06;
            const plateH = 0.35;
            const plateD = 0.012;

            // Calculate offset based on whether the plate is visible
            const plateThickness = showPlate ? plateD : 0;

            if (showPlate) {
                const plate = new THREE.Mesh(
                    new THREE.BoxGeometry(plateW, plateH, plateD),
                    activeHandleMat
                );
                sideGroup.add(plate);
            }

            const stemLen = 0.05;

            const stemTop = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, stemLen, 16),
                activeHandleMat
            );
            stemTop.rotation.x = Math.PI / 2;
            stemTop.position.set(
                0,
                0.1,
                stemLen / 2 + plateThickness / 2
            );
            sideGroup.add(stemTop);

            const stemBot = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, stemLen, 16),
                activeHandleMat
            );
            stemBot.rotation.x = Math.PI / 2;
            stemBot.position.set(
                0,
                -0.1,
                stemLen / 2 + plateThickness / 2
            );
            sideGroup.add(stemBot);

            const barLen = 0.26;
            const barZ = stemLen + plateThickness / 2;

            const bar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.018, 0.018, barLen, 16),
                activeHandleMat
            );
            bar.position.set(0, 0, barZ);
            sideGroup.add(bar);

            const topCap = new THREE.Mesh(
                new THREE.SphereGeometry(0.018, 12, 12),
                activeHandleMat
            );
            topCap.position.set(0, barLen / 2, barZ);
            sideGroup.add(topCap);

            const botCap = new THREE.Mesh(
                new THREE.SphereGeometry(0.018, 12, 12),
                activeHandleMat
            );
            botCap.position.set(0, -barLen / 2, barZ);
            sideGroup.add(botCap);

            sideGroup.position.z = zOff + zSign * 0.001;

            if (zSign === -1) {
                sideGroup.rotation.y = Math.PI;
            }

            g.add(sideGroup);
        }

        return g;
    }

    /**
     * Builds a 3-section door leaf featuring a glass grid top section (65%) and a solid recessed panel bottom section (35%).
     *
     * @private
     * @param {number} w - Width of the door leaf.
     * @param {number} h - Height of the door leaf.
     * @param {number} leafD - Depth/thickness of the door leaf.
     * @returns {THREE.Group} A 3D Object3D group representing the door leaf assembly.
     */
    private static build3PanelLeaf(
        w: number,
        h: number,
        leafD: number
    ): THREE.Group {
        const g = new THREE.Group();

        // Door wood material — texture loaded from internal URL, glass panes stay plain
        const activeDoorMat = DoorWindowHelper.createTexturedMaterial(
            DoorWindowHelper.doorMat,
            DoorWindowHelper.DOOR_TEXTURE_URL
        );

        const margin = 0.07;
        const panelGap = 0.05;
        const moldW = 0.028;
        const panelW = w - margin * 2;
        const availH = h - margin * 2 - panelGap;

        const topH = availH * 0.65;
        const botH = availH * 0.35;

        const leftStile = new THREE.Mesh(
            new THREE.BoxGeometry(margin, h, leafD),
            activeDoorMat
        );
        leftStile.position.set(-w / 2 + margin / 2, h / 2, 0);
        g.add(leftStile);

        const rightStile = new THREE.Mesh(
            new THREE.BoxGeometry(margin, h, leafD),
            activeDoorMat
        );
        rightStile.position.set(w / 2 - margin / 2, h / 2, 0);
        g.add(rightStile);

        const botRail = new THREE.Mesh(
            new THREE.BoxGeometry(panelW, margin, leafD),
            activeDoorMat
        );
        botRail.position.set(0, margin / 2, 0);
        g.add(botRail);

        const midRail = new THREE.Mesh(
            new THREE.BoxGeometry(panelW, panelGap, leafD),
            activeDoorMat
        );
        midRail.position.set(0, margin + botH + panelGap / 2, 0);
        g.add(midRail);

        const topRail = new THREE.Mesh(
            new THREE.BoxGeometry(panelW, margin, leafD),
            activeDoorMat
        );
        topRail.position.set(0, h - margin / 2, 0);
        g.add(topRail);

        const botPanelY = margin + botH / 2;
        const topPanelY = margin + botH + panelGap + topH / 2;

        // Glass top panel: glass panes use plain glassMat (no texture), sash frames/dividers/molding get wood texture
        const topPanel = DoorWindowHelper.makeRecessedPanel(
            panelW,
            topH,
            leafD,
            moldW,
            DoorWindowHelper.glassMat, // glass panes — no texture
            true,
            2,
            3,
            activeDoorMat, // sash frame & dividers
            activeDoorMat  // molding trim
        );

        topPanel.position.y = topPanelY;
        g.add(topPanel);

        // Solid bottom panel: all parts get wood texture
        const botPanel = DoorWindowHelper.makeRecessedPanel(
            panelW,
            botH,
            leafD,
            moldW,
            activeDoorMat, // panel face
            false,
            0,
            0,
            activeDoorMat, // frame
            activeDoorMat  // molding trim
        );

        botPanel.position.y = botPanelY;
        g.add(botPanel);

        return g;
    }

    /**
     * Builds a single door assembly comprising one leaf and handles.
     *
     * @private
     * @param {number} w - Width of the door.
     * @param {number} h - Height of the door.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the single door.
     */
    private static buildSingleDoor(
        w: number,
        h: number,
        wallThickness: number
    ): THREE.Group {
        const g = new THREE.Group();
        g.name = "SingleDoor";

        const leafD = wallThickness * 0.4;

        const leaf = DoorWindowHelper.build3PanelLeaf(w, h, leafD);
        g.add(leaf);

        const handle = DoorWindowHelper.makeDoorHandle(leafD);
        handle.position.set(w / 2 - 0.1, h * 0.47, 0);
        g.add(handle);

        return g;
    }

    /**
     * Builds a double door assembly comprising two leaves, a center mullion, and dual handles.
     *
     * @private
     * @param {number} w - Width of the double door opening.
     * @param {number} h - Height of the double door opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the double door.
     */
    private static buildDoubleDoor(
        w: number,
        h: number,
        wallThickness: number
    ): THREE.Group {
        const g = new THREE.Group();
        g.name = "DoubleDoor";

        const gap = 0.025;
        const leafW = (w - gap) / 2;
        const leafD = wallThickness * 0.4;

        const activeDoorMat = DoorWindowHelper.createTexturedMaterial(
            DoorWindowHelper.casingMat,
            DoorWindowHelper.DOOR_TEXTURE_URL
        );

        const mullion = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, h, wallThickness),
            activeDoorMat
        );
        mullion.position.y = h / 2;
        g.add(mullion);

        for (const side of [-1, 1]) {
            const xOff = side * (leafW / 2 + gap / 2);

            const leaf = DoorWindowHelper.build3PanelLeaf(
                leafW,
                h,
                leafD
            );
            leaf.position.x = xOff;
            g.add(leaf);

            // Pass `false` as the second argument to hide the backplate
            const handle = DoorWindowHelper.makeDoorHandle(
                leafD,
                false
            );
            handle.position.set(
                xOff + -side * (leafW / 2 - 0.08),
                h * 0.47,
                0
            );
            g.add(handle);
        }

        return g;
    }

    /**
     * Builds a sliding door assembly comprising two overlapping panels and track hardware.
     *
     * @private
     * @param {number} w - Width of the sliding door opening.
     * @param {number} h - Height of the sliding door opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the sliding door.
     */
    private static buildSlidingDoor(
        w: number,
        h: number,
        wallThickness: number
    ): THREE.Group {
        const g = new THREE.Group();
        g.name = "SlidingDoor";

        const panelW = w / 2 - 0.01;
        const leafD = wallThickness * 0.3;

        // Create textured handle material instance
        const activeHandleMat = DoorWindowHelper.createTexturedMaterial(
            DoorWindowHelper.handleMat,
            DoorWindowHelper.HANDLE_TEXTURE_URL
        );

        const track = new THREE.Mesh(
            new THREE.BoxGeometry(
                w - 0.02,
                0.035,
                wallThickness + 0.02
            ),
            DoorWindowHelper.trackMat
        );
        track.position.y = h - 0.035 / 2;
        g.add(track);

        const bTrack = new THREE.Mesh(
            new THREE.BoxGeometry(w, 0.018, 0.07),
            DoorWindowHelper.trackMat
        );
        bTrack.position.y = 0.009;
        g.add(bTrack);

        for (let idx = 0; idx < 2; idx++) {
            const zOff = idx === 0 ? -0.03 : 0.03;
            const xOff = idx === 0 ? -w / 4 : w / 4;

            const leaf = DoorWindowHelper.build3PanelLeaf(
                panelW,
                h - 0.02,
                leafD
            );

            leaf.position.set(xOff, 0.01, zOff);
            leaf.name = idx === 0 ? "FixedPanel" : "SlidingPanel";
            g.add(leaf);

            const side = idx === 0 ? 1 : -1;

            // Pass activeHandleMat instead of DoorWindowHelper.handleMat
            const pull = new THREE.Mesh(
                new THREE.BoxGeometry(0.022, 0.18, 0.03),
                activeHandleMat
            );

            pull.position.x =
                xOff + side * (panelW / 2 - 0.06);

            pull.position.y = h * 0.47;

            pull.position.z =
                zOff +
                (idx === 0
                    ? -leafD / 2 - 0.015
                    : leafD / 2 + 0.015);

            g.add(pull);
        }

        return g;
    }

    /**
     * Creates a 3D door model dynamically selected based on width thresholds (single, double, or sliding).
     *
     * @public
     * @param {number} width - Total width of the door opening.
     * @param {number} height - Total height of the door opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the generated door.
     */
    public static createDoor(
        width: number,
        height: number,
        wallThickness: number
    ): THREE.Group {
        const rawWidth = width / (Config.WORLD_SCALE as number);

        const doorType =
            DoorWindowHelper.DOOR_THRESHOLDS.find(
                t => rawWidth <= t.maxWidth
            )?.type ??
            DoorWindowHelper.DOOR_THRESHOLDS[
                DoorWindowHelper.DOOR_THRESHOLDS.length - 1
            ].type;

        if (doorType === "double") {
            return DoorWindowHelper.buildDoubleDoor(
                width,
                height,
                wallThickness
            );
        }

        if (doorType === "sliding") {
            return DoorWindowHelper.buildSlidingDoor(
                width,
                height,
                wallThickness
            );
        }

        return DoorWindowHelper.buildSingleDoor(
            width,
            height,
            wallThickness
        );
    }

    /**
     * Creates a 3D window model with sash frame, vertical/horizontal dividers, and glass panes.
     *
     * @public
     * @param {number} width - Total width of the window opening.
     * @param {number} height - Total height of the window opening.
     * @param {number} wallThickness - Thickness of the wall.
     * @returns {THREE.Group} A 3D Object3D group representing the generated window.
     */
    public static createWindow(
        width: number,
        height: number,
        wallThickness: number,
    ): THREE.Group {
        const rows = 3;

        const rawWidth =
            width / (Config.WORLD_SCALE as number);

        const sections = Math.max(
            1,
            Math.round(rawWidth / 50)
        );

        const windowGroup = new THREE.Group();
        windowGroup.name = `Window_${sections}x${rows}`;

        // Window frame gets wood texture; glass panes stay plain/transparent
        const activeFrameMat =
            DoorWindowHelper.createTexturedMaterial(
                DoorWindowHelper.frameMat,
                DoorWindowHelper.WINDOW_FRAME_TEXTURE_URL
            );

        const dividerWidth = 0.04;
        const hDividerWidth = 0.04;
        const innerFrameThickness = 0.06;
        const innerDepth = Math.min(
            0.1,
            wallThickness * 0.5
        );

        const glassAreaWidth =
            width - innerFrameThickness * 2;

        const glassAreaHeight =
            height - innerFrameThickness * 2;

        const paneW =
            (glassAreaWidth -
                (sections - 1) * dividerWidth) /
            sections;

        const paneH =
            (glassAreaHeight -
                (rows - 1) * hDividerWidth) /
            rows;

        const createHollowFrame = (
            w: number,
            h: number,
            thickness: number,
            depth: number,
            zOffset = 0
        ): THREE.Group => {
            const group = new THREE.Group();
            group.position.z = zOffset;

            const horizGeo = new THREE.BoxGeometry(
                w,
                thickness,
                depth
            );

            const vertGeo = new THREE.BoxGeometry(
                thickness,
                h - thickness * 2,
                depth
            );

            const top = new THREE.Mesh(
                horizGeo,
                activeFrameMat
            );
            top.position.y =
                h / 2 - thickness / 2;
            group.add(top);

            const bottom = new THREE.Mesh(
                horizGeo,
                activeFrameMat
            );
            bottom.position.y =
                -h / 2 + thickness / 2;
            group.add(bottom);

            const left = new THREE.Mesh(
                vertGeo,
                activeFrameMat
            );
            left.position.x =
                -w / 2 + thickness / 2;
            group.add(left);

            const right = new THREE.Mesh(
                vertGeo,
                activeFrameMat
            );
            right.position.x =
                w / 2 - thickness / 2;
            group.add(right);

            return group;
        };

        // Sash frame (the only frame now fills the opening)
        windowGroup.add(
            createHollowFrame(
                width,
                height,
                innerFrameThickness,
                innerDepth,
                0
            )
        );

        // Vertical dividers
        const vDividerGeo = new THREE.BoxGeometry(
            dividerWidth,
            glassAreaHeight,
            innerDepth
        );

        for (let i = 1; i < sections; i++) {
            const divider = new THREE.Mesh(
                vDividerGeo,
                activeFrameMat
            );

            divider.position.z = 0;

            divider.position.x =
                -glassAreaWidth / 2 +
                i * paneW +
                (i - 0.5) * dividerWidth;

            windowGroup.add(divider);
        }

        // Horizontal dividers
        const hDividerGeo = new THREE.BoxGeometry(
            glassAreaWidth,
            hDividerWidth,
            innerDepth
        );

        for (let j = 1; j < rows; j++) {
            const divider = new THREE.Mesh(
                hDividerGeo,
                activeFrameMat
            );

            divider.position.z = 0;

            divider.position.y =
                glassAreaHeight / 2 -
                j * paneH -
                (j - 0.5) * hDividerWidth;

            windowGroup.add(divider);
        }

        // Glass panes
        const glassGeo = new THREE.BoxGeometry(
            paneW,
            paneH,
            0.01
        );

        for (let i = 0; i < sections; i++) {
            for (let j = 0; j < rows; j++) {
                const glass = new THREE.Mesh(
                    glassGeo,
                    DoorWindowHelper.glassMat
                );

                glass.position.z = 0;

                glass.position.x =
                    -glassAreaWidth / 2 +
                    i * (paneW + dividerWidth) +
                    paneW / 2;

                glass.position.y =
                    glassAreaHeight / 2 -
                    j * (paneH + hDividerWidth) -
                    paneH / 2;

                windowGroup.add(glass);
            }
        }
        return windowGroup;
    }

    /**
      * Helper method to add the door and windows to the roomGroup by creating them.
      * @param active3DWallGroup - The group containing the walls to which doors and windows will be added.
      * @param doorWindows - Array of door and window data.
      * @param wallThickness - Thickness of the walls.
     */
    public static addDoorAndWindow(wallGroup: THREE.Group ,doorWindows: DoorWindowData[], wallThickness: number): void {
        if (!wallGroup) {
        return;
        }
        for (const doorWindow of doorWindows) {
        let model: THREE.Group;
        if (doorWindow.type === FixtureType.DOOR) {
            model = DoorWindowHelper.createDoor(doorWindow.width, doorWindow.height, wallThickness);
        } else {
            model = DoorWindowHelper.createWindow(doorWindow.width, doorWindow.height, wallThickness);
        }

        const bbox = new THREE.Box3().setFromObject(model);
        const center = bbox.getCenter(new THREE.Vector3());

        const wrapper = new THREE.Group();
        wrapper.name = `${doorWindow.type}_${doorWindow.id}`;
        model.position.set(-center.x, -center.y, -center.z);
        wrapper.add(model);

        wrapper.userData = {
            id: doorWindow.id,
            type: doorWindow.type,
            selectable: "false",
            wallId: doorWindow.wallId
        };

        // Find the parent wall this door/window belongs to
        const wallMesh = wallGroup.children.find(
            (child: THREE.Object3D) => (child as any).wall_id === doorWindow.wallId
        ) as THREE.Mesh | undefined;

        if (wallMesh) {
            // Convert world transform to wall-local transform
            const localPos = doorWindow.position.clone();
            wallMesh.worldToLocal(localPos);
            wrapper.position.copy(localPos);

            const wallWorldQuaternion = new THREE.Quaternion();
            wallMesh.getWorldQuaternion(wallWorldQuaternion);
            wrapper.quaternion
            .copy(wallWorldQuaternion)
            .invert()
            .multiply(doorWindow.quaternion);

            // Add as child of the wall mesh
            wallMesh.add(wrapper);
        } 
      }
   }
}

