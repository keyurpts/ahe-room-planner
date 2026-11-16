declare module "troika-three-text" {
    import { Mesh, ColorRepresentation, Material } from "three";

    export interface TroikaTextRenderInfo {
        // [minX, minY, maxX, maxY] of the rendered text block, in local units.
        blockBounds: [number, number, number, number];
        // troika exposes more fields (visibleBounds, glyphBounds, etc.) — add as needed.
    }

    export class Text extends Mesh {
        text: string;
        fontSize: number;
        font?: string;
        color: ColorRepresentation;
        fillOpacity: number;
        anchorX: number | "left" | "center" | "right";
        anchorY: number | "top" | "top-baseline" | "middle" | "bottom-baseline" | "bottom";
        depthOffset: number;
        material: Material;
        textRenderInfo: TroikaTextRenderInfo | null;

        sync(callback?: () => void): void;
        dispose(): void;
    }
}