import * as THREE from 'three';
import type { ModelLoadCallbacks } from '../types/types';
/**
 * Component class responsible for loading, cloning, caching, and configuring 3D assets (GLB/GLTF, OBJ, MTL).
 */
export declare class AssetLoader {
    /**
     * Cache map containing loaded GLTF/GLB models to prevent redundant network fetches.
     */
    private glbCache;
    /**
     *  Loader instance for handling GLTF and GLB 3D models.
     */
    private gltfLoader;
    /**
     *  Draco decoder instance for loading compressed geometries.
     */
    private dracoLoader;
    /**
     * KTX2 loader instance for handling GPU-compressed textures.
     */
    private ktx2Loader;
    /**
     * Cache map containing loaded OBJ models.
     */
    private objCache;
    /**
     * Loader instance for OBJ models.
     */
    private objLoader;
    /**
     * Loader instance for MTL material definition files associated with OBJ models.
     */
    private mtlLoader;
    /**
     *  Initializes the AssetLoader with Draco, KTX2, and GLTF loaders.
     */
    constructor();
    /**
     * Detects KTX2 texture transcoder support based on the provided WebGLRenderer.
     * @param renderer - The WebGL renderer to detect support with.
     */
    setRenderer(renderer: THREE.WebGLRenderer): void;
    /**
     * Load a GLB model from a URL.
     * Uses caching and returns a cloned instance.
     *
     * @param url Path or URL to the .glb file
     * @param callbacks Optional callbacks for tracking model loading progress, success, and errors
     * @param selectable Optional flag to set the model as selectable (defaults to false)
     * @returns Promise resolving to THREE.Object3D
     */
    loadGLB(url: string, callbacks?: ModelLoadCallbacks, selectable?: boolean): Promise<THREE.Object3D>;
    /**
     * Clears cached GLB models.
     */
    clearCache(): void;
    /**
     * Deep clone a GLTF scene to prevent shared references and configure selectability.
     *
     * @param gltf The original loaded GLTF object
     * @param selectable Flag indicating if the cloned object should be marked as selectable in userData
     * @returns A new THREE.Object3D copy
     */
    private cloneGLTF;
    /**
     * Clones a material, deep copying its texture maps and setting anisotropy.
     *
     * @param mat The original material to clone
     * @returns A new cloned THREE.Material instance
     */
    private cloneMaterial;
    /**
     * Load an OBJ model, optionally with an MTL material file,
     * and add dynamic lighting around it.
     *
     * @param objUrl URL to the .obj file
     * @param mtlUrl Optional URL to the .mtl file
     * @returns Promise resolving to THREE.Group containing the model and lights
     */
    loadOBJ(objUrl: string, mtlUrl?: string): Promise<THREE.Group>;
    /**
     * Adds lighting around the object based on its bounding box.
     * @param object The loaded and cloned Object3D
     * @returns A THREE.Group containing the object and surrounding lights
     */
    private attachLighting;
    /**
      * Deep clone for generic Object3D instances (e.g., OBJ models).
      *
      * @param original The original THREE.Object3D instance
      * @returns A new cloned THREE.Object3D instance
      */
    private cloneObject;
}
