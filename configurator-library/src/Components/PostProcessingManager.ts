import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Unsharp-mask sharpening shader enhances edge detail without adding noise.
 */
const SharpenShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    amount: { value: 0.25 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 texel = 1.0 / vec2(textureSize(tDiffuse, 0));
      vec4 up    = texture2D(tDiffuse, vUv + vec2(0.0,  texel.y));
      vec4 down  = texture2D(tDiffuse, vUv - vec2(0.0,  texel.y));
      vec4 left  = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0));
      vec4 right = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0));
      vec4 edge  = 4.0 * color - (up + down + left + right);
      gl_FragColor = color + amount * edge;
    }
  `
};

/**
 * Subtle vignette shader darkens screen edges to draw focus to the model centre.
 */
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    offset: { value: 1.1 },
    darkness: { value: 1.0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 color   = texture2D(tDiffuse, vUv);
      vec2 uv      = (vUv - 0.5) * 2.0;
      float dist   = length(uv);
      float vignette = smoothstep(offset, offset - 0.5, dist);
      gl_FragColor = vec4(color.rgb * mix(1.0, vignette, darkness * 0.5), color.a);
    }
  `
};

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
export class PostProcessingManager {
  /**
   * The main EffectComposer instance managing the post-processing stack.
   */
  public composer: EffectComposer;

  /**
   * Base render pass for the 3D scene.
   */
  private renderPass: RenderPass;

  /**
   * Ground-truth ambient occlusion pass for contact shadows.
   */
  private gtaoPass: GTAOPass;

  /**
   * UnrealBloomPass instance for generating glow effects.
   */
  private bloomPass: UnrealBloomPass;

  /**
   * Screen-space reflections pass for glossy surfaces.
   */
  private ssrPass: SSRPass;

  /**
   * Unsharp-mask sharpening pass to enhance texture detail.
   */
  private sharpenPass: ShaderPass;

  /**
   * Subpixel morphological anti-aliasing pass for smoothing jagged lines.
   */
  private smaaPass: SMAAPass;

  /**
   * ShaderPass for the cinematic vignette effect.
   */
  private vignettePass: ShaderPass;

  /**
   * Output pass for tone-mapping and color space conversion.
   */
  private outputPass: OutputPass;

  /**
   * Initializes the PostProcessingManager with a WebGLRenderer, Scene, and Camera.
   * Configures the composer stack including RenderPass, GTAO, Sharpen, SMAA, Vignette, and OutputPass.
   * @param renderer - The WebGLRenderer instance.
   * @param scene - The THREE.Scene instance.
   * @param camera - The THREE.Camera instance.
   */
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    const width = renderer.domElement.clientWidth || 1;
    const height = renderer.domElement.clientHeight || 1;

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      samples: 8,
      type: THREE.HalfFloatType
    });

    this.composer = new EffectComposer(renderer, renderTarget);

    // Base render
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    //GTAO ambient occlusion 
    this.gtaoPass = new GTAOPass(scene, camera, width, height);
    this.gtaoPass.output = GTAOPass.OUTPUT.Default;
    this.gtaoPass.blendIntensity = 0.8;
    this.gtaoPass.updateGtaoMaterial({
      radius: 0.25,
      samples: 32
    });
    this.gtaoPass.updatePdMaterial({
      lumaPhi: 10,
      depthPhi: 2,
      normalPhi: 3,
      radius: 4
    });
    this.composer.addPass(this.gtaoPass);

    //Unreal Bloom atmospheric glow
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.15,
      0.4,
      0.85
    );
    this.bloomPass.renderToScreen = false;

    //SSR disabled
    this.ssrPass = new SSRPass({
      renderer, scene, camera, width, height,
      groundReflector: null, selects: null
    });

    //Sharpening
    this.sharpenPass = new ShaderPass(SharpenShader);

    //SMAA post-process anti-aliasing
    this.smaaPass = new SMAAPass();
    this.composer.addPass(this.smaaPass);

    //Vignette
    this.vignettePass = new ShaderPass(VignetteShader);
    this.composer.addPass(this.vignettePass);

    //Output tone-mapping & colour space
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  /**
   * Resize all passes when the canvas dimensions change.
   * @param width - The new width.
   * @param height - The new height.
   */
  public UpdateSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.gtaoPass.setSize(width, height);
    this.bloomPass.setSize(width, height);
    this.smaaPass.setSize(width, height);
  }

  /**
   * Retarget scene-dependent passes after the active camera changes.
   * @param camera - The new camera instance.
   */
  public updateCamera(camera: THREE.Camera): void {
    this.renderPass.camera = camera;

    const gtaoPass = this.gtaoPass as GTAOPass & {
      gtaoMaterial: THREE.ShaderMaterial;
      depthRenderMaterial?: THREE.ShaderMaterial;
    };
    gtaoPass.camera = camera;
    gtaoPass.gtaoMaterial.defines.PERSPECTIVE_CAMERA = camera instanceof THREE.PerspectiveCamera ? 1 : 0;
    gtaoPass.gtaoMaterial.needsUpdate = true;

    const clippingCamera = camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (gtaoPass.depthRenderMaterial?.uniforms) {
      gtaoPass.depthRenderMaterial.uniforms.cameraNear.value = clippingCamera.near;
      gtaoPass.depthRenderMaterial.uniforms.cameraFar.value = clippingCamera.far;
    }

    this.ssrPass.camera = camera;
  }

  /**
   * Render one frame through the post-processing pipeline.
   * @param deltaTime - The time delta.
   */
  public render(deltaTime?: number): void {
    this.composer.render(deltaTime);
  }

  /**
   * Adjusts the ambient-occlusion blend strength.
   * @param value - Blend strength (0 = off, 1 = full).
   */
  public SetAOIntensity(value: number): void {
    (this.gtaoPass as any).blendIntensity = value;
  }

  /**
   * Adjusts the sharpening amount.
   * @param value - Sharpening amount (0 = off, 1 = strong).
   */
  public SetSharpenAmount(value: number): void {
    this.sharpenPass.uniforms['amount'].value = value;
  }

  /**
   * Adjusts the vignette strength.
   * @param value - Vignette strength (0 = off, 1 = strong).
   */
  public SetVignetteIntensity(value: number): void {
    this.vignettePass.uniforms['darkness'].value = value;
  }
}
