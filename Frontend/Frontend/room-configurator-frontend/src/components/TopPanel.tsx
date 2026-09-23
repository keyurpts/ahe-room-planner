import { addToast, Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import { useTheme } from "../ThemeContext";
import { ConfiguratorCore } from "three-configurator";
import { useState } from "react";
import { TOAST_MESSAGES } from "../toastMessages";
import { update2DJSONApi, update3DJSONApi } from "./Constants";

type TopPanelProps = {
  isRoomPresent: boolean
  isSidebarOpen: boolean;
  toggleSidebar?: () => void;
  configuratorInstance?: ConfiguratorCore;
  setRotation?: React.Dispatch<React.SetStateAction<number>>;
  roomConfig?: any;
  setReplacementOptions?: any;
  viewMode?: "2D" | "3D";
  onViewModeChange?: (mode: "2D" | "3D") => void;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfigUiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isConfigUiOpen?: boolean;
  onBack?: () => void;
  setIsRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModelPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTool?: React.Dispatch<React.SetStateAction<string | null>>;
  setAllMeasurementsActive?: React.Dispatch<React.SetStateAction<boolean>>;
  setSingleMeasurementActive?: React.Dispatch<React.SetStateAction<boolean>>;
  setWallsOnlyMeasurementActive?: React.Dispatch<React.SetStateAction<boolean>>;
  setObjectToObjectMeasurementActive?: React.Dispatch<React.SetStateAction<boolean>>;
  setWallHidingActive?: React.Dispatch<React.SetStateAction<boolean>>;
  showSlider?: React.Dispatch<React.SetStateAction<boolean>>;
  manager?: any;
  onLogout?: () => void;
  selectedProject: any
};

const TopPanel = ({
  isRoomPresent,
  isSidebarOpen,
  toggleSidebar,
  configuratorInstance,
  viewMode = "3D",
  onViewModeChange,
  setIsLeftPanelOpen,
  setIsConfigUiOpen,
  isConfigUiOpen,
  onBack,
  setActiveTool,
  setAllMeasurementsActive,
  setSingleMeasurementActive,
  setWallsOnlyMeasurementActive,
  setObjectToObjectMeasurementActive,
  setWallHidingActive,
  showSlider,
  setIsRightSidebarOpen,
  setIsModelPanelOpen,
  manager,
  onLogout,
  selectedProject
}: TopPanelProps) => {
  const { theme, colors, toggleTheme } = useTheme();
  const [isPostProcessingOn, setIsPostProcessingOn] = useState(false);
  const [isVrOn, setIsVrOn] = useState(false);

  const handleExport2D = async () => {
    if (!manager) return;
    try {
      const data = manager?.exportJson();
      console.log("2D JSON - ", data);

    }
    catch (error) {
      addToast({
        title: "Export Failed",
        description: "No 2D layout data to export.",
        timeout: 3000,
        color: "warning",
        shouldShowTimeoutProgress: true,
      });
    }
    finally {
      addToast({
        title: "Export Successful",
        description: "2D layout data exported successfully.",
        timeout: 3000,
        color: "success",
        shouldShowTimeoutProgress: true,
      });
    }
  };

  const handleImport2D = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !manager) return;

    try {

      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = async () => {
        const json = reader.result;

        console.log("input json : ", json);

        if (manager && json) {
          manager.importJson(json);
        }
      };

    } catch (error) {
      addToast({
        title: "Import Failed",
        description: "Invalid JSON file.",
        timeout: 3000,
        color: "danger",
        shouldShowTimeoutProgress: true,
      });
    }
    finally {
      addToast({
        title: "Import Successful",
        description: "2D layout data imported successfully.",
        timeout: 3000,
        color: "success",
        shouldShowTimeoutProgress: true,
      });
    }
    event.target.value = ""; // reset input
  };

  const updateProject2DJson = async (projectId: any, project2DJson: any) => {
    try {
      let accessToken = localStorage.getItem("access_token");
      console.log("project2DJson", project2DJson);

      if (accessToken === null) {
        accessToken = sessionStorage.getItem("access_token");
      }
      console.log("accesstoken - ", accessToken);

      const response = await fetch(
        // `http://localhost:5217/api/Projects/${projectId}/2d-json`,
        update2DJSONApi(projectId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project2DJson: project2DJson,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const result = await response.json();

      console.log("Project 2D JSON updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating project 2D JSON:", error);
      throw error;
    }
  };

  const updateProject3DJson = async (projectId: any, project3DJson: any) => {
    try {
      let accessToken = localStorage.getItem("access_token");
      console.log("project2DJson", project3DJson);

      if (accessToken === null) {
        accessToken = sessionStorage.getItem("access_token");
      }
      console.log("accesstoken - ", accessToken);

      const response = await fetch(
        // `http://localhost:5217/api/Projects/${projectId}/2d-json`,
        update3DJSONApi(projectId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project3DJson: project3DJson,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const result = await response.json();

      console.log("Project 2D JSON updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating project 2D JSON:", error);
      throw error;
    }
  };

  return (
    <div
      className={`flex justify-between items-center p-4 border-b shadow-md ${colors.topPanelBg} ${colors.topPanelBorder} ${colors.topPanelText}`}
      style={{ height: "8%", width: "100%" }}
    >
      <div className="flex items-center">
        {onBack && (
          <Tooltip content="Back to HomePage" showArrow closeDelay={0}>
            <Button
              isIconOnly
              variant="light"
              onPress={onBack}
              className={`mr-2 transition-colors duration-200 ${theme === "dark"
                ? "text-zinc-400 hover:text-amber-400 hover:bg-[#2b3036]"
                : "text-zinc-550 hover:bg-[#e9ecef]"
                }`}
            >
              <Icon icon={Icons.arrowLeft} className="w-5 h-5" />
            </Button>
          </Tooltip>
        )}
        {isConfigUiOpen && (
          <Tooltip content="Toogle Furniture Panel" showArrow closeDelay={0}>
            <Button
              isIconOnly
              variant="light"
              onPress={toggleSidebar}
              className={`mr-4 transition-colors duration-200 ${theme === "dark"
                ? "text-zinc-400 hover:text-amber-400 hover:bg-[#2b3036]"
                : "text-zinc-550 hover:bg-[#e9ecef]"
                }`}
            >
              <Icon
                icon={
                  isSidebarOpen
                    ? Icons.panelLeftClose
                    : Icons.panelLeftOpen
                }
                className="w-5 h-5"
              />
            </Button>
          </Tooltip>
        )}
        <h1 className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${theme === "dark"
          ? "bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent"
          : "text-zinc-900"
          }`}>
          Room Designer
        </h1>
      </div>

      <div className="flex space-x-2 items-center">
        {viewMode === "2D" ? (
          <>
            <div className={`flex space-x-1 p-1 border rounded-xl shadow-inner select-none ${colors.topPanelSelectorBg} ${colors.topPanelBorder}`}>
              <Button
                size="sm"
                onPress={() => {
                  onViewModeChange?.("2D");
                  setActiveTool?.(null);
                  setAllMeasurementsActive?.(false);
                  setSingleMeasurementActive?.(false);
                  setWallsOnlyMeasurementActive?.(false);
                  setObjectToObjectMeasurementActive?.(false);
                  setWallHidingActive?.(false);
                  showSlider?.(false);
                }}
                className={`font-sans font-semibold text-xs ${viewMode === "2D"
                  ? theme === "dark" ? "bg-amber-400 text-black font-bold shadow-sm" : "bg-zinc-900 text-white font-bold shadow-sm"
                  : `bg-transparent ${theme === "dark"
                    ? "text-zinc-400 hover:text-white hover:bg-[#2b3036]/80"
                    : "text-zinc-650 hover:text-zinc-900 hover:bg-[#e9ecef]"
                  }`
                  }`}
                startContent={<Icon icon={Icons.floorPlanIcon} className="w-4 h-4" />}
              >
                2D
              </Button>
              <Button
                size="sm"
                onPress={() => onViewModeChange?.("3D")}
                className={`font-sans font-semibold text-xs ${(viewMode as string) === "3D"
                  ? theme === "dark" ? "bg-amber-400 text-black font-bold shadow-sm" : "bg-zinc-900 text-white font-bold shadow-sm"
                  : `bg-transparent ${theme === "dark"
                    ? "text-zinc-400 hover:text-white hover:bg-[#2b3036]/80"
                    : "text-zinc-650 hover:text-zinc-900 hover:bg-[#e9ecef]"
                  }`
                  }`}
                startContent={<Icon icon={Icons.cubeOutline} className="w-4 h-4" />}
              >
                3D
              </Button>
            </div>

            <Button
              className={`font-sans font-bold shadow-md transition-all px-4 py-2 text-s rounded-xl border-none ${theme === "dark"
                ? "bg-[#2b3036] text-zinc-400 hover:text-white"
                : "bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300"
                }`}
              onPress={handleExport2D}
              startContent={<Icon icon={Icons.downloadIcon} className="w-4 h-4" />}
            >
              Export
            </Button>

            <input
              type="file"
              accept=".json"
              id="import-2d-layout"
              style={{ display: "none" }}
              onChange={handleImport2D}
            />
            <Button
              className={`font-sans font-bold shadow-md transition-all px-4 py-2 text-s rounded-xl border-none ${theme === "dark"
                ? "bg-[#2b3036] text-zinc-400 hover:text-white"
                : "bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300"
                }`}
              onPress={() => document.getElementById("import-2d-layout")?.click()}
              startContent={<Icon icon={Icons.uploadIcon} className="w-4 h-4" />}
            >
              Import
            </Button>
          </>
        ) : (
          <div className="flex space-x-2 items-center">
            {onViewModeChange && (
              <div className={`flex space-x-1 p-1 border rounded-xl shadow-inner select-none ${colors.topPanelSelectorBg} ${colors.topPanelBorder}`}>
                <Button
                  size="sm"
                  onPress={() => {
                    onViewModeChange("2D");
                    setActiveTool?.(null);
                    setAllMeasurementsActive?.(false);
                    setSingleMeasurementActive?.(false);
                    setWallsOnlyMeasurementActive?.(false);
                    setObjectToObjectMeasurementActive?.(false);
                    setWallHidingActive?.(false);
                    showSlider?.(false);
                  }}
                  className={`font-sans font-semibold text-xs bg-transparent ${theme === "dark"
                    ? "text-zinc-400 hover:text-white hover:bg-[#2b3036]/80"
                    : "text-zinc-650 hover:text-zinc-900 hover:bg-[#e9ecef]"
                    }`}
                  startContent={<Icon icon={Icons.floorPlanIcon} className="w-4 h-4" />}
                >
                  2D
                </Button>
                <Button
                  size="sm"
                  className={`font-sans font-semibold text-xs ${!isConfigUiOpen
                    ? theme === "dark" ? "bg-amber-400 text-black font-bold shadow-sm" : "bg-zinc-900 text-white font-bold shadow-sm"
                    : `bg-transparent ${theme === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-[#2b3036]/80"
                      : "text-zinc-650 hover:text-zinc-900 hover:bg-[#e9ecef]"
                    }`
                    }`}
                  startContent={<Icon icon={Icons.cubeOutline} className="w-4 h-4" />}
                  onPress={() => {
                    setIsLeftPanelOpen(false);
                    setIsConfigUiOpen(false);
                    setIsRightSidebarOpen(false);
                    setIsModelPanelOpen(false);
                  }}
                >
                  3D
                </Button>
                <Button
                  size="sm"
                  className={`font-sans font-semibold text-xs ${isConfigUiOpen
                    ? theme === "dark" ? "bg-amber-400 text-black font-bold shadow-sm" : "bg-zinc-900 text-white font-bold shadow-sm"
                    : `bg-transparent ${theme === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-[#2b3036]/80"
                      : "text-zinc-650 hover:text-zinc-900 hover:bg-[#e9ecef]"
                    }`
                    }`}
                  startContent={<Icon icon={Icons.settings2Icon} className="w-4 h-4" />}
                  onPress={() => {
                    // configuratorInstance!.exportToGLB();
                    if (isRoomPresent) {
                      setIsLeftPanelOpen(true);
                      setIsConfigUiOpen(true);
                    }
                    else {
                      console.log("room not present");
                      addToast({
                        title: TOAST_MESSAGES.ROOM_NOT_PRESENT.title,
                        description: TOAST_MESSAGES.ROOM_NOT_PRESENT.description,
                        timeout: 3000,
                        color: "warning",
                        shouldShowTimeoutProgress: true,
                      });
                    }
                  }}
                >
                  Configure
                </Button>
              </div>
            )}

            <Button
              className={`font-sans font-bold shadow-md transition-all px-4 py-2 text-s rounded-xl border-none ${isPostProcessingOn
                ? theme === "dark"
                  ? "bg-amber-400 text-black hover:bg-amber-500"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
                : theme === "dark"
                  ? "bg-[#2b3036] text-zinc-400 hover:text-white"
                  : "bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300"
                }`}
              onClick={() => {
                setIsPostProcessingOn(!isPostProcessingOn);
                configuratorInstance?.enablePostProcessing(!isPostProcessingOn);
              }}
            >
              Post Processing
            </Button>

            <Button
              className={`font-sans font-bold shadow-md transition-all px-4 py-2 text-s rounded-xl border-none ${isVrOn
                ? theme === "dark"
                  ? "bg-amber-400 text-black hover:bg-amber-500"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
                : theme === "dark"
                  ? "bg-[#2b3036] text-zinc-400 hover:text-white"
                  : "bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300"
                }`}
              onClick={() => {
                setIsVrOn(!isVrOn);
                configuratorInstance?.enableVR();
              }}
            >
              Enter VR
            </Button>


          </div>
        )}

        <Button
          className={`font-sans font-bold shadow-md transition-all px-4 py-2 text-s rounded-xl border-none ${isVrOn
            ? theme === "dark"
              ? "bg-amber-400 text-black hover:bg-amber-500"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
            : theme === "dark"
              ? "bg-[#2b3036] text-zinc-400 hover:text-white"
              : "bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300"
            }`}
          onClick={async () => {
            console.log("i am called");
            console.log(selectedProject);


            if (selectedProject) {
              console.log("i am called 2");

              const data = manager?.exportJson();
              await updateProject2DJson(selectedProject.id, data);
              const configData = await (configuratorInstance as any)?.export3DConfig();
              console.log("configData", configData);
              if (configData) {
                await updateProject3DJson(selectedProject.id, configData);
              }
              else {
                await updateProject3DJson(selectedProject.id, {});
              }
            }
          }}
        >
          Save
        </Button>

        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full border shadow-md transition-colors ${theme === "dark"
            ? "bg-[#0e1116]/80 border-white/10 text-amber-400 hover:bg-[#181d25] hover:border-amber-400/50"
            : "bg-white/80 border-black/10 text-zinc-800 hover:bg-zinc-100 hover:border-amber-500"
            }`}
          aria-label="Toggle Theme"
        >
          <Icon
            icon={theme === "dark" ? Icons.sunIcon : Icons.moonIcon}
            className="w-5 h-5"
          />
        </button>

        {onLogout && (
          <Tooltip content="Sign Out" placement="bottom">
            <button
              onClick={onLogout}
              className={`p-2 rounded-full border shadow-md transition-colors ${theme === "dark"
                ? "bg-[#0e1116]/80 border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                : "bg-white/80 border-black/10 text-red-500 hover:bg-red-50 hover:border-red-400"
                }`}
              aria-label="Sign Out"
            >
              <Icon icon={Icons.logOut} className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default TopPanel;
