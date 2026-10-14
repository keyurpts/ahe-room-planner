import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { ExpandedConfigOption } from '../ProjectFileReader';
import type { ProjectConfig } from '../types/types';
import { ModelController } from './ModelController';
import { DOMEvents, CSSProperties, LogMessages, ThreeProperties } from '../Constants';

/**
 * Controller to handle showing HTML tooltips when hovering over 3D model parts.
 */
export class TooltipOnHover {
  /**
   * THREE.Raycaster used to detect mouse hover intersection with 3D objects.
   */
  private raycaster: THREE.Raycaster;

  /**
   * Vector2 representing normalized device coordinates of the mouse.
   */
  private mouse: THREE.Vector2;

  /**
   * CSS2DRenderer instance for rendering HTML tooltips in 3D space.
   */
  private labelRenderer: CSS2DRenderer;

  /**
   * HTML DOM element for the tooltip message box.
   */
  private tooltipElement: HTMLElement;

  /**
   * CSS2DObject wrapping the tooltip DOM element.
   */
  private tooltipObject: CSS2DObject;

  /**
   * The active camera.
   */
  private camera: THREE.Camera;

  /**
   * The active 3D scene.
   */
  private scene: THREE.Scene;

  /**
   * HTML element parent of the WebGL renderer canvas.
   */
  private container: HTMLElement;

  /**
   * Flag indicating if the hover tooltip behavior is active.
   */
  private enabled: boolean = false;

  /**
   * Expanded configuration map for parts.
   */
  private projectJSON: Record<string, ExpandedConfigOption>;

  /**
   * Original project configuration file data.
   */
  private oldProjectJSON: ProjectConfig;

  /**
   * ResizeObserver to keep CSS2D renderer sized correctly.
   */
  private resizeObserver!: ResizeObserver;

  /**
   * Initializes the TooltipOnHover controller.
   * Sets up the CSS2D renderer, tooltip element, and binds mousemove/resize events.
   * @param camera - The camera viewing the scene.
   * @param scene - The 3D scene instance.
   * @param container - The HTML container of the viewer.
   * @param updatedProjectJSON - Expanded configuration options.
   * @param oldProjectJSON - Original project configuration.
   */
  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    container: HTMLElement,
    updatedProjectJSON: Record<string, ExpandedConfigOption>,
    oldProjectJSON: ProjectConfig
  ) {
    this.camera = camera;
    this.scene = scene;
    this.container = container;
    this.projectJSON = updatedProjectJSON;
    this.oldProjectJSON = oldProjectJSON;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initResizeObserver();

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
        this.labelRenderer.domElement.style.position = CSSProperties.ABSOLUTE;
        this.labelRenderer.domElement.style.top = CSSProperties.ZERO_PIXELS;
        this.labelRenderer.domElement.style.left = CSSProperties.ZERO_PIXELS;
        this.labelRenderer.domElement.style.pointerEvents = CSSProperties.POINTER_EVENTS_NONE;
        container.appendChild(this.labelRenderer.domElement);

        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = CSSProperties.TOOLTIP_CLASS;
        this.tooltipElement.style.cssText = `
      background: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      white-space: nowrap;
      transform: translate(10px, -20px);
    `;
    this.tooltipObject = new CSS2DObject(this.tooltipElement);
    this.tooltipObject.visible = false;
    this.scene.add(this.tooltipObject);

        this.container.addEventListener(DOMEvents.MOUSE_MOVE, this.OnMouseMove);
        window.addEventListener(DOMEvents.RESIZE, this.OnResize);
    }

  /**
   * Initializes a ResizeObserver to automatically resize the label renderer when the container changes size.
   */
  private initResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * Handles mouse movement to update the raycaster, detect hovered objects, and display the tooltip.
   */
  private OnMouseMove = (event: MouseEvent) => {
    if (!this.enabled) {
      this.tooltipObject.visible = false;
      return;
    }

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    let object = ModelController.GetRoomModel(this.scene);
    if (!object) return;
    const intersects = this.raycaster.intersectObject(object, true);
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const point = intersect.point;

            // get corresponding text from json
            const result = this.findMatchingParent(intersect.object, this.projectJSON);
            if (result) {
                let abc = this.oldProjectJSON.toolTips.find(item => item.basePart === result.key);
                if(abc){
                    this.tooltipElement.textContent = abc.message;
                }
                else{
                    this.tooltipElement.textContent = LogMessages.HOVERED_OBJECT;
                }
            } else {
                this.tooltipElement.textContent = LogMessages.HOVERED_OBJECT;
            }

      this.tooltipObject.position.copy(point);
      this.tooltipObject.visible = true;
    } else {
      this.tooltipObject.visible = false;
    }
  };

  /**
   * Updates the label renderer size on window/container resize.
   */
  private OnResize = () => {
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  /**
   * Renders the CSS2D labels/tooltips.
   */
  public render(): void {
    this.labelRenderer.render(this.scene, this.camera);
  }

    /**
     * Disposes of the tooltip element, removes event listeners, and cleans up scene objects.
     */
    public dispose() {
        this.container.removeEventListener(DOMEvents.MOUSE_MOVE, this.OnMouseMove);
        window.removeEventListener(DOMEvents.RESIZE, this.OnResize);
        this.labelRenderer.domElement.remove();
        this.scene.remove(this.tooltipObject);
    };

  /**
   * Enables the tooltip-on-hover functionality.
   */
  public enable(): void {
    this.enabled = true;
  }

  /**
   * Disables the tooltip-on-hover functionality and hides the tooltip.
   */
  public disable(): void {
    this.enabled = false;
    this.tooltipObject.visible = false;
  }

  /**
   * Recursively traverses up the hierarchy of a mesh to find a parent object matching the configuration keys.
   * @param mesh - The intersected mesh object.
   * @param configMap - The configuration map containing part IDs.
   * @returns Object containing the matched key and THREE.Object3D node, or null if no match.
   */
  private findMatchingParent(
    mesh: THREE.Object3D,
    configMap: Record<string, ExpandedConfigOption>
  ): { key: string; object: THREE.Object3D } | null {
    let current: THREE.Object3D | null = mesh;

    let partProperty = this.oldProjectJSON.partIdentifierProperty;
    let propKey = partProperty;
    if (partProperty && partProperty.includes("/")) {
      propKey = partProperty.split("/").pop() as string;
    }

        while (current) {
            let pid = undefined;
            if (partProperty === ThreeProperties.NAME) {
                pid = current.name;
            } else {
                pid = current.userData[propKey];
            }

      if (pid && configMap.hasOwnProperty(pid)) {
        return { key: pid, object: current };
      }
      current = current.parent;
    }

    return null;
  }
}
