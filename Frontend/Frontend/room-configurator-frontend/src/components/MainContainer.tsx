import { useState, useEffect} from "react";
import DesignArea from "./DesignArea";
import TopPanel from "./TopPanel";
import { ConfiguratorCore, ConfiguratorEventType, Events } from "three-configurator";
import { Icon } from "@iconify/react";
import { Tooltip, addToast } from "@heroui/react";
import { useTheme } from "../ThemeContext";
import PriceSummaryPanel from "./PriceSummaryPanel";

type MainContainerProps = {
  isRoomPresent: boolean;
  isSidebarOpen: boolean;
  isModelPanelOpen: boolean;
  isRightSidebarOpen: boolean;
  toggleSidebar: () => void;
  configuratorInstance: ConfiguratorCore | undefined;
  roomConfig: any;
  setReplacementOptions: any;
  setIsRightSidebarOpen: any;
  setSearchTerm: any;
  setIsModelPanelOpen: any;
  rotation: any;
  setRotation: any;
  container3DRef: React.MutableRefObject<HTMLDivElement | null>;
  isExistingLayout: boolean;
  onViewModeChange?: (mode: "2D" | "3D") => void;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfigUiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isConfigUiOpen: boolean;
  floorPlanManager?: any;
  onBack?: () => void;
  isNewModelLoading: boolean;
  setIsNewModelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  is3DTabActive: boolean;
  onLogout?: () => void;
  selectedProject: any;
};

