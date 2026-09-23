import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardFooter, Image, Spinner, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import CustomViewPanel from "./CustomViewPanel";
import ConfirmationToast from "./ConfirmationToast";
import ExistingViewPanel from "./ExistingViewPanel";
import { useTheme } from "../ThemeContext";
import { FloorplanManager, ConfiguratorCore } from "three-configurator";
import { MY_PROJECTS_API } from "./Constants";
import { getAccessToken } from "../utils/auth";

interface ViewPanelProps {
  onLogout?: () => void;
}

export interface ProjectItem {
  id: string;
  name?: string;
  title?: string;
  projectName?: string;
  description?: string;
  thumbnail?: string;
  imageUrl?: string;
  image?: string;
  layoutData?: any;
  createdAt?: string;
  [key: string]: any;
}

export default function ViewPanel({ onLogout }: ViewPanelProps) {
  const { theme, toggleTheme, colors } = useTheme();
  const [currentView, setCurrentView] = useState<"custom" | "existing" | null>(
    null
  );
  const [isExistingViewPanelClick, setIsExistingViewPanelClick] = useState<number>(0);
  const container3DRef = useRef<HTMLDivElement | null>(null);
  const container2DRef = useRef<HTMLDivElement | null>(null);
  const [manager, setManager] = useState<FloorplanManager | null>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(false);
  const [isConfigUiOpen, setIsConfigUiOpen] = useState<boolean>(false);
  const [configuratorInstance, setConfiguratorInstance] = useState<ConfiguratorCore | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState<boolean>(false);
  const [isModelPanelOpen, setIsModelPanelOpen] = useState<boolean>(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  console.log("selectedProject from viewpanel : ", selectedProject);


  // Fetch projects assigned to the logged-in user
  const fetchUserProjects = async () => {
    setIsLoadingProjects(true);
    setProjectsError(null);
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        Accept: "application/json, text/plain, */*",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(MY_PROJECTS_API, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch projects (status: ${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data && Array.isArray(data.items)) {
        setProjects(data.items);
      } else if (data && Array.isArray(data.data)) {
        setProjects(data.data);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setProjectsError(err.message || "Failed to load projects");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchUserProjects();
  }, []);

  useEffect(() => {
    if (!container3DRef.current) return;

    if (isExistingViewPanelClick === 0) return;

    let createdInstance: any = null;

    if (isExistingViewPanelClick === 1) {
      const options = {
        container: container3DRef.current,
        backgroundColor: 0xf0f0f0,
        cameraType: "perspective",
        enableShadows: true,
      };

      createdInstance = new ConfiguratorCore(options);
      setConfiguratorInstance(createdInstance);
    }
    if (isExistingViewPanelClick === 2) {
      if (manager) {
        let instance = manager.getConfiguratorCore();

        const loadEnvMap = async (CI: ConfiguratorCore) => {
          if (CI) {
            await CI.loadEnvironmentMap(
              "/lebombo_4k.hdr",
              0.5
            );
          }
        }

        loadEnvMap(instance);

        setConfiguratorInstance(instance);
      }
    }

    return () => {
      if (createdInstance) {
        createdInstance.dispose();
      }
    };
  }, [currentView, isExistingViewPanelClick, manager]);

  useEffect(() => {
    if (!container2DRef.current || !container3DRef.current) return;

    // Clear any leftover canvases from previous mount
    container2DRef.current.innerHTML = "";

    const newManager = new FloorplanManager();
    newManager.init(container2DRef.current, container3DRef.current);
    setManager(newManager);

    // get core instance and load env map
    const instance = newManager.getConfiguratorCore();
    instance!.setBackgroundColor(0xffffff);

    let loadEnvMap = async () => {
      await instance.loadEnvironmentMap(
        "/lebombo_4k.hdr"
        , 0.5
      );
    }
    loadEnvMap();

    return () => {
      // Cleanup on unmount / re-mount
      newManager.dispose();
    };
  }, [currentView]);

  // Auto-import saved 2D design when a project with project2DJson is opened
  useEffect(() => {
    if (!manager || !selectedProject) return;

    const savedJson = selectedProject.project2DJson;

    // Check if project2DJson exists and is not null/empty
    if (!savedJson) return;

    // Handle both string and object forms
    let jsonString: string;
    if (typeof savedJson === "string") {
      // If it's a string, check it's not empty or "{}"
      const trimmed = savedJson.trim();
      if (!trimmed || trimmed === "{}" || trimmed === "[]") return;
      jsonString = trimmed;
    } else if (typeof savedJson === "object") {
      // If it's an object, check it's not empty
      if (Object.keys(savedJson).length === 0) return;
      jsonString = JSON.stringify(savedJson);
    } else {
      return;
    }

    // Small delay to ensure the canvas/stage is fully ready
    const timer = setTimeout(() => {
      try {
        console.log("Importing saved 2D design for project:", selectedProject.name || selectedProject.id);
        manager.importJson(jsonString);
      } catch (err) {
        console.warn("Failed to import project2DJson:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [manager, selectedProject]);

  const handleBack = async () => {
    //check is there any 2D data present there 
    const has2DData = await manager?.is2DDataPresent();
    if (has2DData) {
      setShowBackConfirmation(true);
    } else {
      handleBackConfirm();
    }
  };

  const handleBackConfirm = () => {
    setShowBackConfirmation(false);
    setCurrentView(null);
    setIsExistingViewPanelClick(0);
    setManager(null);
    setConfiguratorInstance(null);
    setSelectedProject(null);
  };

  const handleBackCancel = () => {
    setShowBackConfirmation(false);
  };

  const handleProjectSelect = (proj: ProjectItem) => {
    setSelectedProject(proj);
    setIsExistingViewPanelClick(2);
    setCurrentView("custom");
    setIsLeftPanelOpen(false);
    setIsConfigUiOpen(false);
  };

  if (currentView === "custom") {
    return (
      <>
        <ConfirmationToast
          isOpen={showBackConfirmation}
          title="Go Back?"
          message="Are you sure you want to go back? All current changes will be lost."
          onConfirm={handleBackConfirm}
          onCancel={handleBackCancel}
        />
        <CustomViewPanel
          container3DRef={container3DRef}
          isLeftPanelOpen={isLeftPanelOpen}
          setIsLeftPanelOpen={setIsLeftPanelOpen}
          isConfigUiOpen={isConfigUiOpen}
          setIsConfigUiOpen={setIsConfigUiOpen}
          container2DRef={container2DRef}
          manager={manager}
          configuratorInstance={configuratorInstance}
          isExistingLayout={false}
          onBack={handleBack}
          isModelPanelOpen={isModelPanelOpen}
          setIsModelPanelOpen={setIsModelPanelOpen}
          isRightSidebarOpen={isRightSidebarOpen}
          setIsRightSidebarOpen={setIsRightSidebarOpen}
          onLogout={onLogout}
          selectedProject={selectedProject}
        />
      </>
    );
  }


  if (currentView === "existing") {
    return (
      <>
        <ConfirmationToast
          isOpen={showBackConfirmation}
          title="Go Back?"
          message="Are you sure you want to go back? All unsaved changes will be lost."
          onConfirm={handleBackConfirm}
          onCancel={handleBackCancel}
        />
        <ExistingViewPanel
          isRoomPresent={true}
          visible={true}
          container3DRef={container3DRef}
          isLeftPanelOpen={isLeftPanelOpen}
          setIsLeftPanelOpen={setIsLeftPanelOpen}
          isConfigUiOpen={isConfigUiOpen}
          setIsConfigUiOpen={setIsConfigUiOpen}
          configuratorInstance={configuratorInstance}
          isExistingLayout={true}
          onBack={handleBack}
          isModelPanelOpen={isModelPanelOpen}
          setIsModelPanelOpen={setIsModelPanelOpen}
          isRightSidebarOpen={isRightSidebarOpen}
          setIsRightSidebarOpen={setIsRightSidebarOpen}
          onLogout={onLogout}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-6 select-none relative overflow-y-auto ${colors.viewBg}`}>
      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-full border transition-all duration-300 shadow-md ${theme === "dark"
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
          <button
            onClick={onLogout}
            className={`p-2.5 rounded-full border transition-all duration-300 shadow-md ${theme === "dark"
              ? "bg-[#0e1116]/80 border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
              : "bg-white/80 border-black/10 text-red-500 hover:bg-red-50 hover:border-red-400"
              }`}
            aria-label="Sign Out"
            title="Sign Out"
          >
            <Icon icon={Icons.logOut} className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Header Section */}
      <div className="mb-10 text-center max-w-xl animate-fade-in mt-6">
        <h1 className={`text-3xl font-bold mb-3 transition-colors duration-500 ${colors.viewText}`}>
          Start Your Configuration
        </h1>
        <p className={`text-sm leading-relaxed max-w-md mx-auto transition-colors duration-500 ${colors.viewTextMuted}`}>
          Choose how you want to begin. Select from your assigned projects or create a new layout from scratch.
        </p>
      </div>

      {/* Projects / Layouts Cards Section */}
      <div className="flex flex-wrap items-center justify-center gap-8 max-w-6xl animate-slide-up pb-10">


        {/* Loading Spinner */}
        {isLoadingProjects && (
          <div className="w-[300px] h-[400px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-500/30">
            <Spinner color="warning" size="lg" />
            <p className={`text-xs ${colors.viewTextMuted}`}>Loading assigned projects...</p>
          </div>
        )}

        {/* Dynamic Project Cards */}
        {!isLoadingProjects &&
          projects.map((project, index) => {

            console.log("Fetched Project - ", project);


            const projectName =
              project.name || project.title || project.projectName || `Project #${index + 1}`;
            const projectDesc =
              project.description ||
              (project.createdAt
                ? `Created on ${new Date(project.createdAt).toLocaleDateString()}`
                : "Design and explore this assigned floor plan project.");
            const projectImage =
              project.thumbnail || project.imageUrl || project.image || "./images/twod.jfif";

            return (
              <Card
                key={project.id || index}
                isPressable
                onPress={() => handleProjectSelect(project)}
                className={`w-[300px] h-[400px] shadow-2xl transition-all duration-300 hover:scale-[1.03] ${theme === "dark"
                  ? "hover:border-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                  : "hover:border-zinc-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.15)]"
                  } ${colors.viewCard}`}
              >
                <CardBody className="p-3 pb-0 overflow-visible relative h-2/3">
                  <Image
                    shadow="sm"
                    radius="lg"
                    width="100%"
                    alt={projectName}
                    className={`w-full h-[230px] object-cover border ${theme === "dark" ? "border-white/5" : "border-black/5"
                      }`}
                    src={projectImage}
                    fallbackSrc="./images/twod.jfif"
                  />
                </CardBody>

                <CardFooter className="flex flex-col items-center text-center h-1/3 px-5 py-4">
                  <h2
                    className={`text-xl font-bold mb-2 transition-colors line-clamp-1 ${colors.viewTextCardHeaderHover}`}
                  >
                    {projectName}
                  </h2>
                  <p
                    className={`text-sm leading-relaxed transition-colors line-clamp-2 ${colors.viewTextCardSub}`}
                  >
                    {projectDesc}
                  </p>
                </CardFooter>
              </Card>
            );
          })}

        {/* Error State with Retry Button */}
        {projectsError && (
          <div className="w-full flex flex-col items-center justify-center gap-2 mt-4 text-center">
            <p className="text-xs text-red-400">Failed to load projects: {projectsError}</p>
            <Button size="sm" variant="flat" color="warning" onPress={fetchUserProjects}>
              Retry Loading Projects
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

