import * as THREE from 'three';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { ModelLoadCallbacks } from '../types/types';
import { LoaderPaths, ThreeProperties, TextureMapKeys, SelectableState } from '../Constants';

/**
 * Component class responsible for loading, cloning, caching, and configuring 3D assets (GLB/GLTF, OBJ, MTL).
 */
export class AssetLoader {
  /**
   * Cache map containing loaded GLTF/GLB models to prevent redundant network fetches.
   */
  private glbCache: Map<string, GLTF> = new Map();

  /**
   *  Loader instance for handling GLTF and GLB 3D models.
   */
  private gltfLoader: GLTFLoader;

  /**
   *  Draco decoder instance for loading compressed geometries.
   */
  private dracoLoader: DRACOLoader;

  /**
   * KTX2 loader instance for handling GPU-compressed textures.
   */
  private ktx2Loader: KTX2Loader;

  /**
   * Cache map containing loaded OBJ models.
   */
  private objCache: Map<string, THREE.Object3D> = new Map();

  /**
   * Loader instance for OBJ models.
   */
  private objLoader: OBJLoader = new OBJLoader();

  /**
   * Loader instance for MTL material definition files associated with OBJ models.
   */
  private mtlLoader: MTLLoader = new MTLLoader();

  /**
   *  Initializes the AssetLoader with Draco, KTX2, and GLTF loaders.
   */
  constructor() {
    // Set up Draco loader
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(LoaderPaths.DRACO_DECODER);
    this.dracoLoader.setDecoderConfig({ type: LoaderPaths.WASM_TYPE });
    this.dracoLoader.preload();

    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath(LoaderPaths.BASIS_TRANSCODER);

    // Set up GLTF loader with Draco, Meshopt, and KTX2 texture compression decoders.
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  }

