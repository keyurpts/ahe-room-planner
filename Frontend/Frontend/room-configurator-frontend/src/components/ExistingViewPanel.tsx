import { ConfiguratorEventType, Events } from "three-configurator";
import { useState, useEffect } from "react";
import LeftPanel from "./LeftPanel";
import MainContainer from "./MainContainer";
import RightPanel from "./RightPanel";
import ModelPanel from "./ModelPanel";

interface ExistingViewPanelProps {
    isRoomPresent: boolean;
    visible: boolean;
    container3DRef: React.MutableRefObject<HTMLDivElement | null>;
    onViewModeChange?: (mode: "2D" | "3D") => void;
    isLeftPanelOpen: boolean;
    setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConfigUiOpen: boolean;
    setIsConfigUiOpen: React.Dispatch<React.SetStateAction<boolean>>;
    configuratorInstance: any;
    isExistingLayout: boolean;
    floorPlanManager?: any;
    onBack?: () => void;
    isModelPanelOpen: boolean;
    setIsModelPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isRightSidebarOpen: boolean;
    setIsRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onLogout?: () => void;
    selectedProject: any;
}

export default function ExistingViewPanel({
    isRoomPresent,
    visible,
    container3DRef,
    onViewModeChange,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    isConfigUiOpen,
    setIsConfigUiOpen,
    configuratorInstance,
    isExistingLayout,
    floorPlanManager,
    onBack,
    isModelPanelOpen,
    setIsModelPanelOpen,
    isRightSidebarOpen,
    setIsRightSidebarOpen,
    onLogout,
    selectedProject
}: ExistingViewPanelProps) {
    const [roomConfig, setRoomConfig] = useState<any>(null);
    const [replacementOptions, setReplacementOptions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [rotation, setRotation] = useState(0);
    const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
    const [hoveredMetadata, setHoveredMetadata] = useState<any>(null);
    const [isNewModelLoading, setIsNewModelLoading] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [showFavorites, setShowFavorites] = useState(false);


    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/Json/roomConfig.json");
                const data = await res.json();
                setRoomConfig(data);
                console.log("data in roon config:", data);
            } catch (err) {
                console.error("Failed to fetch room config:", err);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (!visible) {
            setShowFavorites(false);
            setFavorites(new Set());
        }
    }, [visible]);

    useEffect(() => {
        if (!configuratorInstance) return;

        const handleModelSelected = (metadata: any) => {
            console.log("User clicked model:", metadata);

            // store metadata in state (null when deselected)
            setSelectedMetadata(metadata);

            if (!metadata) {
                setReplacementOptions([]);
            }

            if (!configuratorInstance?.isModelSelected()) {
                setReplacementOptions([]);
                setRotation(0);
                return;
            }

            if (configuratorInstance?.isModelSelected()) {
                const rotation = configuratorInstance.getModelRotation();
                if (rotation) {
                    setRotation(rotation.y);
                } else {
                    setRotation(0);
                }
            }
            // update replacement options dynamically
            if (metadata) {
                const category = roomConfig.configModels.find((cat: any) =>
                    cat.items.find((item: any) => item.id === metadata.id)
                );

                const options = category ? category.items : [];
                setReplacementOptions(options);
            }
            configuratorInstance.setTransformSize(0.7);
        };

        Events.on(ConfiguratorEventType.MODEL_SELECTED, handleModelSelected);

        return () => {
            Events.off(ConfiguratorEventType.MODEL_SELECTED, handleModelSelected);
        };
    }, [configuratorInstance, roomConfig]);

    useEffect(() => {
        if (!configuratorInstance) return;

        const handleModelHovered = (metadata: any) => {
            setHoveredMetadata(metadata);
        };

        Events.on(ConfiguratorEventType.MODEL_HOVERED, handleModelHovered);

        return () => {
            Events.off(ConfiguratorEventType.MODEL_HOVERED, handleModelHovered);
        };
    }, [configuratorInstance]);

    const toggleSidebar = () => {
        setIsLeftPanelOpen(!isLeftPanelOpen);
    };


    return (
        <div
            className="flex h-screen bg-background absolute inset-0"
            style={{ visibility: visible ? "visible" : "hidden", flexDirection: "row", display: "flex" }}
        >
            {/* Left Sidebar */}
            {isLeftPanelOpen && (
                <LeftPanel
                    isSidebarOpen={isLeftPanelOpen}
                    configuratorInstance={configuratorInstance}
                    roomConfig={roomConfig}
                    setIsNewModelLoading={setIsNewModelLoading}
                    favorites={favorites}
                    setFavorites={setFavorites}
                    showFavorites={showFavorites}
                    setShowFavorites={setShowFavorites}
                />
            )}

            {/* Main Content */}
            <MainContainer
                isRoomPresent={isRoomPresent}
                toggleSidebar={toggleSidebar}
                isSidebarOpen={isLeftPanelOpen}
                isModelPanelOpen={isModelPanelOpen}
                isRightSidebarOpen={isRightSidebarOpen}
                setIsRightSidebarOpen={setIsRightSidebarOpen}
                configuratorInstance={configuratorInstance}
                roomConfig={roomConfig}
                setReplacementOptions={setReplacementOptions}
                setSearchTerm={setSearchTerm}
                setIsModelPanelOpen={setIsModelPanelOpen}
                rotation={rotation}
                setRotation={setRotation}
                container3DRef={container3DRef}
                isExistingLayout={isExistingLayout}
                onViewModeChange={onViewModeChange}
                setIsLeftPanelOpen={setIsLeftPanelOpen}
                setIsConfigUiOpen={setIsConfigUiOpen}
                isConfigUiOpen={isConfigUiOpen}
                floorPlanManager={floorPlanManager}
                onBack={onBack}
                isNewModelLoading={isNewModelLoading}
                setIsNewModelLoading={setIsNewModelLoading}
                is3DTabActive={visible}
                onLogout={onLogout}
                selectedProject={selectedProject}
            />

            {/*Right Sidebar*/}
            {isRightSidebarOpen && (
                <RightPanel
                    configuratorInstance={configuratorInstance}
                    replacementOptions={replacementOptions}
                    setIsRightSidebarOpen={setIsRightSidebarOpen}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            )}

            <ModelPanel
                isModelPanelOpen={isModelPanelOpen}
                metadata={selectedMetadata}
                hoveredMetadata={hoveredMetadata}
                configuratorInstance={configuratorInstance}
            ></ModelPanel>
        </div>
    );
}
