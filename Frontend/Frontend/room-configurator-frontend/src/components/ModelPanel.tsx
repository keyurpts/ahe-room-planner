import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { ConfiguratorCore, ConfiguratorEventType, Events  } from "three-configurator";

type HierarchyNode = {
  name: string;
  id: string;
  children: HierarchyNode[];
};

type ModelPanelProps = {
  isModelPanelOpen: boolean;
  metadata: any;
  hoveredMetadata: any;
  configuratorInstance: ConfiguratorCore | undefined;
};

const ModelPanel = ({
  isModelPanelOpen,
  metadata,
  hoveredMetadata,
  configuratorInstance,
}: ModelPanelProps) => {
  const { theme } = useTheme();

  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!configuratorInstance) return;

    const updateHierarchy = () => {
      const list = configuratorInstance.getSelectableObjectHierarchy();

      console.log("hierarchy updated:", list);

      setHierarchy(list);
    };

    // Load initial hierarchy
    updateHierarchy();

    Events.on(ConfiguratorEventType.HIERARCHY_CHANGED, updateHierarchy);

    return () => {
      Events.off(ConfiguratorEventType.HIERARCHY_CHANGED, updateHierarchy);
    };
  }, [configuratorInstance]);

  const toggleGroupCollapse = (
    groupId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderTreeItem = (
    obj: HierarchyNode,
    level: number = 0
  ): React.ReactNode => {
    /*
     * getSelectableObjectHierarchy() already returns the hierarchy structure.
     *
     * Example:
     *
     * {
     *   name: "Group 296",
     *   id: "group_1786712680509",
     *   children: [
     *     {
     *       name: "Coffee-table-2",
     *       id: "Coffee-table-2",
     *       children: []
     *     },
     *     {
     *       name: "chair-3",
     *       id: "chair-3",
     *       children: []
     *     }
     *   ]
     * }
     *
     * Therefore, an object is a group if it has children.
     */
    const isGroup = obj.children.length > 0;

    const objId = obj.id;
    const objName = obj.name || "Unnamed Object";

    const isSelected =
      metadata?.id === objId &&
      metadata?.name === objName;

    const isHovered =
      hoveredMetadata?.id === objId &&
      hoveredMetadata?.name === objName;

    const isCollapsed = collapsedGroups[objId] ?? false;

    return (
      <div
        key={objId}
        className="flex flex-col"
      >
        {/* Current item */}
        <div
          onClick={() =>
            configuratorInstance?.selectModelByIdAndName(
              objId,
              objName
            )
          }
          onMouseEnter={() =>
            configuratorInstance?.hoverModelByIdAndName(
              objId,
              objName
            )
          }
          onMouseLeave={() =>
            configuratorInstance?.clearHoverHighlight()
          }
          style={{
            cursor: "pointer",
            paddingLeft: `${level * 12 + 4}px`,
          }}
          className={`flex items-center gap-2 p-1.5 transition-colors text-sm rounded ${isSelected
            ? theme === "dark"
              ? "bg-amber-400/20 text-amber-400 font-bold"
              : "bg-blue-100 text-blue-600 font-bold"
            : isHovered
              ? theme === "dark"
                ? "bg-amber-400/10 text-amber-300"
                : "bg-blue-50 text-blue-500"
              : "hover:bg-default-100"
            }`}
        >
          {/* Expand / Collapse button */}
          {isGroup ? (
            <button
              onClick={(e) =>
                toggleGroupCollapse(objId, e)
              }
              className="p-0.5 hover:bg-default-200 rounded text-gray-500"
            >
              <Icon
                icon={
                  isCollapsed
                    ? "lucide:chevron-right"
                    : "lucide:chevron-down"
                }
                className="text-base"
              />
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Group / Model icon */}
          <Icon
            icon={
              isGroup
                ? "lucide:folder"
                : "lucide:box"
            }
            className={`text-lg shrink-0 ${isSelected
              ? theme === "dark"
                ? "text-amber-400"
                : "text-blue-600"
              : isGroup
                ? "text-amber-500"
                : "text-gray-500"
              }`}
          />

          {/* Name */}
          <span className="truncate flex-1">
            {objName}
          </span>
        </div>

        {/* Render group children */}
        {isGroup && !isCollapsed && (
          <div className="flex flex-col gap-1 mt-0.5">
            {obj.children.map((child) =>
              renderTreeItem(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="overflow-hidden border-r border-divider flex flex-col"
      style={{
        width: isModelPanelOpen ? "18%" : "0%",
        height: "100%",
      }}
    >
      <div className="flex flex-col flex-1 p-4 space-y-4 mt-14 min-h-0">

        {/* Model Tree Section */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:layers"
                className="text-xl"
              />

              <p className="text-md font-semibold">
                Room Contents
              </p>
            </div>

            {metadata?.canGroup && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                className="h-7 px-2 text-xs font-semibold"
                onClick={() =>
                  configuratorInstance?.createPermanentGroup()
                }
              >
                Group
              </Button>
            )}

            {metadata?.isGroup && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                className="h-7 px-2 text-xs font-semibold"
                onClick={() =>
                  configuratorInstance?.ungroupSelectedGroup()
                }
              >
                Ungroup
              </Button>
            )}
          </CardHeader>

          <Divider />

          <CardBody className="overflow-y-auto flex flex-col gap-1.5 p-2">
            {hierarchy.length === 0 ? (
              <p className="text-sm text-gray-500 p-2">
                No Asset found.
              </p>
            ) : (
              hierarchy.map((obj) =>
                renderTreeItem(obj, 0)
              )
            )}
          </CardBody>
        </Card>

        {/* Metadata Section */}
        <Card className="flex flex-col shrink-0">
          <CardHeader className="flex gap-3 shrink-0">
            <Icon
              icon="lucide:info"
              className="text-xl"
            />

            <div className="flex flex-col">
              <p className="text-md font-semibold">
                Properties
              </p>
            </div>
          </CardHeader>

          <Divider />

          {metadata ? (
            <CardBody className="overflow-hidden">
              <div className="flex flex-col gap-3">

                {/* Name */}
                <div>
                  <p className="text-xs text-default-500 uppercase font-semibold mb-1">
                    Name
                  </p>

                  <p className="text-sm">
                    {metadata.name}
                  </p>
                </div>

                <Divider />

                {/* ID */}
                <div>
                  <p className="text-xs text-default-500 uppercase font-semibold mb-1">
                    ID
                  </p>

                  <p className="text-sm">
                    {metadata.id}
                  </p>
                </div>

                <Divider />

                {/* Price */}
                <div>
                  <p className="text-xs text-default-500 uppercase font-semibold mb-1">
                    Price
                  </p>

                  <p className="text-sm">
                    {metadata.price}
                  </p>
                </div>

                <Divider />

                {/* Format */}
                <div>
                  <p className="text-xs text-default-500 uppercase font-semibold mb-1">
                    Format
                  </p>

                  <p className="text-sm">
                    {metadata.format}
                  </p>
                </div>

              </div>
            </CardBody>
          ) : (
            <p className="text-default-400 text-sm p-10">
              No Asset selected
            </p>
          )}
        </Card>

      </div>
    </div>
  );
};

export default ModelPanel;
