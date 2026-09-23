import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AssetLoader } from "./AssetLoader";
import { CollisionSystem } from "./CollisionSystem";
import { RequiredStrings, CameraViews } from "../Constants";
// import fs from "node:fs/promises";
// import path from "node:path";

/**
 * ModelController is responsible for controlling the visibility and behavior
 * of a 3D model (THREE.Object3D) in a scene, including autorotation, preset camera views,
 * and replacing models dynamically.
 */
export class ModelController {
  /**
   * Map of model instances to their auto-rotation speeds.
   */
  private autoRotateModels: Map<THREE.Object3D, number> = new Map();
  /**
   * RequestAnimationFrame ID for the auto-rotation loop.
   */
  private animationId?: number;
  /**
   * The active camera used for viewing the scene.
   */
  private camera: THREE.Camera;
  /**
   * OrbitControls associated with the active camera.
   */
  private controls: OrbitControls;
  /**
   * THREE.Scene instance containing the models.
   */
  private scene: THREE.Scene;
  /**
   * HTML element housing the 3D renderer.
   */
  private container: HTMLElement;
  /**
   * Loader helper for loading GLB/OBJ models.
   */
  private assetLoader: AssetLoader;
  /**
   * Collision detection helper for checking object intersections.
   */
  private collisionSystem: CollisionSystem;
  /**
   * Camera view transition duration in milliseconds.
   */
  private transitionDuration = 1000;
  /**
   * Array containing all placed THREE.Object3D models in the scene.
   */
  placedModels: THREE.Object3D[] = [];

  /**
   * Center point around which auto-rotation occurs.
   */
  private autoRotateCenter: THREE.Vector3 = new THREE.Vector3();

  /**
   * Speed of the auto-rotation in radians per frame.
   */
  private autoRotateSpeed: number = 0;

  /**
   * Radius of the camera's auto-rotation orbit.
   */
  private autoRotateRadius: number = 5;

  /**
   * Current angle of the auto-rotation.
   */
  private autoRotateAngle: number = 0;

  /**
   * Target Object3D being auto-rotated.
   */
  private autoRotateTarget: THREE.Object3D | null = null;

  /**
   * Box helper showing the selection bounds of the active model.
   */
  public currentBoxHelper: THREE.LineSegments | null = null;

  /**
   * @param scene - THREE.Scene instance containing the model
   * @param camera - THREE.Camera (Perspective or Orthographic) used to view the scene
   * @param controls - OrbitControls linked to the camera & renderer
   * @param container - HTML container element used for size/aspect calculations
   * @param collisionSystem - CollisionSystem instance for spatial intersection tests
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: any,
    container: HTMLElement,
    collisionSystem: CollisionSystem,
    assetLoader?: AssetLoader
  ) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.container = container;
    this.collisionSystem = collisionSystem;
    this.assetLoader = assetLoader ?? new AssetLoader();
  }

  /** 
   * Show the given model 
   */
  public showModel(): void {
    let model = ModelController.GetRoomModel(this.scene);
    if (model) model.visible = true;
  }

  /** 
   * Hide the given model 
   */
  public hideModel(): void {
    let model = ModelController.GetRoomModel(this.scene);
    if (model) model.visible = false;
  }

  /**
   * Updates the active camera and controls references.
   *
   * @param camera - The new THREE.Camera instance.
   * @param controls - The new OrbitControls instance.
   */
  public updateCamera(camera: THREE.Camera, controls: any): void {
    this.camera = camera;
    this.controls = controls;
  }

  /**
   * Enables auto-rotation for a specific model at a given speed.
   *
   * @param model - The model object to auto-rotate.
   * @param speed - The rotation speed in radians per frame (default is 0.01).
   */
  public enableAutoRotate(model: THREE.Object3D, speed: number = 0.01): void {
    this.autoRotateTarget = model;
    this.autoRotateCenter.copy(model.position);
    this.autoRotateSpeed = speed;
    this.autoRotateRadius = this.camera.position.distanceTo(
      this.autoRotateCenter
    );
    this.controls.enabled = false;
    if (!this.animationId) this.startAnimationLoop();
  }

  /**
   * Disables auto-rotation for all models.
   */
  public disableAutoRotate(): void {
    this.autoRotateTarget = null;
    this.controls.enabled = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
  }

