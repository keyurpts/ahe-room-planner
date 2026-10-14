import { Object3D, WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { LoaderPaths, ThreeProperties} from '../Constants';

/**
 * Loads a GLTF/GLB model from the specified URL
 * 
 * @param url - The URL of the GLTF/GLB model to load
 * @returns A Promise that resolves to the loaded Object3D
 */
export async function loadModel(url: string, renderer?: WebGLRenderer): Promise<Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    const ktx2Loader = renderer ? new KTX2Loader() : undefined;

    dracoLoader.setDecoderPath(LoaderPaths.DRACO_DECODER);
    dracoLoader.setDecoderConfig({ type: LoaderPaths.WASM_TYPE });
    dracoLoader.preload();
    loader.setDRACOLoader(dracoLoader);
    if (renderer && ktx2Loader) {
      ktx2Loader.setTranscoderPath(LoaderPaths.BASIS_TRANSCODER);
      ktx2Loader.detectSupport(renderer);
      loader.setKTX2Loader(ktx2Loader);
    }
    loader.setMeshoptDecoder(MeshoptDecoder);
    
    loader.load(
      // URL of the model to load
      url,
      
      // Called when the resource is loaded
      (gltf) => {
        const model = gltf.scene;
        
        // Enable casting and receiving shadows for all meshes in the model
        model.traverse((object) => {
          if (ThreeProperties.IS_MESH in object && object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        
        dracoLoader.dispose();
        ktx2Loader?.dispose();
        resolve(model);
      },
      
      // Called while loading is progressing
      () => {},
      
      // Called when loading has errors
      (error) => {
        dracoLoader.dispose();
        ktx2Loader?.dispose();
        reject(error);
      }
    );
  });
}
