import {
  addToast,
  closeAll,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Slider,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "../ThemeContext";
import TextureAndColorPanel from "./TextureAndColorPanel";
import { ConfiguratorCore, ConfiguratorEventType, Events } from "three-configurator";
import { ToolbarAction, KEYBOARD_SHORTCUTS } from "../constant";
import { TOAST_MESSAGES } from "../toastMessages";

type DesignAreaProps = {
  configuratorInstance: ConfiguratorCore | undefined;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  roomConfig: any;
  setReplacementOptions: any;
  setIsRightSidebarOpen: any;
  isRightSidebarOpen: boolean;
  setSearchTerm: any;
  setIsModelPanelOpen: any;
  container3DRef: React.MutableRefObject<HTMLDivElement | null>;
  isExistingLayout: boolean;
  isConfigUiOpen: boolean;
  floorPlanManager?: any;
  isNewModelLoading: boolean;
  setIsNewModelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  is3DTabActive: boolean;
  slider: boolean;
  showSlider: React.Dispatch<React.SetStateAction<boolean>>;
  activeTool: string | null;
  setActiveTool: React.Dispatch<React.SetStateAction<string | null>>;
  allMeasurementsActive: boolean;
  setAllMeasurementsActive: React.Dispatch<React.SetStateAction<boolean>>;
  singleMeasurementActive: boolean;
  setSingleMeasurementActive: React.Dispatch<React.SetStateAction<boolean>>;
  wallsOnlyMeasurementActive: boolean;
  setWallsOnlyMeasurementActive: React.Dispatch<React.SetStateAction<boolean>>;
  objectToObjectMeasurementActive: boolean;
  setObjectToObjectMeasurementActive: React.Dispatch<React.SetStateAction<boolean>>;
  wallHidingActive: boolean;
  setWallHidingActive: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPriceSummaryOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function DesignArea({
  configuratorInstance,
  setRotation,
  rotation,
  roomConfig,
  setReplacementOptions,
  setIsRightSidebarOpen,
  isRightSidebarOpen,
  setSearchTerm,
  setIsModelPanelOpen,
  container3DRef,
  isExistingLayout,
  isConfigUiOpen,
  isNewModelLoading,
  setIsNewModelLoading,
  is3DTabActive,
  slider,
  showSlider,
  activeTool,
  setActiveTool,
  allMeasurementsActive,
  setAllMeasurementsActive,
  singleMeasurementActive,
  setSingleMeasurementActive,
  wallsOnlyMeasurementActive,
  setWallsOnlyMeasurementActive,
  objectToObjectMeasurementActive,
  setObjectToObjectMeasurementActive,
  wallHidingActive,
  setWallHidingActive,
  setIsPriceSummaryOpen,
}: DesignAreaProps) {
  const { theme } = useTheme();
  const [isModelSelected, setIsModelSelected] = useState(false);
  const [isTextureAndColorPanelOpen, setIsTextureAndColorPanelOpen] = useState(false);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">("translate");
  const [activeCamera, setActiveCamera] = useState("perspective");
  const [isOpen, setIsOpen] = useState(false);
  const [isMeasurementMenuOpen, setIsMeasurementMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; label: string } | null>(null);
  const lastTransformModeRef = useRef<string>("translate");
  const activeToolRef = useRef<string | null>(null);
  const allMeasurementsActiveRef = useRef<boolean>(false);
  const singleMeasurementActiveRef = useRef<boolean>(false);
  const wallsOnlyMeasurementActiveRef = useRef<boolean>(false);
  const objectToObjectMeasurementActiveRef = useRef<boolean>(false);
  const isRightSidebarOpenRef = useRef<boolean>(false);
  const isNewModelLoadingRef = useRef<boolean>(false);
  const isConfigUiOpenRef = useRef<boolean>(false);

  const [objectSelectionStep, setObjectSelectionStep] = useState<0 | 1 | 2 | 3>(0);
  const [firstSelectedModelName, setFirstSelectedModelName] = useState<string | null>(null);
  const [secondSelectedModelName, setSecondSelectedModelName] = useState<string | null>(null);
  const [objectToObjectDistance, setObjectToObjectDistance] = useState<number | null>(null);
  const objectSelectionStepRef = useRef<0 | 1 | 2 | 3>(0);
  const firstSelectedModelNameRef = useRef<string | null>(null);

  const sampleInput3DConfig = {
    "chair-1": {
      "url": "RoomConfiguratorModels/chair/chair_1.glb",
      "name": "chair-1",
      "matrix": {
        "elements": [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          6.387127169122538,
          0.39665797082935694,
          2.9175969440733374,
          1
        ]
      },
      "children": [],
      "modelData": {
        "category": "chair",
        "name": "chair-1",
        "id": "chair-1",
        "price": "$249",
        "format": "gltf",
      }
    },
    "group_1788850672538": {
      "name": "Group 967",
      "matrix": {
        "elements": [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          11.387112262620253,
          0.47371745128747084,
          3.396343730105796,
          1
        ]
      },
      "children": [
        {
          "chair-3": {
            "url": "RoomConfiguratorModels/chair/chair_3.glb",
            "name": "chair-3",
            "matrix": {
              "elements": [
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                -0.004246928108576853,
                -0.04279879917150725,
                0.5438290388911882,
                1
              ]
            },
            "children": [],
            "modelData": {
              "category": "chair",
              "name": "chair-3",
              "id": "chair-3",
              "price": "$145",
              "format": "gltf",
            }
          }
        },
        {
          "chair-2": {
            "url": "RoomConfiguratorModels/chair/chair_2.glb",
            "name": "chair-2",
            "matrix": {
              "elements": [
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0.011144946654633614,
                0,
                -0.5232814425835253,
                1
              ]
            },
            "children": [],
            "modelData": {
              "category": "chair",
              "name": "chair-2",
              "id": "chair-2",
              "price": "$139",
              "format": "gltf",
            }
          }
        }
      ]
    }
  };

  const sampleInput3DConfig2 = {
    "chair-1": {
      "name": "chair-1",
      "matrix": {
        "elements": [
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          6.387127169122538,
          0.39665797082935694,
          2.9175969440733374,
          1
        ]
      },
      "children": [],
      "url": "RoomConfiguratorModels/chair/chair_1.glb",
      "modelData": {
        "category": "chair",
        "name": "chair-1",
        "id": "chair-1",
        "price": "$249",
        "format": "gltf",
      }
    },
    "group_1788861785443": {
      "name": "Group 901",
      "matrix": {
        "elements": [
          0.25881904510252074,
          0,
          -0.9659258262890683,
          0,
          0,
          1,
          0,
          0,
          0.9659258262890683,
          0,
          0.25881904510252074,
          0,
          10.38832508384435,
          0.4737174512874709,
          4.878069710813943,
          1
        ]
      },
      "children": [
        {
          "chair-3": {
            "name": "chair-3",
            "matrix": {
              "elements": [
                0.5591929034707458,
                0,
                -0.8290375725550421,
                0,
                0,
                1,
                0,
                0,
                0.8290375725550421,
                0,
                0.5591929034707458,
                0,
                -0.015391874763210467,
                -0.04279879917150731,
                0.5424830662081845,
                1
              ]
            },
            "children": [],
            "url": "RoomConfiguratorModels/chair/chair_3.glb",
            "modelData": {
              "category": "chair",
              "name": "chair-3",
              "id": "chair-3",
              "price": "$145",
              "format": "gltf",
            }
          }
        },
        {
          "chair-2": {
            "name": "chair-2",
            "matrix": {
              "elements": [
                -0.6691306063588579,
                0,
                0.7431448254773944,
                0,
                0,
                1,
                0,
                0,
                -0.7431448254773944,
                0,
                -0.6691306063588579,
                0,
                0,
                0,
                -0.5246274152665289,
                1
              ]
            },
            "children": [],
            "url": "RoomConfiguratorModels/chair/chair_2.glb",
            "modelData": {
              "category": "chair",
              "name": "chair-2",
              "id": "chair-2",
              "price": "$139",
              "format": "gltf",
            }
          }
        }
      ]
    }
  }

  useEffect(() => {
    isConfigUiOpenRef.current = isConfigUiOpen;
    // Leaving the configure tab (to 2D or 3D) dismisses the context menu.
    if (!isConfigUiOpen) {
      setContextMenu(null);
    }
  }, [isConfigUiOpen]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    allMeasurementsActiveRef.current = allMeasurementsActive;
  }, [allMeasurementsActive]);

  useEffect(() => {
    singleMeasurementActiveRef.current = singleMeasurementActive;
  }, [singleMeasurementActive]);

  useEffect(() => {
    wallsOnlyMeasurementActiveRef.current = wallsOnlyMeasurementActive;
  }, [wallsOnlyMeasurementActive]);

  useEffect(() => {
    objectToObjectMeasurementActiveRef.current = objectToObjectMeasurementActive;
    if (!objectToObjectMeasurementActive) {
      setObjectSelectionStep(0);
      setFirstSelectedModelName(null);
      setSecondSelectedModelName(null);
      setObjectToObjectDistance(null);
      objectSelectionStepRef.current = 0;
      firstSelectedModelNameRef.current = null;
      configuratorInstance?.deselectModel();
      setIsModelSelected(false);
      showSlider(false);
    }
  }, [objectToObjectMeasurementActive]);

  useEffect(() => {
    objectSelectionStepRef.current = objectSelectionStep;
  }, [objectSelectionStep]);

  useEffect(() => {
    isRightSidebarOpenRef.current = isRightSidebarOpen;
  }, [isRightSidebarOpen]);

  useEffect(() => {
    isNewModelLoadingRef.current = isNewModelLoading;
  }, [isNewModelLoading]);

  useEffect(() => {
    if (!is3DTabActive || isConfigUiOpen) {
      setIsTextureAndColorPanelOpen(false);
    }
  }, [is3DTabActive, isConfigUiOpen]);

  useEffect(() => {
    if (configuratorInstance && roomConfig && isExistingLayout) {
      console.log("roomconfig:", roomConfig);
      const init = async () => {
        const baseModelUrl = roomConfig.baseModel.url;
        console.log("base model url:", baseModelUrl);

        await configuratorInstance.loadModel(
          baseModelUrl,
          false,
          undefined,
          undefined,
          undefined,
          undefined
        );

        // await configuratorInstance.loadEnvironmentMap(
        //   "/lebombo_4k.hdr",
        //   0.7
        // );
      };

      setTimeout(() => {
        init();
      }, 500);

    }
  }, [configuratorInstance, roomConfig]);

  useEffect(() => {
    if (!configuratorInstance) return;

    const handleCollision = (data: any) => {
      console.log(data.message);
      closeAll();
      addToast({
        title: data.message,
        description: "Please enter valid distance",
        timeout: 3000,
        color: "warning",
        shouldShowTimeoutProgress: true,
      });
    };

    const handleModelSelected = (metadata: any) => {
      setContextMenu(null);
      console.log("metadata : ", metadata);

      if (objectToObjectMeasurementActiveRef.current && metadata !== null) {
        const modelName = metadata?.name || "Model";

        if (objectSelectionStepRef.current === 1 || !firstSelectedModelNameRef.current) {
          configuratorInstance?.setFirstMeasurementModel();
          setFirstSelectedModelName(modelName);
          firstSelectedModelNameRef.current = modelName;
          setObjectSelectionStep(2);
          objectSelectionStepRef.current = 2;

          closeAll();
          addToast({
            title: "First Model Selected",
            description: `Selected "${modelName}". Now select the second model in the scene`,
            timeout: 4000,
            color: "primary",
            shouldShowTimeoutProgress: true,
          });
        } else if (objectSelectionStepRef.current === 2) {
          if (configuratorInstance?.isSameMeasurementModel()) {
            closeAll();
            addToast({
              title: TOAST_MESSAGES.OBJECT_MEASUREMENT_SAME_MODEL.title,
              description: TOAST_MESSAGES.OBJECT_MEASUREMENT_SAME_MODEL.description,
              timeout: 3000,
              color: "warning",
              shouldShowTimeoutProgress: true,
            });
            return;
          }

          setSecondSelectedModelName(modelName);
          const distance = configuratorInstance?.measureBetweenModels();
          if (distance !== null && distance !== undefined) {
            setObjectToObjectDistance(distance);
            setObjectSelectionStep(3);
            objectSelectionStepRef.current = 3;
            closeAll();
            addToast({
              title: "Measurement Complete",
              description: `Distance between ${firstSelectedModelNameRef.current || "First Model"} and ${modelName}: ${distance.toFixed(2)} units`,
              timeout: 4000,
              color: "success",
              shouldShowTimeoutProgress: true,
            });
          }
        }
      }

      if (metadata === null) {
        setIsModelSelected(false);

        if (isRightSidebarOpenRef.current) {
          setActiveTool("replace");
        } else {
          setActiveTool(lastTransformModeRef.current);
        }
        console.log(configuratorInstance?.isModelSelected(), transformMode === "rotate");

        if (configuratorInstance?.isModelSelected() && transformMode === "rotate") {
          showSlider(true);
        } else {
          showSlider(false);
        }
      } else {
        setIsModelSelected(true);
        if (allMeasurementsActiveRef.current) {
          if (isNewModelLoadingRef.current) {
            setIsNewModelLoading(false);
          }
        } else if (singleMeasurementActiveRef.current) {
          setSingleMeasurementActive(true);
        } else if (wallsOnlyMeasurementActiveRef.current) {
          setWallsOnlyMeasurementActive(true);
        } else if (objectToObjectMeasurementActiveRef.current) {
          setObjectToObjectMeasurementActive(true);
        }

        if (isRightSidebarOpenRef.current) {
          setActiveTool("replace");
          showSlider(false);
        } else {
          const currentMode = lastTransformModeRef.current;

          setActiveTool(currentMode);
          if (currentMode === "rotate") {
            setTransformMode("rotate");
            if (configuratorInstance?.isModelSelected()) {
              showSlider(true);
            } else {
              showSlider(false);
            }
            configuratorInstance?.setTransformMode("rotate");
            configuratorInstance?.toggleTransformAxis("y", true);
            configuratorInstance?.toggleTransformAxis("x", false);
            configuratorInstance?.toggleTransformAxis("z", false);
          } else {
            setTransformMode("translate");
            showSlider(false);
            configuratorInstance?.setTransformMode("translate");
            configuratorInstance?.setTransformSize(0.7);
            configuratorInstance?.toggleTransformAxis("y", false);
            configuratorInstance?.toggleTransformAxis("x", true);
            configuratorInstance?.toggleTransformAxis("z", true);
          }
        }
      }
    };

    const handlePreviewCancelled = () => {
      setSingleMeasurementActive(false);
      setWallsOnlyMeasurementActive(false);
      setObjectToObjectMeasurementActive(false);
      setAllMeasurementsActive(false);
    };

    // Replacement-specific handlers
    const handleReplaceEvent = (data: any) => {
      closeAll();
      addToast({
        title: data?.title,
        description: data?.message,
        timeout: 3000,
        color: data?.color || "warning",
        shouldShowTimeoutProgress: true,
      });
    };

    const handleCloneEvent = (data: any) => {
      closeAll();
      addToast({
        title: data?.title,
        description: data?.message,
        timeout: 3000,
        color: data?.color || "warning",
        shouldShowTimeoutProgress: true,
      });
    };


    const handleModelContextMenu = (data: any) => {
      // The context menu is only available inside the configure tab.
      if (!isConfigUiOpenRef.current) {
        setContextMenu(null);
        return;
      }
      if (data && typeof data.x === "number" && typeof data.y === "number") {
        const label =
          data.metadata?.category ||
          data.metadata?.name ||
          "Model";
        setContextMenu({ x: data.x, y: data.y, label });
      } else {
        setContextMenu(null);
      }
    };

    const handleObjectDistanceUpdated = (dist: number | null) => {
      setObjectToObjectDistance(dist);
    };

    //  Listen for events
    Events.on(ConfiguratorEventType.COLLISION, handleCollision);
    Events.on(ConfiguratorEventType.MODEL_SELECTED, handleModelSelected);
    Events.on(ConfiguratorEventType.MODEL_CONTEXT_MENU, handleModelContextMenu);
    Events.on(ConfiguratorEventType.PREVIEW_CANCELLED, handlePreviewCancelled);
    Events.on(ConfiguratorEventType.REPLACE, handleReplaceEvent);
    Events.on(ConfiguratorEventType.CLONE, handleCloneEvent);
    Events.on(ConfiguratorEventType.OBJECT_DISTANCE_UPDATED, handleObjectDistanceUpdated);


    return () => {
      Events.off(ConfiguratorEventType.COLLISION, handleCollision);
      Events.off(ConfiguratorEventType.MODEL_SELECTED, handleModelSelected);
      Events.off(ConfiguratorEventType.MODEL_CONTEXT_MENU, handleModelContextMenu);
      Events.off(ConfiguratorEventType.PREVIEW_CANCELLED, handlePreviewCancelled);
      Events.off(ConfiguratorEventType.REPLACE, handleReplaceEvent);
      Events.off(ConfiguratorEventType.CLONE, handleCloneEvent);
      Events.off(ConfiguratorEventType.OBJECT_DISTANCE_UPDATED, handleObjectDistanceUpdated);
    };
  }, [configuratorInstance]);

  useEffect(() => {
    const getShortcut = (event: KeyboardEvent): string => {
      const parts: string[] = [];

      if (event.ctrlKey || event.metaKey) {
        parts.push("Ctrl");
      }

      if (event.shiftKey) {
        parts.push("Shift");
      }

      parts.push(event.code);

      return parts.join("+");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts while typing
      const target = event.target as HTMLElement;

      if (target instanceof HTMLInputElement) {
        // Do not ignore shortcuts for range, checkbox, radio, or button inputs
        if (!['range', 'checkbox', 'radio', 'button'].includes(target.type)) {
          return;
        }
      } else if (target instanceof HTMLTextAreaElement || target.isContentEditable) {
        return;
      }

      const shortcut = getShortcut(event);
      const action = KEYBOARD_SHORTCUTS.get(shortcut);
      if (!action) {
        return;
      }

      event.preventDefault();

      switch (action) {
        case ToolbarAction.Copy:
          if (isModelSelected) {
            handleCopyModel();
          }
          break;

        case ToolbarAction.Delete:
          if (isModelSelected) {
            handleRemoveModel();
          }

          break;

        case ToolbarAction.Translate:
          handleTransfromMode();
          break;

        case ToolbarAction.Rotate:
          handleRotateMode();
          break;

        case ToolbarAction.Replace:
          handleReplaceModel();
          break;

        case ToolbarAction.ToggleWalls:
          handleWallHidingToggle();
          break;

        case ToolbarAction.SingleMeasurement:
          handleMeasurement();
          break;

        case ToolbarAction.AllMeasurement:
          handleToggleAllMeasurements();
          break;



      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isConfigUiOpen,
    isModelSelected,
    configuratorInstance,
    wallHidingActive,
    allMeasurementsActive,
    singleMeasurementActive,
    wallsOnlyMeasurementActive,
    objectToObjectMeasurementActive,
    isRightSidebarOpen
  ]);

  const handleRotateMode = () => {
    setTransformMode("rotate");
    lastTransformModeRef.current = "rotate";
    configuratorInstance?.switchControlMode("transform");
    configuratorInstance?.setTransformMode("rotate");
    configuratorInstance?.toggleTransformAxis("y", true);
    configuratorInstance?.toggleTransformAxis("x", false);
    configuratorInstance?.toggleTransformAxis("z", false);

    if (configuratorInstance?.isModelSelected()) {
      showSlider(true);
    } else {
      showSlider(false);
    }
  };
  const handleTransfromMode = () => {
    showSlider(false);
    setTransformMode("translate");
    lastTransformModeRef.current = "translate";
    configuratorInstance.switchControlMode("transform");
    configuratorInstance?.setTransformMode("translate");
    configuratorInstance?.setTransformSize(0.7);
    configuratorInstance?.toggleTransformAxis("y", false);
    configuratorInstance?.toggleTransformAxis("x", true);
    configuratorInstance?.toggleTransformAxis("z", true);
  };

  const handleReplaceModel = () => {
    if (!configuratorInstance) return;

    showSlider(false);
    const selectedModelId = configuratorInstance.getModelId();

    if (isRightSidebarOpen) {
      setIsRightSidebarOpen(false);
      setActiveTool(null);
    } else {
      setActiveTool("replace");
      setIsModelPanelOpen(false);
      setIsRightSidebarOpen(true);
      setIsPriceSummaryOpen(false);
    }

    let category = null;
    if (selectedModelId) {
      for (const cat of roomConfig?.configModels || []) {
        if (cat.items.find((item: any) => item.id === selectedModelId)) {
          category = cat;
          break;
        }
      }
    }

    const replacementOptions = category ? category.items : [];
    setReplacementOptions(replacementOptions);
    setSearchTerm("");
  };

  const handleRemoveModel = () => {
    if (!isModelSelected) return;
    showSlider(false);
    setIsRightSidebarOpen(false);

    setActiveTool("remove");
    const selectedModelCategory = configuratorInstance.getModelMetadata()?.category || "Asset";
    let isRemove = configuratorInstance.deleteModel();
    closeAll();
    if (isRemove) {
      if (objectToObjectMeasurementActiveRef.current) {
        setObjectToObjectMeasurementActive(false);
        setObjectSelectionStep(0);
        objectSelectionStepRef.current = 0;
        setFirstSelectedModelName(null);
        setSecondSelectedModelName(null);
        setObjectToObjectDistance(null);
        firstSelectedModelNameRef.current = null;
      }
      addToast({
        title: "Successful",
        description: `${selectedModelCategory} deleted successfully!`,
        timeout: 3000,
        color: "warning",
        shouldShowTimeoutProgress: true,
      });
    } else {
      addToast({
        title: TOAST_MESSAGES.NO_ASSET_SELECTED.title,
        description: TOAST_MESSAGES.NO_ASSET_SELECTED.description,
        timeout: 3000,
        color: "warning",
        shouldShowTimeoutProgress: true,
      });
    }
    setActiveTool(null);
  };
  const handleCopyModel = () => {
    if (!isModelSelected) return;
    showSlider(false);
    setIsRightSidebarOpen(false);

    setActiveTool("copy");
    let isCopied = configuratorInstance.duplicateModel();
    if (!isCopied) {
      closeAll();
      addToast({
        title: TOAST_MESSAGES.NO_ASSET_SELECTED_DUPLICATE.title,
        description: TOAST_MESSAGES.NO_ASSET_SELECTED_DUPLICATE.description,
        timeout: 3000,
        color: "warning",
        shouldShowTimeoutProgress: true,
      });
    }
    setActiveTool(null);
  };


  const handleToggleAllMeasurements = () => {
    setIsRightSidebarOpen(false);
    const newState = !allMeasurementsActive;
    setAllMeasurementsActive(newState);
    if (singleMeasurementActive) {
      setSingleMeasurementActive(false);
    }
    if (wallsOnlyMeasurementActive) {
      setWallsOnlyMeasurementActive(false);
    }
    if (objectToObjectMeasurementActive) {
      setObjectToObjectMeasurementActive(false);
    }
    if (newState) {
      configuratorInstance?.showAllMeasurements();
    } else {
      configuratorInstance?.clearAllMeasurements();
    }
  };

  const handleMeasurement = () => {
    setIsRightSidebarOpen(false);

    if (allMeasurementsActive) {
      setAllMeasurementsActive(false);
    }
    if (wallsOnlyMeasurementActive) {
      setWallsOnlyMeasurementActive(false);
    }
    if (objectToObjectMeasurementActive) {
      setObjectToObjectMeasurementActive(false);
    }

    const newState = !singleMeasurementActive;
    setSingleMeasurementActive(newState);

    configuratorInstance.measurementState.isActive = newState;
    configuratorInstance.measurementState.isWallsOnly = false;
    configuratorInstance.toggleMeasurement();
  };

  const handleWallsOnlyMeasurement = () => {
    setIsRightSidebarOpen(false);

    if (allMeasurementsActive) {
      setAllMeasurementsActive(false);
    }
    if (singleMeasurementActive) {
      setSingleMeasurementActive(false);
    }
    if (objectToObjectMeasurementActive) {
      setObjectToObjectMeasurementActive(false);
    }

    const newState = !wallsOnlyMeasurementActive;
    setWallsOnlyMeasurementActive(newState);

    configuratorInstance.measurementState.isActive = newState;
    configuratorInstance.measurementState.isWallsOnly = true;
    configuratorInstance.toggleMeasurement();
  };

  const handleObjectToObjectMeasurement = () => {
    setIsRightSidebarOpen(false);

    if (allMeasurementsActive) {
      setAllMeasurementsActive(false);
    }
    if (singleMeasurementActive) {
      setSingleMeasurementActive(false);
    }
    if (wallsOnlyMeasurementActive) {
      setWallsOnlyMeasurementActive(false);
    }

    const newState = !objectToObjectMeasurementActive;
    setObjectToObjectMeasurementActive(newState);

    if (newState) {
      configuratorInstance?.deselectModel();
      setIsModelSelected(false);
      showSlider(false);

      setObjectSelectionStep(1);
      objectSelectionStepRef.current = 1;
      setFirstSelectedModelName(null);
      setSecondSelectedModelName(null);
      setObjectToObjectDistance(null);
      firstSelectedModelNameRef.current = null;
      configuratorInstance?.clearAllMeasurements();

      closeAll();
      addToast({
        title: TOAST_MESSAGES.OBJECT_MEASUREMENT_START.title,
        description: TOAST_MESSAGES.OBJECT_MEASUREMENT_START.description,
        timeout: 4000,
        color: "primary",
        shouldShowTimeoutProgress: true,
      });
    } else {
      configuratorInstance?.deselectModel();
      setIsModelSelected(false);
      showSlider(false);

      setObjectSelectionStep(0);
      objectSelectionStepRef.current = 0;
      setFirstSelectedModelName(null);
      setSecondSelectedModelName(null);
      setObjectToObjectDistance(null);
      firstSelectedModelNameRef.current = null;
      configuratorInstance?.clearAllMeasurements();
    }
  };

  const SetPerspectiveCamera = () => {
    showSlider(false);
    setIsRightSidebarOpen(false);
    configuratorInstance.setCameraType("perspective");
    setActiveCamera("perspective");
  };

  const SetOrthographicCamera = () => {
    showSlider(false);
    setIsRightSidebarOpen(false);
    configuratorInstance.setCameraType("orthographic");
    setActiveCamera("orthographic");
  };

  const handleWallHidingToggle = () => {
    setIsRightSidebarOpen(false);
    const newState = !wallHidingActive;
    setWallHidingActive(newState);
    configuratorInstance?.enableWallHiding(newState);
  };

  useEffect(() => {

    const onRotationChanged = (angle: number) => {
      setRotation(angle);
    };

    if (configuratorInstance) {
      Events.on(
        ConfiguratorEventType.ROTATION_CHANGED,
        onRotationChanged
      );
    }


    return () => {
      if (configuratorInstance) {
        Events.off(
          ConfiguratorEventType.ROTATION_CHANGED,
          onRotationChanged
        );
      }

    };

  }, [configuratorInstance]);

  useEffect(() => {
    if (!isRightSidebarOpen && activeTool === "replace") {
      setActiveTool(null);
    }
  }, [isRightSidebarOpen, activeTool]);

  // Dismiss the model context menu on any outside interaction.
  useEffect(() => {
    if (!contextMenu) return;

    const close = () => setContextMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };

    // Left-click anywhere closes it; the menu items stop propagation so their
    // own clicks are not swallowed by this listener.
    window.addEventListener("click", close);
    window.addEventListener("wheel", close);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("wheel", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  const handleContextMenuMove = () => {
    setContextMenu(null);
    handleTransfromMode();
  };

  const handleContextMenuRotate = () => {
    setContextMenu(null);
    handleRotateMode();
  };

  const handleContextMenuReplace = () => {
    setContextMenu(null);
    handleReplaceModel();
  };

  const handleContextMenuCopy = () => {
    setContextMenu(null);
    handleCopyModel();
  };

  const handleContextMenuMeasurement = () => {
    setContextMenu(null);
    handleMeasurement();
  };

  const handleContextMenuWallsOnlyMeasurement = () => {
    setContextMenu(null);
    handleWallsOnlyMeasurement();
  };

  const handleContextMenuAllMeasurements = () => {
    setContextMenu(null);
    handleToggleAllMeasurements();
  };

  const handleContextMenuObjectToObjectMeasurement = () => {
    setContextMenu(null);
    handleObjectToObjectMeasurement();
  };

  const handleContextMenuDelete = () => {
    setContextMenu(null);
    handleRemoveModel();
  };

  return (
    <div
      className="flex-1 bg-white h-100 w-100 relative animate-fade-in"
      ref={container3DRef}
      style={{ height: "92%", width: "100%" }}
    >
      {/* Object-to-Object Measurement Prompt Banner */}
      {objectToObjectMeasurementActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 transition-all duration-300 animate-fade-in bg-zinc-900/90 text-white select-none">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 shrink-0">
            <Icon icon="mdi:ruler-square" width={20} height={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Object to Object Measurement
            </span>
            <span className="text-xs md:text-sm font-medium text-zinc-200">
              {objectSelectionStep === 1 && "Step 1/2: Please select the first model in the scene"}
              {objectSelectionStep === 2 && !objectToObjectDistance && (
                <>
                  Step 2/2: Selected <strong className="text-white">"{firstSelectedModelName}"</strong>. Click the second model.
                </>
              )}
              {objectToObjectDistance !== null && (
                <>
                  Distance: <strong className="text-amber-400 text-sm md:text-base font-bold">{objectToObjectDistance.toFixed(2)} unit</strong> between {firstSelectedModelName} &amp; {secondSelectedModelName}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-3">
            {objectToObjectDistance !== null && (
              <Button
                size="sm"
                variant="flat"
                className="bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 text-xs px-2.5 h-7 rounded-lg"
                onPress={() => {
                  configuratorInstance?.deselectModel();
                  setIsModelSelected(false);
                  showSlider(false);
                  setObjectSelectionStep(1);
                  objectSelectionStepRef.current = 1;
                  setFirstSelectedModelName(null);
                  setSecondSelectedModelName(null);
                  setObjectToObjectDistance(null);
                  firstSelectedModelNameRef.current = null;
                  configuratorInstance?.clearAllMeasurements();
                  closeAll();
                  addToast({
                    title: TOAST_MESSAGES.OBJECT_MEASUREMENT_START.title,
                    description: TOAST_MESSAGES.OBJECT_MEASUREMENT_START.description,
                    timeout: 4000,
                    color: "primary",
                    shouldShowTimeoutProgress: true,
                  });
                }}
              >
                New Pair
              </Button>
            )}
            <Button
              size="sm"
              isIconOnly
              variant="light"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full w-7 h-7 min-w-7"
              onPress={handleObjectToObjectMeasurement}
            >
              <Icon icon="mdi:close" width={16} height={16} />
            </Button>
          </div>
        </div>
      )}
      {/* Right-click context menu for the selected furniture model */}
      {contextMenu && (
        <div
          className={`fixed z-50 w-60 origin-top-left rounded-xl border p-1.5 select-none shadow-2xl ring-1 animate-context-menu ${theme === "dark"
            ? "bg-zinc-900/95 border-zinc-800 ring-black/40 text-zinc-200 backdrop-blur-xl"
            : "bg-white/95 border-zinc-200/80 ring-black/5 text-zinc-700 backdrop-blur-xl"
            }`}
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 248),
            top: Math.min(contextMenu.y, window.innerHeight - 320),
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header: the model this menu acts on */}
          <div
            className={`flex items-center gap-2 px-2.5 pb-2 pt-1.5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"
              }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${theme === "dark" ? "bg-amber-400/15 text-amber-400" : "bg-zinc-900 text-white"
                }`}
            >
              <Icon icon={Icons.cubeOutline} width={14} height={14} />
            </span>
            <span className="truncate text-xs font-semibold uppercase tracking-wide">
              {contextMenu.label}
            </span>
          </div>

          <div className={`mb-1 h-px ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`} />

          {[
            { key: "move", label: "Move", icon: Icons.rankIcon, shortcut: "T", active: transformMode === "translate", onClick: handleContextMenuMove },
            { key: "rotate", label: "Rotate", icon: Icons.baselineAutorenew, shortcut: "R", active: transformMode === "rotate", onClick: handleContextMenuRotate },
            { divider: true, key: "d0" },
            { key: "replace", label: "Replace", icon: Icons.baselineSyncAlt, shortcut: "S", onClick: handleContextMenuReplace },
            { key: "copy", label: "Copy", icon: Icons.outlineContentCopy, shortcut: "Ctrl C", onClick: handleContextMenuCopy },
            { divider: true, key: "d1" },
            {
              key: "measureParent",
              label: "Measurements",
              icon: Icons.measurementIcon,
              active: singleMeasurementActive || wallsOnlyMeasurementActive || objectToObjectMeasurementActive || allMeasurementsActive,
              children: [
                { key: "measure", label: "Item to Item/Wall", icon: Icons.measurementIcon, shortcut: "M", active: singleMeasurementActive, onClick: handleContextMenuMeasurement },
                { key: "measureWall", label: "Item to Wall", icon: "mdi:arrow-expand-horizontal", active: wallsOnlyMeasurementActive, onClick: handleContextMenuWallsOnlyMeasurement },
                { key: "measureObjectToObject", label: "Object to Object", icon: "mdi:ruler-square", active: objectToObjectMeasurementActive, onClick: handleContextMenuObjectToObjectMeasurement },
                { key: "measureAll", label: "All Measurements", icon: Icons.rulerIcon, shortcut: "⇧ M", active: allMeasurementsActive, onClick: handleContextMenuAllMeasurements },
              ]
            },
            { divider: true, key: "d2" },
            { key: "delete", label: "Delete", icon: Icons.trashSolid, shortcut: "Del", danger: true, onClick: handleContextMenuDelete },
          ].map((item) =>
            item.divider ? (
              <div
                key={item.key}
                className={`my-1 h-px ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`}
              />
            ) : item.children ? (
              <div key={item.key} className="relative group">
                <button
                  className={`group/btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${item.active
                    ? theme === "dark"
                      ? "bg-amber-400/15 text-amber-400"
                      : "bg-zinc-900/5 text-black font-medium"
                    : theme === "dark"
                      ? "hover:bg-zinc-800 hover:text-white"
                      : "hover:bg-zinc-100 hover:text-black"
                    }`}
                >
                  <Icon icon={item.icon!} width={16} height={16} className="shrink-0" />
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  <Icon icon="mdi:chevron-right" width={16} height={16} className="shrink-0 opacity-50" />
                </button>
                <div className={`absolute left-full top-0 ml-1 hidden group-hover:block group-focus-within:block w-50 rounded-xl border p-1.5 shadow-2xl ring-1 ${theme === "dark"
                  ? "bg-zinc-900/95 border-zinc-800 ring-black/40 text-zinc-200 backdrop-blur-xl"
                  : "bg-white/95 border-zinc-200/80 ring-black/5 text-zinc-700 backdrop-blur-xl"
                  }`}>
                  {item.children.map(child => (
                    <button
                      key={child.key}
                      onClick={child.onClick}
                      className={`group/child flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${child.active
                        ? theme === "dark"
                          ? "bg-amber-400/15 text-amber-400"
                          : "bg-zinc-900/5 text-black font-medium"
                        : theme === "dark"
                          ? "hover:bg-zinc-800 hover:text-white"
                          : "hover:bg-zinc-100 hover:text-black"
                        }`}
                    >
                      <Icon icon={child.icon!} width={16} height={16} className="shrink-0" />
                      <span className="flex-1 truncate text-left">{child.label}</span>
                      {child.active ? (
                        <Icon icon={Icons.checkIcon} width={14} height={14} className="shrink-0" />
                      ) : child.shortcut ? (
                        <kbd className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide ${theme === "dark" ? "bg-zinc-800 text-zinc-400 group-hover/child:bg-zinc-700" : "bg-zinc-100 text-zinc-500 group-hover/child:bg-zinc-200"
                          }`}>
                          {child.shortcut}
                        </kbd>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                key={item.key}
                onClick={item.onClick}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${item.danger
                  ? theme === "dark"
                    ? "text-red-400 hover:bg-red-500/15"
                    : "text-red-600 hover:bg-red-50"
                  : item.active
                    ? theme === "dark"
                      ? "bg-amber-400/15 text-amber-400"
                      : "bg-zinc-900/5 text-black font-medium"
                    : theme === "dark"
                      ? "hover:bg-zinc-800 hover:text-white"
                      : "hover:bg-zinc-100 hover:text-black"
                  }`}
              >
                <Icon icon={item.icon!} width={16} height={16} className="shrink-0" />
                <span className="flex-1 truncate text-left">{item.label}</span>
                {item.active ? (
                  <Icon
                    icon={Icons.checkIcon}
                    width={14}
                    height={14}
                    className="shrink-0"
                  />
                ) : item.shortcut ? (
                  <kbd
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide ${item.danger
                      ? theme === "dark" ? "text-red-400/70" : "text-red-500/70"
                      : theme === "dark"
                        ? "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                      }`}
                  >
                    {item.shortcut}
                  </kbd>
                ) : null}
              </button>
            )
          )}
        </div>
      )}

      {/* Finishes section - Only visible in 3D tab */}
      {is3DTabActive && !isConfigUiOpen && (
        <>
          {/* Finishes trigger button (hidden when panel is open) */}
          {!isTextureAndColorPanelOpen && (
            <Tooltip content="Finishes" showArrow closeDelay={0}>
              <button
                onClick={() => setIsTextureAndColorPanelOpen((v) => !v)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border shadow-lg transition-all duration-200 ${theme === "dark"
                  ? "bg-zinc-950/90 border-zinc-800 text-amber-400 hover:bg-zinc-900"
                  : "bg-white/95 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                aria-label="Open finishes panel"
              >
                <Icon icon={Icons.paletteSwatchOutline} width={20} height={20} />
              </button>
            </Tooltip>
          )}

          {/* Texture overlay panel (slides in from the right) */}
          <TextureAndColorPanel
            open={isTextureAndColorPanelOpen}
            onClose={() => setIsTextureAndColorPanelOpen(false)}
            configuratorInstance={configuratorInstance}
          />
        </>
      )}

      {isConfigUiOpen && (
        <div
          className={`absolute flex items-center rounded-full text-white px-6 py-3 shadow-2xl h-14 bottom-4 left-1/3 z-10 select-none ${theme === "dark" ? "bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-md" : "bg-black"}`}
        >
          <Tooltip content="Move" placement="top" closeDelay={50}>
            <button
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${transformMode === "translate" ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"
                }`}
              onClick={handleTransfromMode}
            >
              <Icon icon="ep:rank" width={18} height={18} />
            </button>
          </Tooltip>
          <div className="w-px h-5 bg-zinc-800 mx-3"></div>
          <Tooltip content="Rotate" closeDelay={50}>
            <button
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${transformMode === "rotate" ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"
                }`}
              onClick={handleRotateMode}
            >
              <Icon
                icon="material-symbols-light:autorenew"
                width={18}
                height={18}
              />
            </button>
          </Tooltip>
          {transformMode === "rotate" && configuratorInstance?.isModelSelected() && (
            <div className={`absolute left-1/2 -translate-x-1/2 mt-3 bottom-16 w-72 rounded-full px-6 py-1 shadow-lg z-20 ${theme === "dark" ? "bg-zinc-950/95 border border-zinc-800" : "bg-black border border-zinc-800"}`}>
              <p className={`text-center text-xs font-bold mt-2 mb-1 ${theme === "dark" ? "text-amber-400" : "text-white"}`}>{rotation}°</p>

              <Slider
                aria-label="rotation"
                className="max-w-md"
                value={rotation}
                maxValue={360}
                minValue={0}
                color={theme === "dark" ? "warning" : "primary"}
                size="sm"
                step={1}
                onChange={(value) => {
                  const val = value as number;

                  const accepted =
                    configuratorInstance.rotateModel("y", val);

                  if (accepted) {
                    setRotation(val);
                  }
                }}
              />
            </div>
          )}

          <div className="w-px h-5 bg-zinc-800 mx-3"></div>
          <Tooltip content="Replace" closeDelay={50}>
            <button
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${activeTool === "replace" ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"
                }`}
              onClick={handleReplaceModel}
            >
              <Icon icon={Icons.baselineSyncAlt} width={18} height={18} />
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-zinc-800 mx-3"></div>
          <Tooltip content="Makecopy" closeDelay={50}>
            <button
              className={`flex items-center gap-2 p-2 rounded-full transition ${!isModelSelected ? "opacity-50 cursor-not-allowed text-zinc-400" : `cursor-pointer ${activeTool === "copy" ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"}`}`}
              onClick={handleCopyModel}
            >
              <Icon icon={Icons.outlineContentCopy} width={18} height={18} />
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-zinc-800 mx-3"></div>
          <Tooltip content="Export 3D Scene (.glb)" closeDelay={50}>
            <button
              className={`flex items-center gap-2 p-2 rounded-full transition cursor-pointer hover:bg-zinc-800/80 text-zinc-400 hover:text-white`}
              onClick={async () => {
                try {
                  // const glbData = await (configuratorInstance as any)?.exportSceneAsGLB();
                  const configData = await (configuratorInstance as any)?.export3DConfig();
                  

                  console.log("configData", configData);
                } catch (err) {
                  console.error("Failed to export GLB:", err);
                }
              }}
            >
              <Icon icon={Icons.downloadIcon || Icons.cubeOutline} width={18} height={18} />
            </button>
          </Tooltip>


          <div className="w-px h-5 bg-zinc-800 mx-3"></div>
          <Tooltip content="Delete" closeDelay={50}>
            <button
              className={`flex items-center gap-2 p-2 rounded-full transition ${!isModelSelected ? "opacity-50 cursor-not-allowed text-zinc-400" : `cursor-pointer ${activeTool === "remove" ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"}`}`}
              onClick={handleRemoveModel}
            >
              <Icon icon={Icons.trashSolid} width={18} height={18} />
            </button>
          </Tooltip>
          <div className="w-px h-5 bg-zinc-800 mx-3"></div>
          <div className="inline-block">
            <Dropdown
              isOpen={isMeasurementMenuOpen}
              onOpenChange={setIsMeasurementMenuOpen}
              placement="top"
              className={`w-[165px] min-w-[165px] px-2 mb-2 border ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"}`}
            >
              <DropdownTrigger>
                <button
                  onMouseEnter={() => setIsMeasurementMenuOpen(true)}
                  onMouseLeave={() => setIsMeasurementMenuOpen(false)}
                  className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${singleMeasurementActive || wallsOnlyMeasurementActive || objectToObjectMeasurementActive ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"
                    }`}
                >
                  <Icon icon={Icons.measurementIcon} width={18} height={18} />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Measurement Options"
                onMouseEnter={() => setIsMeasurementMenuOpen(true)}
                onMouseLeave={() => setIsMeasurementMenuOpen(false)}
              >
                <DropdownItem
                  key="itemToItem"
                  onClick={handleMeasurement}
                  className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} ${singleMeasurementActive ? (theme === "dark" ? "text-amber-400 font-bold" : "text-black font-bold") : theme === "dark" ? "text-zinc-200" : "text-zinc-700"}`}
                >
                  Item to Item/Wall
                </DropdownItem>
                <DropdownItem
                  key="itemToWall"
                  onClick={handleWallsOnlyMeasurement}
                  className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} ${wallsOnlyMeasurementActive ? (theme === "dark" ? "text-amber-400 font-bold" : "text-black font-bold") : theme === "dark" ? "text-zinc-200" : "text-zinc-700"}`}
                >
                  Item to Wall
                </DropdownItem>
                <DropdownItem
                  key="objectToObject"
                  onClick={handleObjectToObjectMeasurement}
                  className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} ${objectToObjectMeasurementActive ? (theme === "dark" ? "text-amber-400 font-bold" : "text-black font-bold") : theme === "dark" ? "text-zinc-200" : "text-zinc-700"}`}
                >
                  Object to Object
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          <div className="w-px h-5 bg-zinc-800 mx-3"></div>
          <Tooltip content="All Measurements" closeDelay={50}>
            <button
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${allMeasurementsActive ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"
                }`}
              onClick={handleToggleAllMeasurements}
            >
              <Icon icon={Icons.rulerIcon} width={18} height={18} />
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-zinc-800 mx-3"></div>

          <Tooltip content="Show/Hide Walls" closeDelay={50}>
            <button
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${wallHidingActive ? (theme === "dark" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" : "bg-white text-black shadow-md shadow-white/20 font-bold") : "hover:bg-zinc-800/80 text-zinc-400 hover:text-white"}`}
              onClick={handleWallHidingToggle}
            >
              <Icon icon={Icons.wallIcon} width={18} height={18} />
            </button>
          </Tooltip>
          <div className="w-px h-5 bg-gray-600 mx-3"></div>


          <div className="inline-block">
            <Dropdown
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              placement="top"
              className={`w-[130px] min-w-[130px] px-2 mb-2 border ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"}`}
            >
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="bg-transparent hover:bg-zinc-800/85 text-zinc-400 hover:text-white rounded-full p-2 h-9 w-9 min-w-9"
                  onMouseEnter={() => setIsOpen(true)}
                  onMouseLeave={() => setIsOpen(false)}
                >
                  <Icon icon={Icons.cameraIcon} width={18} height={18} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                aria-label="Camera Options">
                <DropdownItem
                  key="perspective"
                  onClick={SetPerspectiveCamera}
                  className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} ${activeCamera === "perspective" ? (theme === "dark" ? "text-amber-400 font-bold" : "text-black font-bold") : theme === "dark" ? "text-zinc-200" : "text-zinc-700"}`}
                >
                  Perspective
                </DropdownItem>

                <DropdownItem
                  key="orthographic"
                  onClick={SetOrthographicCamera}
                  className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} ${activeCamera === "orthographic" ? (theme === "dark" ? "text-amber-400 font-bold" : "text-black font-bold") : theme === "dark" ? "text-zinc-200" : "text-zinc-700"}`}
                >
                  Orthographic
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

        </div>
      )}
    </div>
  );
}
