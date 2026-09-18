import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import FurnitureGrid from "./FurnitureGrid";
import FurnitureList from "./FurnitureList";
import { ConfiguratorCore } from "three-configurator";
import { useState } from "react";
import { useTheme } from "../ThemeContext";

type LeftPanelProps = {
  isSidebarOpen: boolean;
  configuratorInstance: ConfiguratorCore | undefined;
  roomConfig: any;
  setIsNewModelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  favorites: Set<string>;
  setFavorites: React.Dispatch<React.SetStateAction<Set<string>>>;
  showFavorites: boolean;
  setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>;
};

const LeftPanel = ({
  isSidebarOpen,
  configuratorInstance,
  roomConfig,
  setIsNewModelLoading,
  favorites,
  setFavorites,
  showFavorites,
  setShowFavorites
}: LeftPanelProps) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedTab, setSelectedTab] = useState("options");
  const [furnitureItemsFinal, setFurnitureItemsFinal] = useState<any[]>([]);
  const [searchFurniture, setSearchFurniture] = useState("");
  const { theme } = useTheme();

  const furnitureOptions =
    searchFurniture.trim() === ""
      ? furnitureItemsFinal
      : furnitureItemsFinal.filter((item: any) =>
        item.name.toLowerCase().includes(searchFurniture.toLowerCase())
      );


  return (
    <div
      className="transition-[width] duration-300 ease-in-out overflow-hidden border-r border-divider flex flex-col"
      style={{
        width: `${isSidebarOpen ? "18%" : "0%"}`,
        height: "100%",
      }}
    >
      {isSidebarOpen && (
        <div className="p-4 flex flex-col h-full">
          {selectedTab === "options" && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search furniture..."
                startContent={
                  <Icon icon={Icons.searchIcon} className="text-default-400" />
                }
                classNames={{
                  inputWrapper: "bg-zinc-200",
                }}
                className="flex-1"
                value={searchFurniture}
                onChange={(e) => setSearchFurniture(e.target.value)}
              />
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border transition-colors ${
                  showFavorites 
                    ? (theme === "dark" ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-red-50 text-red-500 border-red-200") 
                    : (theme === "dark" ? "bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800" : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100")
                }`}
                title={showFavorites ? "Favorites Only" : "Show All"}
              >
                <Icon icon={showFavorites ? Icons.heart_filled : Icons.heart_outline} className="w-5 h-5" />
              </button>
            </div>
          )}
          {selectedTab === "options" && !showFavorites && (
            <FurnitureList
              setSelectedItem={setSelectedItem}
              roomConfig={roomConfig}
            />
          )}
          <FurnitureGrid
            selectedItem={selectedItem}
            configuratorInstance={configuratorInstance}
            roomConfig={roomConfig}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            furnitureItemsFinal={furnitureOptions}
            setFurnitureItemsFinal={setFurnitureItemsFinal}
            searchFurniture={searchFurniture}
            setIsNewModelLoading={setIsNewModelLoading}
            showFavorites={showFavorites}
            favorites={favorites}
            setFavorites={setFavorites}
          />
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
