import TwoDToolsPanel from "./TwoDToolsPanel";
import TopPanel from "./TopPanel";
import { useTheme } from "../ThemeContext";
import { FloorplanManager } from "three-configurator";

interface TwoDProps {
  containerRef: React.RefObject<HTMLDivElement>;
  visible: boolean;
  manager: FloorplanManager | null;
  isSidebarOpen: boolean;
  isModelPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  viewMode: "2D" | "3D";
  onViewModeChange: (mode: "2D" | "3D") => void;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfigUiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isConfigUiOpen: boolean;
  onBack?: () => void;
  isRoomPresent: boolean;
  onLogout?: () => void;
  selectedProject: any;
}

export default function TwoD({
  containerRef,
  visible,
  manager,
  isSidebarOpen,
  isModelPanelOpen,
  toggleSidebar,
  toggleRightSidebar,
  viewMode,
  onViewModeChange,
  setIsLeftPanelOpen,
  setIsConfigUiOpen,
  isConfigUiOpen,
  onBack,
  isRoomPresent,
  onLogout,
  selectedProject
}: TwoDProps) {
  const { colors } = useTheme();

  return (
    <div className={`flex flex-col h-full w-full absolute inset-0 ${colors.twoDBg}`} style={{ visibility: visible ? "visible" : "hidden" }}>
      <TopPanel
        isRoomPresent={isRoomPresent}
        isSidebarOpen={isSidebarOpen}
        isModelPanelOpen={isModelPanelOpen}
        toggleSidebar={toggleSidebar}
        toggleRightSidebar={toggleRightSidebar}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        setIsLeftPanelOpen={setIsLeftPanelOpen}
        setIsConfigUiOpen={setIsConfigUiOpen}
        isConfigUiOpen={isConfigUiOpen}
        onBack={onBack}
        manager={manager}
        onLogout={onLogout}
        selectedProject={selectedProject}

      />
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="absolute inset-0"
        />
        <TwoDToolsPanel manager={manager} />
      </div>
    </div>
  );
}
