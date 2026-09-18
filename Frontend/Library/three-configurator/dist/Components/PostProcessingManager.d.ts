import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
/**
 * Manages the Three.js post-processing pipeline.
 *
 * Pass order:
 *   1. RenderPass      — base scene render
 *   2. GTAOPass        — ground-truth ambient occlusion (contact shadows / depth)
 *   3. SSRPass         — screen-space reflections (glossy floors/surfaces)
 *   4. ShaderPass      — unsharp-mask texture sharpening
 *   5. SMAAPass        — subpixel morphological anti-aliasing (smooth edges)
 *   6. ShaderPass      — cinematic vignette
 *   7. OutputPass      — tone-mapping & sRGB colour-space conversion
 */
export declare class PostProcessingManager {
    /**
     * The main EffectComposer instance managing the post-processing stack.
     */
    composer: EffectComposer;
    /**
     * Base render pass for the 3D scene.
     */
    private renderPass;
    /**
     * Ground-truth ambient occlusion pass for contact shadows.
     */
    private gtaoPass;
    /**
     * UnrealBloomPass instance for generating glow effects.
     */
    private bloomPass;
    /**
     * Screen-space reflections pass for glossy surfaces.
     */
    private ssrPass;
    /**
     * Unsharp-mask sharpening pass to enhance texture detail.
     */
    private sharpenPass;
    /**
     * Subpixel morphological anti-aliasing pass for smoothing jagged lines.
     */
    private smaaPass;
    /**
     * ShaderPass for the cinematic vignette effect.
     */
    private vignettePass;
    /**
     * Output pass for tone-mapping and color space conversion.
     */
    private outputPass;
    /**
     * Initializes the PostProcessingManager with a WebGLRenderer, Scene, and Camera.
     * Configures the composer stack including RenderPass, GTAO, Sharpen, SMAA, Vignette, and OutputPass.
     * @param renderer - The WebGLRenderer instance.
     * @param scene - The THREE.Scene instance.
     * @param camera - The THREE.Camera instance.
     */
    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera);
    /**
     * Resize all passes when the canvas dimensions change.
     * @param width - The new width.
     * @param height - The new height.
     */
    UpdateSize(width: number, height: number): void;
    /**
     * Retarget scene-dependent passes after the active camera changes.
     * @param camera - The new camera instance.
     */
    updateCamera(camera: THREE.Camera): void;
    /**
     * Render one frame through the post-processing pipeline.
     * @param deltaTime - The time delta.
     */
    render(deltaTime?: number): void;
    /**
     * Adjusts the ambient-occlusion blend strength.
     * @param value - Blend strength (0 = off, 1 = full).
     */
    SetAOIntensity(value: number): void;
    /**
     * Adjusts the sharpening amount.
     * @param value - Sharpening amount (0 = off, 1 = strong).
     */
    SetSharpenAmount(value: number): void;
    /**
     * Adjusts the vignette strength.
     * @param value - Vignette strength (0 = off, 1 = strong).
     */
    SetVignetteIntensity(value: number): void;
}