  /**
   * Starts the internal auto-rotation animation loop.
   */
  private startAnimationLoop(): void {
    const animate = () => {
      if (this.autoRotateTarget) {
        this.autoRotateAngle += this.autoRotateSpeed;

        const x =
          this.autoRotateCenter.x +
          this.autoRotateRadius * Math.sin(this.autoRotateAngle);
        const z =
          this.autoRotateCenter.z +
          this.autoRotateRadius * Math.cos(this.autoRotateAngle);

        this.camera.position.set(x, this.camera.position.y, z);
        this.camera.lookAt(this.autoRotateCenter);
      }

      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Fits an OrthographicCamera to the bounding box of a model.
   *
   * @param camera - The THREE.OrthographicCamera to fit.
   * @param model - The model object to fit the camera to.
   * @param padding - Multiplier for padding around the model (default is 1.5).
   */
  private fitOrthographicToModel(
    camera: THREE.OrthographicCamera,
    model: THREE.Object3D,
    padding: number = 1.5
  ): void {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const aspect = this.container.clientWidth / this.container.clientHeight;

    const halfHeight = (maxDim * padding) / 2;
    const halfWidth = halfHeight * aspect;

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;

    camera.zoom = 1;
    camera.updateProjectionMatrix();
  }

  /**
   * Repositions camera for a preset view of the model.
   * @param model - The Object3D to frame
   * @param offset - Distance from model center (default: bounding sphere radius * 2)
   * @param dir - Direction vector indicating view direction
   */
  private setCameraView(
    model: THREE.Object3D,
    dir: THREE.Vector3,
    offset?: number
  ): void {
    const bbox = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(new THREE.Vector3());
    const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
    const distance = offset ?? radius * 1.8;

    if (this.camera instanceof THREE.OrthographicCamera) {
      this.fitOrthographicToModel(this.camera, model);
    }

    const targetPosition = center
      .clone()
      .add(dir.clone().normalize().multiplyScalar(distance));
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(this.camera.position.clone().sub(center));

    const start = {
      theta: spherical.theta,
      phi: spherical.phi,
      radius: spherical.radius,
      target: this.controls?.target?.clone() || center.clone(),
    };

    const endVec = targetPosition.clone().sub(center);
    const endSpherical = new THREE.Spherical();
    endSpherical.setFromVector3(endVec);

    const end = {
      theta: endSpherical.theta,
      phi: endSpherical.phi,
      radius: endSpherical.radius,
      target: center.clone(),
    };

    const startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const t = Math.min((now - startTime) / this.transitionDuration, 1);
      const ease = t * t * (3 - 2 * t);

      const interpolated = new THREE.Spherical(
        THREE.MathUtils.lerp(start.radius, end.radius, ease),
        THREE.MathUtils.lerp(start.phi, end.phi, ease),
        THREE.MathUtils.lerp(start.theta, end.theta, ease)
      );

      const newPosition = new THREE.Vector3()
        .setFromSpherical(interpolated)
        .add(center);
      this.camera.position.copy(newPosition);

      // Smoothly interpolate the controls target if it exists
      if ((this.controls as any)?.target) {
        (this.controls as any).target.copy(
          start.target.clone().lerp(end.target, ease)
        );
        (this.controls as any).update?.();
      } else {
        this.camera.lookAt(center);
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Snaps the camera to the front view of the model.
   *
   * @param model - The model object to focus on.
   * @param offset - Optional distance multiplier offset.
   */
  public viewFront(model: THREE.Object3D, offset?: number): void {
    this.setCameraView(model, new THREE.Vector3(0, 0, 1), offset);
  }

  /**
   * Snaps the camera to the back view of the model.
   *
   * @param model - The model object to focus on.
   * @param offset - Optional distance multiplier offset.
   */
  public viewBack(model: THREE.Object3D, offset?: number): void {
    this.setCameraView(model, new THREE.Vector3(0, 0, -1), offset);
  }

  /**
   * Snaps the camera to the left view of the model.
   *
   * @param model - The model object to focus on.
   * @param offset - Optional distance multiplier offset.
   */
  public viewLeft(model: THREE.Object3D, offset?: number): void {
    this.setCameraView(model, new THREE.Vector3(-1, 0, 0), offset);
  }

  /**
   * Snaps the camera to the right view of the model.
   *
   * @param model - The model object to focus on.
   * @param offset - Optional distance multiplier offset.
   */
  public viewRight(model: THREE.Object3D, offset?: number): void {
    this.setCameraView(model, new THREE.Vector3(1, 0, 0), offset);
  }

  /**
   * Snaps the camera to the top view of the model.
   *
   * @param model - The model object to focus on.
   * @param offset - Optional distance multiplier offset.
   */
  public viewTop(model: THREE.Object3D, offset?: number): void {
    this.setCameraView(model, new THREE.Vector3(0, 1, 0), offset);
  }

  /**
   * Snaps the camera to the bottom view of the model.
   *
   * @param model - The model object to focus on.
   * @param offset - Optional distance multiplier offset.
   */
  public viewBottom(model: THREE.Object3D, offset?: number): void {
    this.setCameraView(model, new THREE.Vector3(0, -1, 0), offset);
  }

  /**
   * Replace an existing model in the scene with a new one.
   * Transfers autorotation settings if present.
   * @param oldModel - The current THREE.Object3D in the scene
   * @param newModel - The new THREE.Object3D to add
   */
  public replaceModel(
    oldModel: THREE.Object3D,
    newModel: THREE.Object3D
  ): void {
    const speed = this.autoRotateModels.get(oldModel);
    if (speed !== undefined) {
      this.autoRotateModels.delete(oldModel);
      this.autoRotateModels.set(newModel, speed);
    }

    newModel.visible = oldModel.visible;

    this.scene.remove(oldModel);
    this.scene.add(newModel);
  }

  /**
   * Replaces a model in the scene using a custom `pid` identifier stored in `userData`.
   *
   * Searches the scene for a node with a matching `pid`, then replaces it with the root child
   * of a newly loaded model. The `pid` is preserved on the new model.
   *
   * @param {string} id - The custom `pid` of the object to replace.
   * @param {string} url - The URL to load the replacement model from (GLB format).
   * @returns {Promise<void>}
   */
  public async replaceSwappableOption(
    id: string,
    url: string,
    partIdentifierProperty: string
  ): Promise<void> {
    let m1 = undefined;
    let pid = undefined;

    let propKey = partIdentifierProperty;
    if (partIdentifierProperty && partIdentifierProperty.includes("/")) {
      propKey = partIdentifierProperty.split("/").pop() as string;
    }

    this.scene.traverse((node) => {
      if (partIdentifierProperty && partIdentifierProperty === "name") {
        if (node.name) {
          if (node.name === id) {
            m1 = node;
            pid = node.name;
          }
        }
      } else {
        if (node.userData[propKey] === id) {
          m1 = node;
          pid = node.userData[propKey];
        }
      }
    });

    let m2 = await this.assetLoader.loadGLB(url);

    if (m1 && m2) {
      let propKey = partIdentifierProperty;
      if (partIdentifierProperty && partIdentifierProperty.includes("/")) {
        propKey = partIdentifierProperty.split("/").pop() as string;
      }

      if (partIdentifierProperty && partIdentifierProperty === "name") {
        m2.children[0].name = pid!;
      } else {
        m2.children[0].userData[propKey] = pid;
      }

      let oldMaterial: THREE.Material | null = null;
      (m1 as THREE.Object3D).traverse((node: any) => {
        if (node instanceof THREE.Mesh && !oldMaterial) {
          oldMaterial = node.material;
        }
      });

      // Apply old material to new model
      if (oldMaterial) {
        m2.children[0].traverse((node: any) => {
          if (node instanceof THREE.Mesh) {
            node.material = oldMaterial;
          }
        });
      }

      (m1 as THREE.Object3D).parent?.attach(m2.children[0]);
      (m1 as THREE.Object3D).parent?.remove(m1);
    }
  }

  /**
   * Retrieves a configurable part (THREE.Object3D) from the scene by its ID and identifier property.
   *
   * @param id - The ID value to match.
   * @param partIdentifierProperty - The property to check on the object (e.g. 'name' or custom user data key).
   * @returns The matching THREE.Object3D object, or null if not found.
   */
  public getConfigurablePartById(
    id: string,
    partIdentifierProperty: string
  ): THREE.Object3D | null {
    let m1 = null;

    let propKey = partIdentifierProperty;
    if (partIdentifierProperty && partIdentifierProperty.includes("/")) {
      propKey = partIdentifierProperty.split("/").pop() as string;
    }

    this.scene.traverse((node) => {
      if (partIdentifierProperty && partIdentifierProperty === "name") {
        if (node.name) {
          if (node.name === id) {
            m1 = node;
          }
        }
      } else {
        if (node.userData[propKey] === id) {
          m1 = node;
        }
      }
    });

    return m1;
  }

  /**
   * Replaces the texture of a model's mesh using a provided image URL.
   *
   * Searches for a node with a matching `pid`, then loads and applies the texture
   * to all mesh materials (Basic, Standard, or Phong) under that node.
   *
   * @param {string} id - The custom `pid` of the object to apply the texture to.
   * @param {string} texUrl - The URL of the texture image to apply.
   * @returns {Promise<void>}
   */
  public async replaceTexture(
    id: string,
    texUrl: string,
    partIdentifierProperty: string
  ): Promise<void> {
    let configurablePart = this.getConfigurablePartById(
      id,
      partIdentifierProperty
    );

    if (configurablePart) {
      this.applyTexture(configurablePart, texUrl);
    }
  }

  /**
   * Loads a texture from a URL and applies it to the material(s) of all meshes in the object hierarchy.
   *
   * @param object - The THREE.Object3D instance (and its children) to apply the texture to.
   * @param texUrl - The URL of the texture image.
   */
  public async applyTexture(object: THREE.Object3D, texUrl: string): Promise<void> {

    // const savedPath = await this.downloadImage(texUrl);

    // console.log(`Saved: ${savedPath}`);

    const localTextureUrl = await this.downloadImage(texUrl);


    object.traverse((node: any) => {
      if (node instanceof THREE.Mesh) {

        // check for uvs and generate if not present

        const geometry = node.geometry;

        if (!geometry || !geometry.attributes.position) return;

        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const min = bbox.min;
        const max = bbox.max;
        const size = new THREE.Vector3().subVectors(max, min);

        const pos = geometry.attributes.position;
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        const norm = geometry.attributes.normal;

        const uvs = new Float32Array(pos.count * 2);

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = pos.getZ(i);

          const nx = norm ? Math.abs(norm.getX(i)) : 0;
          const ny = norm ? Math.abs(norm.getY(i)) : 1;
          const nz = norm ? Math.abs(norm.getZ(i)) : 0;

          let u = 0, v = 0;

          // Major axis projection
          if (nx >= ny && nx >= nz) {
            // YZ plane (Side)
            u = size.z > 0 ? (z - min.z) / size.z : 0;
            v = size.y > 0 ? (y - min.y) / size.y : 0;
          } else if (ny >= nx && ny >= nz) {
            // XZ plane (Top / Bottom)
            u = size.x > 0 ? (x - min.x) / size.x : 0;
            v = size.z > 0 ? (z - min.z) / size.z : 0;
          } else {
            // XY plane (Front / Back)
            u = size.x > 0 ? (x - min.x) / size.x : 0;
            v = size.y > 0 ? (y - min.y) / size.y : 0;
          }

          uvs[i * 2] = u;
          uvs[i * 2 + 1] = v;
        }

        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.attributes.uv.needsUpdate = true;

        // /////////////////////////////////////////

        // texture and bump map

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          ctx!.drawImage(img, 0, 0, 512, 512);

          // Auto-generate Grayscale Bump Map
          const bumpCanvas = document.createElement('canvas');
          bumpCanvas.width = 512;
          bumpCanvas.height = 512;
          const bumpCtx = bumpCanvas.getContext('2d');
          bumpCtx!.drawImage(img, 0, 0, 512, 512);
          const imgData = bumpCtx!.getImageData(0, 0, 512, 512);
          for (let i = 0; i < imgData.data.length; i += 4) {
            const avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
            imgData.data[i] = avg;
            imgData.data[i + 1] = avg;
            imgData.data[i + 2] = avg;
          }
          bumpCtx!.putImageData(imgData, 0, 0);

          // Sync 2D source preview
          const previewCanvas = document.getElementById('texture-2d-canvas');
          if (previewCanvas) {
            // @ts-ignore
            const pCtx = previewCanvas.getContext('2d');
            pCtx.drawImage(canvas, 0, 0, 256, 256);
          }

          const activeTextureMap = new THREE.CanvasTexture(canvas);
          const activeBumpMap = new THREE.CanvasTexture(bumpCanvas);

          // applyTextureTransforms(activeTextureMap);
          activeTextureMap.wrapS = THREE.RepeatWrapping;
          activeTextureMap.wrapT = THREE.RepeatWrapping;
          activeTextureMap.repeat.set(1, 1);
          activeTextureMap.offset.set(0, 0);
          activeTextureMap.center.set(0.5, 0.5); // Rotate around center
          activeTextureMap.rotation = 0 * (Math.PI / 180);
          activeTextureMap.minFilter = THREE.LinearMipmapLinearFilter;
          activeTextureMap.needsUpdate = true;


          // applyTextureTransforms(activeBumpMap);
          activeBumpMap.wrapS = THREE.RepeatWrapping;
          activeBumpMap.wrapT = THREE.RepeatWrapping;
          activeBumpMap.repeat.set(1, 1);
          activeBumpMap.offset.set(0, 0);
          activeBumpMap.center.set(0.5, 0.5); // Rotate around center
          activeBumpMap.rotation = 0 * (Math.PI / 180);
          activeBumpMap.minFilter = THREE.LinearMipmapLinearFilter;
          activeBumpMap.needsUpdate = true;

          node.material.map = activeTextureMap;
          node.material.bumpMap = activeBumpMap;
          node.material.needsUpdate = true;

          // showToast(`Applied texture: ${file.name}`);
          // updateCodeSnippet();
        };
        // img.src = texUrl;
        img.src = localTextureUrl;


        // ////////////////////

        // const textureLoader = new THREE.TextureLoader();
        // textureLoader.load(texUrl, (tex) => {
        //   tex.wrapS = THREE.RepeatWrapping;
        //   tex.wrapT = THREE.RepeatWrapping;
        //   tex.repeat.set(2, 2);
        //   tex.anisotropy = 16;
        //   tex.needsUpdate = true;

        //   if (
        //     node.material instanceof THREE.MeshBasicMaterial ||
        //     node.material instanceof THREE.MeshStandardMaterial ||
        //     node.material instanceof THREE.MeshPhongMaterial
        //   ) {
        //     node.material.map = tex;
        //     node.material.needsUpdate = true;
        //   }
        // });
      }
    });
  }

  /**
   * Updates the material properties of a model's mesh using MeshPhysicalMaterial.
   *
   * Searches for a node with a matching `pid`, then applies the given material properties
   * (color, metalness, roughness, side) to all mesh nodes under that node using MeshPhysicalMaterial.
   *
   * @param {string} id - The custom `pid` of the object to apply the material changes to.
   * @param {{
   *   color?: string | number,
   *   metalness?: number,
   *   roughness?: number,
   *   side?: THREE.Side
   * }} props - The material properties to apply.
   * @returns {Promise<void>}
   */
  public async updateMaterialProperties(
    id: string,
    props: {
      color?: string | number;
      metalness?: number;
      roughness?: number;
      side?: THREE.Side;
      texture?: string;
    },
    partIdentifierProperty: string
  ): Promise<void> {
    let targetNode: THREE.Object3D | null = null;

    let propKey = partIdentifierProperty;
    if (partIdentifierProperty && partIdentifierProperty.includes("/")) {
      propKey = partIdentifierProperty.split("/").pop() as string;
    }

    this.scene.traverse((node) => {
      if (partIdentifierProperty && partIdentifierProperty === "name") {
        if (node.name) {
          if (node.name === id) {
            targetNode = node;
          }
        }
      } else {
        if (node.userData[propKey] === id) {
          targetNode = node;
        }
      }
    });

    if (!targetNode) return;

    (targetNode as THREE.Object3D).traverse((node: any) => {
      if (node instanceof THREE.Mesh) {
        let mat = node.material as THREE.MeshPhysicalMaterial;

        if (!(mat instanceof THREE.MeshPhysicalMaterial)) {
          mat = new THREE.MeshPhysicalMaterial();
          node.material = mat;
        }

        if (props.color !== undefined) mat.color.set(props.color);
        if (props.metalness !== undefined) mat.metalness = props.metalness;
        if (props.roughness !== undefined) mat.roughness = props.roughness;
        if (props.side !== undefined) mat.side = props.side;

        mat.needsUpdate = true;
      }
    });
  }

  /**
   * Updates material properties (color, metalness, roughness, side, and texture) of all meshes in the model hierarchy.
   *
   * @param model - The THREE.Object3D instance to update.
   * @param props - Object containing new material property values.
   */
  public updateMaterial(
    model: THREE.Object3D,
    props: {
      color?: string | number;
      metalness?: number;
      roughness?: number;
      side?: THREE.Side;
      texture?: string;
    }
  ): void {
    model.traverse((node: any) => {
      if (node instanceof THREE.Mesh) {
        let mat = node.material as THREE.Material;

        // Preserve existing maps & properties if material is not MeshPhysicalMaterial
        const preserved: Partial<THREE.MeshPhysicalMaterial> = {};
        if ("map" in mat && (mat as any).map) preserved.map = (mat as any).map;
        if ("normalMap" in mat && (mat as any).normalMap)
          preserved.normalMap = (mat as any).normalMap;
        if ("roughnessMap" in mat && (mat as any).roughnessMap)
          preserved.roughnessMap = (mat as any).roughnessMap;
        if ("metalnessMap" in mat && (mat as any).metalnessMap)
          preserved.metalnessMap = (mat as any).metalnessMap;
        if ("aoMap" in mat && (mat as any).aoMap)
          preserved.aoMap = (mat as any).aoMap;
        if ("emissiveMap" in mat && (mat as any).emissiveMap)
          preserved.emissiveMap = (mat as any).emissiveMap;

        if (!(mat instanceof THREE.MeshPhysicalMaterial)) {
          const newMat = new THREE.MeshPhysicalMaterial();
          Object.assign(newMat, preserved);
          node.material = newMat;
          mat = newMat;
        }

        const physicalMat = mat as THREE.MeshPhysicalMaterial;

        // Restore maps if still missing and no new texture is provided
        if (!props.texture && preserved.map && !physicalMat.map) {
          physicalMat.map = preserved.map;
        }

        // Apply property overrides
        if (props.color !== undefined) physicalMat.color.set(props.color);
        if (props.metalness !== undefined)
          physicalMat.metalness = props.metalness;
        if (props.roughness !== undefined)
          physicalMat.roughness = props.roughness;
        if (props.side !== undefined) physicalMat.side = props.side;

        // Override with new texture if given
        if (props.texture) {
          const loader = new THREE.TextureLoader();
          loader.load(props.texture, (tex) => {
            physicalMat.map = tex;
            physicalMat.needsUpdate = true;
          });
        }

        physicalMat.needsUpdate = true;
      }
    });
  }

  /**
   * Adjusts the camera to fit the given object into view, preserving the current rotation.
   * @param object - The target THREE.Object3D to fit in view.
   * @param padding - Optional padding factor (e.g., 1.1 for 10% padding).
   */
  public fitToView(padding: number = 1.8): void {
    let model = ModelController.GetRoomModel(this.scene);
    if (!model) return;

    const boundingBox = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    const currentTarget =
      (this.controls as any)?.target?.clone() ?? center.clone();

    const orbitTarget = (this.controls as any)?.target ?? currentTarget.clone();

    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (this.camera instanceof THREE.PerspectiveCamera) {
      const fov = this.camera.fov * (Math.PI / 180);
      const cameraDistance = (maxDim / 2 / Math.tan(fov / 2)) * padding;

      // Current spherical position
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(this.camera.position.clone().sub(orbitTarget));

      const start = {
        theta: spherical.theta,
        phi: spherical.phi,
        radius: spherical.radius,
        target: orbitTarget.clone(),
      };

      // Calculate new direction from camera to target, then invert it
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction).multiplyScalar(-1);

      const newCameraPosition = currentTarget
        .clone()
        .add(direction.normalize().multiplyScalar(cameraDistance));

      const endVec = newCameraPosition.clone().sub(currentTarget);
      const endSpherical = new THREE.Spherical();
      endSpherical.setFromVector3(endVec);

      const end = {
        theta: endSpherical.theta,
        phi: endSpherical.phi,
        radius: endSpherical.radius,
        target: currentTarget.clone(),
      };

      const startTime = performance.now();

      const animate = () => {
        const now = performance.now();
        const t = Math.min((now - startTime) / this.transitionDuration, 1);
        const ease = t * t * (3 - 2 * t);

        const interpolated = new THREE.Spherical(
          THREE.MathUtils.lerp(start.radius, end.radius, ease),
          THREE.MathUtils.lerp(start.phi, end.phi, ease),
          THREE.MathUtils.lerp(start.theta, end.theta, ease)
        );

        const newPosition = new THREE.Vector3()
          .setFromSpherical(interpolated)
          .add(center);
        this.camera.position.copy(newPosition);

        if ((this.controls as any)?.target) {
          (this.controls as any).target.copy(
            start.target.clone().lerp(end.target, ease)
          );
        }
        (this.camera as THREE.PerspectiveCamera).updateProjectionMatrix();

        this.controls.update();

        if (t < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
      return;
    }
    if (this.camera instanceof THREE.OrthographicCamera) {
      const aspect = this.container.clientWidth / this.container.clientHeight;

      //  Preserve current camera orientation
      const currentTarget =
        (this.controls as any)?.target?.clone() ?? center.clone();
      const offset = this.camera.position.clone().sub(currentTarget);

      //  Resize ortho frustum to fit model
      const halfHeight = (maxDim * padding) / 2;
      const halfWidth = halfHeight * aspect;

      this.camera.left = -halfWidth;
      this.camera.right = halfWidth;
      this.camera.top = halfHeight;
      this.camera.bottom = -halfHeight;

      this.camera.zoom = 1;

      //  Reapply camera using same direction 
      this.camera.position.copy(currentTarget.clone().add(offset));
      this.camera.lookAt(currentTarget);

      this.camera.updateProjectionMatrix();

      if ((this.controls as any)?.target) {
        (this.controls as any).target.copy(currentTarget);
        this.controls.update?.();
      }
    }
  }

  /**
   * Sets the camera and OrbitControls to an isometric home view
   * @param camera The Three.js camera
   * @param controls The OrbitControls instance
   * @param model The root Object3D of your loaded GLB model
   */
  public setHomeView(model: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const distance = maxDim * 1.5;

    const targetPosition = center
      .clone()
      .add(direction.clone().multiplyScalar(distance));

    // Get current spherical coordinates
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(this.camera.position.clone().sub(center));

    const start = {
      theta: spherical.theta,
      phi: spherical.phi,
      radius: spherical.radius,
      target: this.controls.target.clone(),
    };

    const endVec = targetPosition.clone().sub(center);
    const endSpherical = new THREE.Spherical();
    endSpherical.setFromVector3(endVec);

    const end = {
      theta: endSpherical.theta,
      phi: endSpherical.phi,
      radius: endSpherical.radius,
      target: center.clone(),
    };

    const startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const t = Math.min((now - startTime) / this.transitionDuration, 1);
      const ease = t * t * (3 - 2 * t);

      const interpolated = new THREE.Spherical(
        THREE.MathUtils.lerp(start.radius, end.radius, ease),
        THREE.MathUtils.lerp(start.phi, end.phi, ease),
        THREE.MathUtils.lerp(start.theta, end.theta, ease)
      );

      const newPosition = new THREE.Vector3()
        .setFromSpherical(interpolated)
        .add(center);
      this.camera.position.copy(newPosition);

      this.controls.target.copy(start.target.clone().lerp(end.target, ease));
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Delegates BVH generation to the CollisionSystem for the given object hierarchy.
   *
   * @param object - The THREE.Object3D to generate BVH for.
   */
  public ensureBVH(object: THREE.Object3D): void {
    this.collisionSystem.ensureBVH(object);
  }

  /**
   * Delegates preview collision checking to the CollisionSystem.
   *
   * @param preview - The preview THREE.Object3D being positioned.
   * @returns `true` if a collision is detected, `false` otherwise.
   */
  public checkPreviewCollision(preview: THREE.Object3D): boolean {
    return this.collisionSystem.checkPreviewCollision(preview);
  }

  /**
   * Delegates transformed model collision checking to the CollisionSystem.
   *
   * @param mobileModel - The THREE.Object3D currently being moved/rotated.
   * @param lastValidPosition - Vector3 reference to restore position on collision.
   * @param lastValidRotation - Quaternion reference to restore rotation on collision.
   * @returns `true` if a collision occurred and the transformation was reverted, `false` otherwise.
   */
  public checkModelCollision(
    mobileModel: THREE.Object3D,
    lastValidPosition: THREE.Vector3,
    lastValidRotation: THREE.Quaternion
  ): boolean {
    return this.collisionSystem.checkModelCollision(
      mobileModel,
      lastValidPosition,
      lastValidRotation,
      this.currentBoxHelper
    );
  }

  /**
   * Computes a precise bounding box for the given object in its own local coordinate space.
   * Unlike the standard Box3.setFromObject, this method transforms all child mesh
   * vertices into the parent's local space to provide a tight-fitting Axis-Aligned Bounding Box (AABB)
   * relative to the object's origin.
   *
   * @param object - The THREE.Object3D to compute the local bounds for.
   * @returns A THREE.Box3 representing the precise local bounds.
   */
  public computePreciseLocalBox(object: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3();
    // Ensure world matrices are up to date for accurate transformation
    object.updateWorldMatrix(true, true);

    // Get the inverse of the object's world matrix to convert world coordinates back to local coordinates
    const inverseWorldMatrix = object.matrixWorld.clone().invert();
    const vec3 = new THREE.Vector3();

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        const positionAttribute = geometry.attributes.position;
        if (positionAttribute) {
          // Compute a matrix that transforms from the child's local space directly to the target object's local space.
          const relativeMatrix = new THREE.Matrix4().multiplyMatrices(inverseWorldMatrix, child.matrixWorld);

          for (let i = 0; i < positionAttribute.count; i++) {
            vec3.fromBufferAttribute(positionAttribute, i);
            vec3.applyMatrix4(relativeMatrix);
            box.expandByPoint(vec3);
          }
        }
      }
    });

    return box;
  }

  /**
   * Adds an Object-Oriented Bounding Box (OOBB) helper to the specified model.
   * Internal logic calculates the precise local bounds and creates a wireframe
   * box parented to the model for automatic transform synchronization.
   *
   * @param model - The THREE.Object3D to attach the bounding box helper to.
   */
  public addBoundingBoxHelper(model: THREE.Object3D): void {
    this.removeBoundingBoxHelper();

    const localBox = this.computePreciseLocalBox(model);

    // If the box is empty (e.g., no meshes), do not create a helper
    if (localBox.isEmpty()) return;

    // Extract size and center from the calculated local box
    const size = new THREE.Vector3();
    localBox.getSize(size);
    const center = new THREE.Vector3();
    localBox.getCenter(center);

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    // Create an EdgesGeometry to get a wireframe-like outline of the box
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    this.currentBoxHelper = new THREE.LineSegments(edges, material);

    // Initial position of the helper relative to the model's origin
    this.currentBoxHelper.position.copy(center);

    model.add(this.currentBoxHelper);
  }

  /**
   * Removes and disposes the current bounding box helper from the scene/model.
   */
  public removeBoundingBoxHelper(): void {
    if (this.currentBoxHelper) {
      this.currentBoxHelper.removeFromParent();
      this.currentBoxHelper.geometry.dispose();
      (this.currentBoxHelper.material as THREE.Material).dispose();
      this.currentBoxHelper = null;
    }
  }

  /**
   * Updates the bounding box helper to keep it in sync (since it is parented, this is primarily a structural check).
   */
  public updateHelper(): void {
    if (!this.currentBoxHelper) return;
  }

  /**
   * Sets the camera view of the room model to a predefined viewpoint (top, bottom, front, back, left, right, home).
   *
   * @param camView - The string name of the target camera viewpoint.
   */
  public setModelView(camView: string): void {
    let model = ModelController.GetRoomModel(this.scene);
    if (model) {
      switch (camView) {
        case CameraViews.TOP: this.viewTop(model); break;
        case CameraViews.BOTTOM: this.viewBottom(model); break;
        case CameraViews.FRONT: this.viewFront(model); break;
        case CameraViews.BACK: this.viewBack(model); break;
        case CameraViews.LEFT: this.viewLeft(model); break;
        case CameraViews.RIGHT: this.viewRight(model); break;
        case CameraViews.HOME: this.setHomeView(model); break;
        default: this.viewFront(model);
      }
    }
  }

  /**
   * Retrieves the room model object from the scene by its name.
   * @param scene - The THREE.Scene containing the room model.
   * @returns The room model THREE.Object3D if found, or null otherwise.
   */
  public static GetRoomModel(scene: THREE.Scene): THREE.Object3D | null {
    let roomModel = scene.getObjectByName(RequiredStrings.ROOM_MODEL);
    if (roomModel) {
      return roomModel;
    }
    return null;
  }

  // private async downloadImage(imageUrl: string): Promise<string> {
  //   const response = await fetch(imageUrl);

  //   if (!response.ok) {
  //     throw new Error(`Download failed: ${response.status}`);
  //   }

  //   const buffer = Buffer.from(await response.arrayBuffer());

  //   const url = new URL(imageUrl);

  //   // Remove query parameters from the URL
  //   const fileName = path.basename(url.pathname) || "image.jpg";

  //   const publicDir = path.resolve(process.cwd(), "public");

  //   await fs.mkdir(publicDir, { recursive: true });

  //   const filePath = path.join(publicDir, fileName);

  //   await fs.writeFile(filePath, buffer);

  //   return filePath;
  // }
  private async downloadImage(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();

    // Creates a browser-local URL for the downloaded image
    return URL.createObjectURL(blob);
  }
}

