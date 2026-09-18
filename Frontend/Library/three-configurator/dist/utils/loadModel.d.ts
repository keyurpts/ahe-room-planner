import { Object3D, WebGLRenderer } from 'three';
/**
 * Loads a GLTF/GLB model from the specified URL
 *
 * @param url - The URL of the GLTF/GLB model to load
 * @returns A Promise that resolves to the loaded Object3D
 */
export declare function loadModel(url: string, renderer?: WebGLRenderer): Promise<Object3D>;
