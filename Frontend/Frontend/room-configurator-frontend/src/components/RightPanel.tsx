import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import { ConfiguratorCore } from "three-configurator";
import ReplacePanel from "./ReplacePanel";

type RightPanelProps = {
  configuratorInstance: ConfiguratorCore | undefined;
  replacementOptions: any;
  setIsRightSidebarOpen: any;
  searchTerm: string;
  setSearchTerm: any;
};

const RightPanel = ({
  configuratorInstance,
  replacementOptions,
  setIsRightSidebarOpen,
  searchTerm,
  setSearchTerm,
}: RightPanelProps) => {
  const filteredOptions =
    searchTerm.trim() === ""
      ? replacementOptions
      : replacementOptions.filter((item: any) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
  return (
    <div
      className="border-l border-divider flex flex-col"
      style={{ width: "18%", height: "100%" }}
    >
        <div className="p-4 flex flex-col h-full">
          <Input
            placeholder="Search furniture..."
            startContent={
              <Icon icon={Icons.searchIcon} className="text-default-400" />
            }
            className="mb-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ReplacePanel
            configuratorInstance={configuratorInstance}
            replacementOptions={filteredOptions}
            setIsRightSidebarOpen={setIsRightSidebarOpen}
            searchTerm={searchTerm}
          />
        </div>
    </div>
  );
};

export default RightPanel;
