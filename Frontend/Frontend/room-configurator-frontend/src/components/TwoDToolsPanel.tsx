import { Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { FloorplanManager, Predefined2DShapes, Events, ConfiguratorEventType, LengthUnit } from "three-configurator";
import { DETECT_FLOORPLAN_API, IS_AI_TOOLS_ENABLED } from "./Constants";
import ConfirmationToast from "./ConfirmationToast";

type TwoDToolsPanelProps = {
  manager: FloorplanManager | null;
};

export default function TwoDToolsPanel({
  manager,
}: TwoDToolsPanelProps) {
  const { theme, colors } = useTheme();

  const [activeTool, setActiveTool] = useState("");
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const [isGridEnabled, setIsGridEnabled] = useState(true);
  const [isMeasurementActive, setIsMeasurementActive] = useState(true);
  const [gridScale, setGridScale] = useState<number>(30);
  const [selectedUnit, setSelectedUnit] = useState<string>(LengthUnit.MM);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStep, setUploadStep] = useState(0);
  const [hasUploadedBackground, setHasUploadedBackground] = useState(false);
  const [isBgVisible, setIsBgVisible] = useState(false);
  const [isDrawingVisible, setIsDrawingVisible] = useState(true);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editDimensionMenu, setEditDimensionMenu] = useState<any>(null);
  const [selectedDirection, setSelectedDirection] = useState<"left" | "right" | "top" | "down" | "">("");

  const previewState = useRef({
    initialLength: 0,
    lastAppliedLength: 0,
    lastAppliedDir: "",
    isFinalized: false
  });

  const aiSteps = [
    { title: "AI Model is Analyzing Image...", description: "Detecting the shape, size, and layout of your space." },
    { title: "AI Generating 2D Layout...", description: "Constructing the final interactive 2D canvas from AI predictions." }
  ];
  useEffect(() => {
    if (manager) {
      manager.setLengthUnit(selectedUnit);
      manager.on2DModeChange = (mode: any) => {
        if (mode === null) {
          setActiveTool("");
          console.log("Mode cancelled");
        } else if (mode === "Draw") {
          setActiveTool("draw");
        } else if (mode === "Window") {
          setActiveTool("window");
        } else if (mode === "Door") {
          setActiveTool("door");
        } else if (mode === "Edit") {
          setActiveTool("edit");
        }
      };
    }
  }, [manager, selectedUnit]);
  useEffect(() => {
    const handleEditDimension = (payload: any) => {
      setActiveTool("edit");
      setEditDimensionMenu(payload);

      const initLen = Number(parseFloat(payload.currentValue).toFixed(1));
      const initDir = payload.isVertical ? "down" : "right";

      setSelectedDirection(initDir);

      previewState.current = {
        initialLength: initLen,
        lastAppliedLength: initLen,
        lastAppliedDir: initDir,
        isFinalized: false
      };
    };

    Events.on(ConfiguratorEventType.EDIT_WALL_DIMENIONS, handleEditDimension);

    return () => {
      Events.off(ConfiguratorEventType.EDIT_WALL_DIMENIONS, handleEditDimension);
    };

  }, []);

  useEffect(() => {

    if (!editDimensionMenu) return;

    const close = () => {
      // Small delay to ensure other click events (like toolbar buttons) can fire first
      setTimeout(() => {
        setEditDimensionMenu((prev: any) => {
          if (prev && !previewState.current.isFinalized) {
            // Revert changes if not finalized
            prev.setNewWallDimension(
              previewState.current.initialLength,
              previewState.current.lastAppliedDir
            );
          }
          return null;
        });
      }, 50);
    };

    window.addEventListener("pointerup", close);
    window.addEventListener("wheel", close);
    window.addEventListener("keydown", close);

    return () => {
      window.removeEventListener("pointerup", close);
      window.removeEventListener("wheel", close);
      window.removeEventListener("keydown", close);
    };

  }, [editDimensionMenu]);

  const applyWallHighlight = () => {
    manager?.highlightWalls(isBgVisible, theme);
  };

  useEffect(() => {
    applyWallHighlight();
  }, [isBgVisible, theme, manager]);

  const handleDraw = () => {
    if (!manager) return;
    const isDrawing = activeTool === "draw";

    if (isDrawing) {
      manager.set2DMode("Draw", false);
    } else {
      manager.set2DMode("Draw", true);
    }
  };

  const handleSnapping = () => {
    if (!manager) return;

    const newState = manager.enableSnapping(isSnappingEnabled ? false : true);
    setIsSnappingEnabled(newState);
    console.log(`snapping ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleDoor = () => {
    if (!manager) return;
    const isDoor = activeTool === "door";

    if (isDoor) {
      manager.set2DMode("Door", false);
    } else {
      manager.set2DMode("Door", true);
    }
  };

  const handleWindow = () => {
    if (!manager) return;
    const isWindow = activeTool === "window";

    if (isWindow) {
      manager.set2DMode("Window", false);
    } else {
      manager.set2DMode("Window", true);
    }
  };

  const handleToggleMeasurement = () => {
    setActiveTool("measurement");
    if (!manager) return;
    const measurementState = manager.enableDimensions(isMeasurementActive ? false : true);
    setIsMeasurementActive(measurementState);
    console.log(`measurement ${measurementState ? 'enable' : 'disable'}`)
  };

  const handleToggleGrid = () => {
    if (!manager) return;

    const newState = manager.enableGrid(isGridEnabled ? false : true);
    setIsGridEnabled(newState);
    console.log(`Grid ${newState ? 'enabled' : 'disabled'}`);
    if (newState && activeTool === "background") {
      setActiveTool("");
    }
  };

  const setDrawingVisibility = (visible: boolean) => {
    if (!manager) return;
    manager.setDrawingOverlayVisibility(visible);
    setIsDrawingVisible(visible);
  };

  const handleToggleDrawing = () => {
    setDrawingVisibility(!isDrawingVisible);
  };

  const handleToggleAIBackground = () => {
    if (!manager) return;

    if (isBgVisible) {
      manager.enableBackgroundImage(false);
      setIsBgVisible(false);
      console.log("AI bg disable");
      if (!isDrawingVisible) {
        setDrawingVisibility(true);
      }
    } else {
      manager.enableBackgroundImage(true);
      setIsBgVisible(true);
      console.log("AI bg enable");
    }
  };

  const handleLoadLayout = async (file: any) => {
    if (!manager || !file) return;

    try {
      setActiveTool("load");
      setIsUploading(true);
      setUploadStep(0);
      setUploadError("");

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);

      // // Cycle steps in the background if API takes longer than 3 seconds

      // Make POST request and parse JSON, throwing error on failure
      const apiPromise = fetch(DETECT_FLOORPLAN_API, {
        method: "POST",
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to upload file");
        }
        return await response.json();
      });

      // Guarantee at least 2 seconds on the initial "Detecting" step
      const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 2000));

      // Wait for both API and the minimum 3 second delay. If API fails, it rejects instantly.
      const [layoutJson] = await Promise.all([apiPromise, minDelayPromise]);

      // Jump to the final "Preparing 2D layout..." step
      setUploadStep(1);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 1. Clear existing layout and load JSON to main canvas
      manager.clear2DLayout();
      manager.loadLayoutFromJson(layoutJson);

      // 2. Process and inject the background image into main canvas
      const imageUrl = URL.createObjectURL(file);
      manager.setFloorPlanBackgroundImage(imageUrl, layoutJson, theme === "dark");

      setHasUploadedBackground(true);
      setIsBgVisible(true);

      // Highlight the walls by forcing them to stand out
      setTimeout(() => {
        manager.highlightWalls(true, theme);
        manager.fitToView();
      }, 200);

      console.log("Layout loaded directly into main canvas.");
    } catch (error) {
      console.error("Error loading layout:", error);
      setUploadError("The AI service is currently down please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    if (!manager) return;
    const isEdit = activeTool === "edit";

    if (isEdit) {
      manager.set2DMode("Edit", false);
    } else {
      manager.set2DMode("Edit", true);
    }
  };

  const handleDeleteWall = () => {
    if (!manager) return;
    manager.deleteSelectedEntity();
  };

  const handleScaleChange = (val: number) => {
    if (!manager) return;
    manager.set2DUnitScale(val);
    setGridScale(val);
    console.log(`Grid scale changed to ${val} cm`);
  };

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    if (manager) {
      manager.setLengthUnit(unit);
      console.log(`Unit changed to ${unit}`);
    }
  };

  const scaleOptions = [30, 40, 50, 60, 70, 80, 90, 100];

  const handleClear2DLayout = async () => {
    const has2DData = await manager?.is2DDataPresent();

    if (has2DData) {
      console.log("There is 2D data present");
      setShowClearConfirm(true);
    }
  };

  const confirmClear2DLayout = () => {
    if (manager) {
      manager.clear2DLayout();

      manager.clearFloorPlanBackgroundImage();

      setHasUploadedBackground(false);
      setIsBgVisible(false);
      setDrawingVisibility(true);
    }
    setShowClearConfirm(false);
  };

  const cancelClear2DLayout = () => {
    setShowClearConfirm(false);
  };


  const handleFitToView = () => {
    if (manager) {
      manager.fitToView();
    }
  };

  const handlePredefinedShape = (shape: string) => {
    switch (shape) {
      case "rectangle":
        // add rectangle
        manager.addPredefinedShape(Predefined2DShapes.RECTANGLE);
        break;

      case "square":
        // add square
        manager.addPredefinedShape(Predefined2DShapes.SQUARE);
        break;

      case "lshape":
        // add L-shape
        manager.addPredefinedShape(Predefined2DShapes.L_SHAPE);
        break;

      case "triangle":
        // add triangle
        manager.addPredefinedShape(Predefined2DShapes.TRIANGLE);
        break;
    }
  };

  return (
    <>
      <div className={`absolute flex items-center rounded-full px-6 py-3 shadow-2xl h-14 bottom-4 left-1/2 -translate-x-1/2 z-50 select-none ${colors.twoDToolsPanelBg}`}>
        {/* Draw Tool */}
        <Tooltip content="Draw" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${activeTool === "draw" ? colors.twoDToolActive : colors.twoDToolInactive
              }`}
            onClick={handleDraw}
          >
            <Icon icon={Icons.pencilSolid} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-zinc-800 mx-3"></div>

        {/*Horizontal and Vertical snapping*/}
        <Tooltip content="Snap" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${isSnappingEnabled ? colors.twoDToolActive : colors.twoDToolInactive
              }`}
            onClick={handleSnapping}
          >
            <Icon icon={Icons.minusSolid} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-zinc-800 mx-3"></div>

        {/* Edit Tool */}
        <Tooltip content="Edit" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${activeTool === "edit" ? colors.twoDToolActive : colors.twoDToolInactive
              }`}
            onClick={handleEdit}
          >
            <Icon icon={Icons.mousePointerClick} width={20} height={20} />
          </button>
        </Tooltip>



        {/* Delete Tool (Only show when edit tool is active) */}
        {activeTool === "edit" && (
          <>
            <div className="w-px h-5 bg-gray-600 mx-3"></div>
            <Tooltip content="Delete Selected Wall" closeDelay={50}>
              <button
                className="flex items-center gap-2 cursor-pointer p-2 rounded-full transition hover:bg-red-500 text-zinc-400 hover:text-white"
                onClick={handleDeleteWall}
              >
                <Icon icon={Icons.trashSolid} width={20} height={20} />
              </button>
            </Tooltip>
          </>
        )}

        <div className="w-px h-5 bg-gray-600 mx-3"></div>

        {/* Door Tool */}
        <Tooltip content="Add Door" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${activeTool === "door" ? colors.twoDToolActive : colors.twoDToolInactive
              }`}
            onClick={handleDoor}
          >
            <Icon icon={Icons.doorOpen} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-zinc-800 mx-3"></div>

        {/* Window Tool */}
        <Tooltip content="Add Window" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${activeTool === "window" ? colors.twoDToolActive : colors.twoDToolInactive
              }`}
            onClick={handleWindow}
          >
            <Icon icon={Icons.windowClosed} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-zinc-800 mx-3"></div>

        {/* Toggle Measurement */}
        <Tooltip content="Toggle Measurement" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${isMeasurementActive ? colors.twoDToolActive : colors.twoDToolInactive
              }`}
            onClick={handleToggleMeasurement}
          >
            <Icon icon={Icons.measurementIcon} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-zinc-800 mx-3"></div>

        {/* Toggle Grid */}
        <Tooltip content="Toggle Grid" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${isGridEnabled ? colors.twoDToolActive : colors.twoDToolInactive
              }`}
            onClick={handleToggleGrid}
          >
            <Icon icon={Icons.squares2x2Solid} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-zinc-800 mx-3"></div>

        <Tooltip content="Fit to View" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${colors.twoDToolInactive}`}
            onClick={handleFitToView}
          >
            <Icon icon={Icons.maximizeIcon} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-gray-600 mx-3"></div>

        <Tooltip content="Clear 2D Layout" closeDelay={50}>
          <button
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${colors.twoDToolInactive}`}
            onClick={handleClear2DLayout}
          >
            <Icon icon={Icons.eraserIcon} width={18} height={18} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-gray-600 mx-3"></div>

        <Tooltip content="Predefined Shapes" closeDelay={50}>
          <div className="inline-block">
            <Dropdown placement="top" className="bg-zinc-950 border border-zinc-800 text-white">
              <DropdownTrigger>
                <button
                  className={`flex items-center gap-2 cursor-pointer p-2 rounded-full transition ${colors.twoDToolInactive}`}
                >
                  <Icon icon={Icons.shapeOutline} width={18} height={18} />
                </button>
              </DropdownTrigger>

              <DropdownMenu
                aria-label="Predefined Shapes"
                onAction={(key) => handlePredefinedShape(key as string)}
              >
                <DropdownItem key="rectangle">
                  Rectangle
                </DropdownItem>

                <DropdownItem key="square">
                  Square
                </DropdownItem>

                <DropdownItem key="lshape">
                  L-Shape
                </DropdownItem>

                <DropdownItem key="triangle">
                  Triangle
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </Tooltip>

        {isGridEnabled && (
          <>
            <div className="w-px h-5 bg-gray-600 mx-3"></div>

            {/* Grid Scale Dropdown */}
            <Tooltip content="Grid Scale" placement="top" closeDelay={50}>
              <div className="inline-block">
                <Dropdown placement="top" className="bg-zinc-950 border border-zinc-800 text-white">
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs min-w-unit-12 h-8 rounded-full px-3"
                    >
                      {gridScale} CM
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Grid Scale Options"
                    className="max-h-60 overflow-y-auto"
                    onAction={(key) => handleScaleChange(Number(key))}
                  >
                    {scaleOptions.map((val) => (
                      <DropdownItem key={val} className="text-zinc-200 hover:bg-zinc-800">
                        {val} cm
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </Tooltip>
          </>
        )}

        <div className="w-px h-5 bg-gray-600 mx-3"></div>

        {/* Measurement Unit Dropdown */}
        <Tooltip content="Unit" placement="top" closeDelay={50}>
          <div className="inline-block">
            <Dropdown placement="top" className="bg-zinc-950 border border-zinc-800 text-white">
              <DropdownTrigger>
                <Button
                  size="sm"
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs min-w-unit-12 h-8 rounded-full px-3 uppercase"
                >
                  {selectedUnit}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Measurement Unit Options"
                selectedKeys={new Set([selectedUnit])}
                selectionMode="single"
                onAction={(key) => handleUnitChange(key as string)}
              >
                <DropdownSection title="Metric" className="text-zinc-400">
                  <DropdownItem key="mm" className="text-zinc-200 hover:bg-zinc-800">
                    mm (Millimeter)
                  </DropdownItem>
                  <DropdownItem key="cm" className="text-zinc-200 hover:bg-zinc-800">
                    cm (Centimeter)
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection title="Imperial" className="text-zinc-400">
                  <DropdownItem key="inch" className="text-zinc-200 hover:bg-zinc-800">
                    inch (Inches)
                  </DropdownItem>
                  <DropdownItem key="foot" className="text-zinc-200 hover:bg-zinc-800">
                    foot (Feet)
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        </Tooltip>
      </div>

      {/* AI Tools Toggle Button */}
      {IS_AI_TOOLS_ENABLED && <div className={`absolute top-4 right-4 z-50 transition-all duration-200 ${isAIPanelOpen ? "opacity-0 pointer-events-none scale-75" : "opacity-100 scale-100"}`}>
        <Tooltip content="Import Layout" placement="left" closeDelay={50}>
          <button
            onClick={() => setIsAIPanelOpen(true)}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition shadow-lg ${colors.twoDToolActive}`}
          >
            <Icon icon="heroicons:sparkles-solid" width={24} height={24} />
          </button>
        </Tooltip>
      </div>}

      {/* The Squared Panel */}
      <AnimatePresence>
        {isAIPanelOpen && (
          <div className="absolute top-4 right-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, originX: 1, originY: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className={`p-4 rounded-xl shadow-xl border w-64 flex flex-col gap-4 pointer-events-auto ${theme === "dark" ? "bg-zinc-950/90 border-zinc-800 backdrop-blur-md" : "bg-white/95 border-zinc-200 backdrop-blur-md"
                }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-black"}`}>Import Layout</h3>
                <button
                  onClick={() => setIsAIPanelOpen(false)}
                  className={`p-1 rounded-md transition ${colors.twoDToolInactive}`}
                >
                  <Icon icon={Icons.xMark20Solid} width={16} height={16} />
                </button>
              </div>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                id="layout-image-upload"
                data-bg-visible={String(isBgVisible)}
                data-theme={theme}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleLoadLayout(file);
                  }
                  e.target.value = "";
                }}
              />

              <button
                className={`w-full py-4 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-all group ${theme === "dark"
                  ? "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-amber-400"
                  : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 hover:border-blue-500"
                  }`}
                onClick={() => document.getElementById("layout-image-upload")?.click()}
              >
                <div className={`p-2 rounded-full transition-transform duration-300 group-hover:scale-110 shadow-lg ${colors.twoDToolActive}`}>
                  <Icon icon={Icons.cloudArrowUpSolid} width={20} height={20} />
                </div>
                <div className="flex flex-col items-center mt-1">
                  <span className={`font-semibold text-sm ${theme === "dark" ? "text-zinc-200" : "text-zinc-700"}`}>
                    Click to browse
                  </span>
                  <span className={`text-xs mt-0.5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                    PNG or JPG
                  </span>
                </div>
              </button>

              {hasUploadedBackground && (
                <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-zinc-500/30">
                  <h4 className={`text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Visibility</h4>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Source Image</span>
                    <button
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition ${isBgVisible
                        ? colors.twoDToolActive
                        : colors.twoDToolInactive
                        }`}
                      onClick={handleToggleAIBackground}
                    >
                      <Icon icon={isBgVisible ? Icons.eyeSolid : Icons.eyeSlashSolid} width={16} height={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Drawing Layer</span>
                    <Tooltip content={!isBgVisible ? "Drawing must be visible when background is off" : ""} placement="left">
                      <div className="inline-block">
                        <button
                          className={`flex items-center justify-center w-8 h-8 rounded-lg transition ${!isBgVisible ? "opacity-50 cursor-not-allowed " + colors.twoDToolInactive :
                            isDrawingVisible
                              ? colors.twoDToolActive
                              : colors.twoDToolInactive
                            }`}
                          disabled={!isBgVisible}
                          onClick={handleToggleDrawing}
                        >
                          <Icon icon={isDrawingVisible ? Icons.pencilRuler : Icons.eyeOff} width={16} height={16} />
                        </button>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Processing Modal */}
      <Modal isOpen={isUploading} hideCloseButton isDismissable={false} size="md">
        <ModalContent className={theme === "dark" ? "bg-zinc-900 text-white" : ""}>
          <ModalBody className="flex flex-col items-center justify-center py-10 gap-6 overflow-hidden relative min-h-[300px]">
            {/* Sci-Fi Orbital AI Core Animation */}
            <div className="relative w-40 h-40 flex items-center justify-center mt-6" style={{ perspective: '500px' }}>
              {/* Outer Orbit 1 */}
              <motion.div
                animate={{ rotateX: [0, 360], rotateZ: [0, 180] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute w-32 h-32 rounded-full border border-primary/40 border-t-primary/80 border-b-primary/80"
                style={{ transformStyle: "preserve-3d" }}
              />
              {/* Outer Orbit 2 */}
              <motion.div
                animate={{ rotateY: [0, 360], rotateZ: [0, -180] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute w-32 h-32 rounded-full border border-primary/30 border-l-primary/80 border-r-primary/80"
                style={{ transformStyle: "preserve-3d" }}
              />
              {/* Inner Dashed Orbit */}
              <motion.div
                animate={{ rotateX: [0, -360], rotateY: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute w-20 h-20 rounded-full border-[3px] border-primary/50 border-dashed"
                style={{ transformStyle: "preserve-3d" }}
              />

              {/* Background Glow */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-0 w-12 h-12 bg-primary/40 rounded-full blur-md"
              />

              {/* Central AI Node */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="z-10 flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-primary/80 to-primary/20 rounded-full border border-primary/50 shadow-[0_0_15px_rgba(0,112,240,0.5)] backdrop-blur-md"
              >
                <Icon icon={Icons.sparklesSolid} className="text-white w-6 h-6" />
              </motion.div>
            </div>

            <div className="text-center z-10 w-full px-4 h-24 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={uploadStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <p className="font-bold text-xl text-primary mb-2">{aiSteps[uploadStep]?.title}</p>
                  <p className="text-sm text-default-500">{aiSteps[uploadStep]?.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step Indicators */}
            <div className="flex gap-2 z-10 mt-auto mb-2">
              {aiSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${index === uploadStep ? "w-8 bg-primary" : index < uploadStep ? "w-4 bg-primary/60" : "w-4 bg-default-200"}`}
                />
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={!!uploadError} onOpenChange={() => setUploadError("")}>
        <ModalContent className={theme === "dark" ? "bg-zinc-900 text-white" : ""}>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-danger">Error</ModalHeader>
              <ModalBody>
                <p>{uploadError}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {
        editDimensionMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            className={`fixed z-[9999] p-1.5 rounded-full shadow-2xl flex items-center gap-1.5 backdrop-blur-xl bg-[#0f1115] border border-zinc-800`}
            style={{
              left: editDimensionMenu.clientX + (editDimensionMenu.isVertical ? 40 : 0),
              top: editDimensionMenu.clientY + (editDimensionMenu.isVertical ? 0 : 30),
              transform: "translate(-50%, -150%)"
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${selectedDirection === (editDimensionMenu.isVertical ? "top" : "left")
                ? (theme === "dark" ? "bg-yellow-400 text-black shadow-md" : "bg-primary text-white shadow-md")
                : "bg-[#1c212b] text-white hover:bg-[#252b38]"
                }`}
              onClick={() => {
                const newDir = editDimensionMenu.isVertical ? "top" : "left";
                setSelectedDirection(newDir);
                // Apply preview
                editDimensionMenu.setNewWallDimension(previewState.current.initialLength, previewState.current.lastAppliedDir);
                editDimensionMenu.setNewWallDimension(previewState.current.lastAppliedLength, newDir);
                previewState.current.lastAppliedDir = newDir;
              }}
            >
              <Icon icon={editDimensionMenu.isVertical ? Icons.arrowUp : Icons.arrowLeft} width={14} height={14} strokeWidth={3} />
            </button>

            <input
              type="number"
              autoFocus
              onFocus={(e) => e.target.select()}
              min="1"
              step="any"
              defaultValue={Number(parseFloat(editDimensionMenu.currentValue).toFixed(1))}
              id="wall-dimension-input"
              className={`min-w-16 h-7 px-2 rounded-full text-center font-bold text-xs outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-[#161a22] text-white focus:bg-[#1e232e]`}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) {
                  editDimensionMenu.setNewWallDimension(val, selectedDirection);
                  previewState.current.lastAppliedLength = val;
                  previewState.current.lastAppliedDir = selectedDirection;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (val > 0) {
                    previewState.current.isFinalized = true;
                    setEditDimensionMenu(null);
                  }
                }
              }}
            />

            <button
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${selectedDirection === (editDimensionMenu.isVertical ? "down" : "right")
                ? (theme === "dark" ? "bg-yellow-400 text-black shadow-md" : "bg-primary text-white shadow-md")
                : "bg-[#1c212b] text-white hover:bg-[#252b38]"
                }`}
              onClick={() => {
                const newDir = editDimensionMenu.isVertical ? "down" : "right";
                setSelectedDirection(newDir);
                // Apply preview
                editDimensionMenu.setNewWallDimension(previewState.current.initialLength, previewState.current.lastAppliedDir);
                editDimensionMenu.setNewWallDimension(previewState.current.lastAppliedLength, newDir);
                previewState.current.lastAppliedDir = newDir;
              }}
            >
              <Icon icon={editDimensionMenu.isVertical ? Icons.arrowDown : Icons.arrowRight} width={14} height={14} strokeWidth={3} />
            </button>
          </motion.div>
        )
      }

      <ConfirmationToast
        isOpen={showClearConfirm}
        title="Clear 2D Layout"
        message="Are you sure you want to clear the 2D layout? All current progress will be lost."
        onConfirm={confirmClear2DLayout}
        onCancel={cancelClear2DLayout}
      />
    </>
  );
}