const MainContainer = ({
  isRoomPresent,
  isSidebarOpen,
  isModelPanelOpen,
  isRightSidebarOpen,
  toggleSidebar,
  configuratorInstance,
  roomConfig,
  setReplacementOptions,
  setIsRightSidebarOpen,
  setSearchTerm,
  setIsModelPanelOpen,
  rotation,
  setRotation,
  container3DRef,
  isExistingLayout,
  onViewModeChange,
  setIsLeftPanelOpen,
  setIsConfigUiOpen,
  isConfigUiOpen,
  floorPlanManager,
  onBack,
  isNewModelLoading,
  setIsNewModelLoading,
  is3DTabActive,
  onLogout,
  selectedProject
}: MainContainerProps) => {
  const { theme } = useTheme();
  const [slider, showSlider] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>("translate");
  const [allMeasurementsActive, setAllMeasurementsActive] = useState(false);
  const [singleMeasurementActive, setSingleMeasurementActive] = useState(false);
  const [wallsOnlyMeasurementActive, setWallsOnlyMeasurementActive] = useState(false);
  const [objectToObjectMeasurementActive, setObjectToObjectMeasurementActive] = useState(false);
  const [wallHidingActive, setWallHidingActive] = useState(false);
  const [isPriceSummaryOpen, setIsPriceSummaryOpen] = useState(false);

  useEffect(() => {
    if (!configuratorInstance) return;
    const handleUpdate = (data: any) => {
      if (data?.models?.length === 0) {
        setIsPriceSummaryOpen(false);
      }
    };
    Events.on(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, handleUpdate);
    return () => Events.off(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, handleUpdate);
  }, [configuratorInstance]);


  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        display: "flex",
        flexDirection: "column",
        width: isRightSidebarOpen
          ? isSidebarOpen
            ? "64%"
            : "82%"
          : isSidebarOpen && isModelPanelOpen
            ? "64%"
            : isSidebarOpen || isModelPanelOpen
              ? "82%"
              : "100%",
        height: "100%",
      }}
    >
      {/* Top Bar */}
      <TopPanel
        isRoomPresent={isRoomPresent}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        configuratorInstance={configuratorInstance}
        setRotation={setRotation}
        roomConfig={roomConfig}
        setReplacementOptions={setReplacementOptions}
        onViewModeChange={onViewModeChange}
        setIsLeftPanelOpen={setIsLeftPanelOpen}
        setIsConfigUiOpen={setIsConfigUiOpen}
        isConfigUiOpen={isConfigUiOpen}
        onBack={onBack}
        setIsRightSidebarOpen={setIsRightSidebarOpen}
        setIsModelPanelOpen={setIsModelPanelOpen}
        setActiveTool={setActiveTool}
        setAllMeasurementsActive={setAllMeasurementsActive}
        setSingleMeasurementActive={setSingleMeasurementActive}
        setWallsOnlyMeasurementActive={setWallsOnlyMeasurementActive}
        setObjectToObjectMeasurementActive={setObjectToObjectMeasurementActive}
        setWallHidingActive={setWallHidingActive}
        showSlider={showSlider}
        manager={floorPlanManager}
        onLogout={onLogout}
        selectedProject={selectedProject}
      />
      
      {/* Floating Action Bar */}
      {isConfigUiOpen && (
        <div 
          className="absolute bottom-4 z-[60] flex flex-col items-end gap-1 drop-shadow-md"
          style={{
            right: isModelPanelOpen || isRightSidebarOpen ? "17.9%" : isPriceSummaryOpen ? "15%" : "0%",
          }}
        >
        <Tooltip content="Model Hierarchy" placement="left">
          <button
            className={`flex items-center justify-center w-3.5 h-12 transition-colors ${
              isModelPanelOpen
                ? "bg-amber-500 text-white"
                : (theme === "dark" ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white" : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")
            }`}
            style={{ clipPath: "polygon(0 10%, 100% 0, 100% 100%, 0 90%)" }}
            onClick={() => {
              setIsModelPanelOpen((prev: boolean) => !prev);
              setIsRightSidebarOpen(false);
              setIsPriceSummaryOpen(false);
            }}
          >
            <Icon icon="lucide:chevron-left" className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Price Summary" placement="left">
          <button
            className={`flex items-center justify-center w-3.5 h-12 transition-colors ${
              isPriceSummaryOpen
                ? "bg-amber-500 text-white"
                : (theme === "dark" ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white" : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")
            }`}
            style={{ clipPath: "polygon(0 10%, 100% 0, 100% 100%, 0 90%)" }}
            onClick={() => {
              if (configuratorInstance?.getModelsSummary()?.models?.length === 0) {
                addToast({
                  title: "No Models Found",
                  description: "Please add a model to the room to view the price summary.",
                  color: "warning",
                });
                return;
              }
              setIsPriceSummaryOpen((prev) => !prev);
              setIsModelPanelOpen(false);
              setIsRightSidebarOpen(false);
            }}
          >
            <Icon icon="lucide:chevron-left" className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      )}

      {(isConfigUiOpen && isPriceSummaryOpen) && (
        <PriceSummaryPanel 
          configuratorInstance={configuratorInstance} 
          isModelPanelOpen={isModelPanelOpen}
          isRightSidebarOpen={isRightSidebarOpen}
        />
      )}

      {/* Design Area */}
      <DesignArea
        configuratorInstance={configuratorInstance}
        rotation={rotation}
        setRotation={setRotation}
        roomConfig={roomConfig}
        setReplacementOptions={setReplacementOptions}
        setIsRightSidebarOpen={setIsRightSidebarOpen}
        isRightSidebarOpen={isRightSidebarOpen}
        setSearchTerm={setSearchTerm}
        setIsModelPanelOpen={setIsModelPanelOpen}
        container3DRef={container3DRef}
        isExistingLayout={isExistingLayout}
        isConfigUiOpen={isConfigUiOpen}
        floorPlanManager={floorPlanManager}
        isNewModelLoading={isNewModelLoading}
        setIsNewModelLoading={setIsNewModelLoading}
        is3DTabActive={is3DTabActive}
        slider={slider}
        showSlider={showSlider}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        allMeasurementsActive={allMeasurementsActive}
        setAllMeasurementsActive={setAllMeasurementsActive}
        singleMeasurementActive={singleMeasurementActive}
        setSingleMeasurementActive={setSingleMeasurementActive}
        wallsOnlyMeasurementActive={wallsOnlyMeasurementActive}
        setWallsOnlyMeasurementActive={setWallsOnlyMeasurementActive}
        objectToObjectMeasurementActive={objectToObjectMeasurementActive}
        setObjectToObjectMeasurementActive={setObjectToObjectMeasurementActive}
        wallHidingActive={wallHidingActive}
        setWallHidingActive={setWallHidingActive}
        setIsPriceSummaryOpen={setIsPriceSummaryOpen}
      />
    </div>
  );
};

export default MainContainer;