  /**
   * Detects KTX2 texture transcoder support based on the provided WebGLRenderer.
   * @param renderer - The WebGL renderer to detect support with.
   */
  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.ktx2Loader.detectSupport(renderer);
  }

  /**
   * Load a GLB model from a URL.
   * Uses caching and returns a cloned instance.
   *
   * @param url Path or URL to the .glb file
   * @param callbacks Optional callbacks for tracking model loading progress, success, and errors
   * @param selectable Optional flag to set the model as selectable (defaults to false)
   * @returns Promise resolving to THREE.Object3D
   */
  public async loadGLB(url: string, callbacks?: ModelLoadCallbacks, selectable: boolean = false): Promise<THREE.Object3D> {
    if (this.glbCache.has(url)) {
      return this.cloneGLTF(this.glbCache.get(url)!, selectable);
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.glbCache.set(url, gltf);
          const cloned = this.cloneGLTF(gltf, selectable);
          callbacks?.onModelLoaded?.(cloned);
          resolve(cloned);
        },
        (xhr) => {
          callbacks?.onModelLoading?.(xhr);
        },
        (error) => {
          callbacks?.onModelError?.(error);
          reject(error);
        }
      );
    });
  }

  /**
   * Clears cached GLB models.
   */
  public clearCache(): void {
    this.glbCache.clear();
  }

  /**
   * Deep clone a GLTF scene to prevent shared references and configure selectability.
   *
   * @param gltf The original loaded GLTF object
   * @param selectable Flag indicating if the cloned object should be marked as selectable in userData
   * @returns A new THREE.Object3D copy
   */
  private cloneGLTF(gltf: GLTF, selectable: boolean): THREE.Object3D {
    const box = new THREE.Box3();
    box.setFromObject(gltf.scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    let modelWrapper = new THREE.Group();
    modelWrapper.position.copy(center);
    modelWrapper.attach(gltf.scene);

    modelWrapper.rotateX(Math.PI / 2);

    const clone = modelWrapper.clone(true);

    // for room configurator to check if the model is selectable or not
    if (selectable) {
      clone.userData.selectable = SelectableState.TRUE;
    }
    else {
      clone.userData.selectable = SelectableState.FALSE;
    }

    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;

        // Clone single or array material
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) => this.cloneMaterial(mat));
        } else {
          mesh.material = this.cloneMaterial(mesh.material);
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return clone;
  }

  /**
   * Clones a material, deep copying its texture maps and setting anisotropy.
   *
   * @param mat The original material to clone
   * @returns A new cloned THREE.Material instance
   */
  private cloneMaterial(mat: THREE.Material): THREE.Material {
    const cloned = mat.clone();

    const mapsToClone = [
      TextureMapKeys.MAP,
      TextureMapKeys.NORMAL_MAP,
      TextureMapKeys.ROUGHNESS_MAP,
      TextureMapKeys.METALNESS_MAP,
      TextureMapKeys.AO_MAP,
      TextureMapKeys.EMISSIVE_MAP,
      TextureMapKeys.ALPHA_MAP
    ];

    for (const key of mapsToClone) {
      const tex = (mat as any)[key];
      if (tex && tex.isTexture) {
        const clonedTex = tex.clone();
        clonedTex.anisotropy = 16;
        (clonedTex as any).needsUpdate = true;
        (cloned as any)[key] = clonedTex;
      }
    }

    cloned.needsUpdate = true;
    return cloned;
  }

  /**
   * Load an OBJ model, optionally with an MTL material file,
   * and add dynamic lighting around it.
   *
   * @param objUrl URL to the .obj file
   * @param mtlUrl Optional URL to the .mtl file
   * @returns Promise resolving to THREE.Group containing the model and lights
   */
  public async loadOBJ(objUrl: string, mtlUrl?: string): Promise<THREE.Group> {
    const cacheKey = mtlUrl ? `${objUrl}|${mtlUrl}` : objUrl;

    if (this.objCache.has(cacheKey)) {
      return this.attachLighting(this.cloneObject(this.objCache.get(cacheKey)!));
    }

    return new Promise(async (resolve, reject) => {
      try {
        const onObjectLoaded = (object: THREE.Object3D) => {
          this.objCache.set(cacheKey, object);
          const clonedObject = this.cloneObject(object);
          const groupWithLights = this.attachLighting(clonedObject);
          resolve(groupWithLights);
        };

        if (mtlUrl) {
          this.mtlLoader.load(
            mtlUrl,
            (materials) => {
              materials.preload();
              this.objLoader.setMaterials(materials);

              this.objLoader.load(
                objUrl,
                onObjectLoaded,
                undefined,
                (err) => {
                  reject(err);
                }
              );
            },
            undefined,
            (err) => {
              reject(err);
            }
          );
        } else {
          this.objLoader.load(
            objUrl,
            onObjectLoaded,
            undefined,
            (err) => {
              reject(err);
            }
          );
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Adds lighting around the object based on its bounding box.
   * @param object The loaded and cloned Object3D
   * @returns A THREE.Group containing the object and surrounding lights
   */
  private attachLighting(object: THREE.Object3D): THREE.Group {
    const group = new THREE.Group();
    group.add(object);

    // Calculate the object's bounding box
    const bbox = new THREE.Box3().setFromObject(object);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const radius = maxDim * 1.5;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(center.x, center.y + radius, center.z + radius);
    directionalLight.target.position.copy(center);
    directionalLight.intensity = 1;

    // Point lights around the object
    const pointLights = [
      new THREE.PointLight(0xffffff, 0.4),
      new THREE.PointLight(0xffffff, 0.4),
      new THREE.PointLight(0xffffff, 0.4),
      new THREE.PointLight(0xffffff, 0.4),
    ];

    pointLights[0].position.set(center.x + radius, center.y + radius, center.z + radius);
    pointLights[1].position.set(center.x - radius, center.y + radius, center.z - radius);
    pointLights[2].position.set(center.x, center.y - radius, center.z + radius);
    pointLights[3].position.set(center.x, center.y + radius, center.z - radius);

    group.add(ambientLight, directionalLight, directionalLight.target, ...pointLights);

    return group;
  }

  /**
    * Deep clone for generic Object3D instances (e.g., OBJ models).
    *
    * @param original The original THREE.Object3D instance
    * @returns A new cloned THREE.Object3D instance
    */
  private cloneObject(original: THREE.Object3D): THREE.Object3D {
    const clone = original.clone(true);

    clone.traverse((obj) => {
      if (ThreeProperties.IS_MESH in obj && obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    return clone;
  }
}
