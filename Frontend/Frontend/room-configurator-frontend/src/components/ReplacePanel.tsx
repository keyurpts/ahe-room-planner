import { addToast, Card, CardBody, CardFooter, closeAll } from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import { ConfiguratorCore } from "three-configurator";

type ReplacePanelProps = {
  configuratorInstance: ConfiguratorCore | undefined;
  replacementOptions: any;
  setIsRightSidebarOpen: any;
  searchTerm: string;
};

const ReplacePanel = ({
  configuratorInstance,
  replacementOptions,
  // setIsRightSidebarOpen,
  searchTerm,
}: ReplacePanelProps) => {
  // const { theme } = useTheme();
  if (!replacementOptions) {
    console.log("no replacement options");
    return;
  }

  const handleReplace = async (item: any) => {

    const selectedModelCategory = configuratorInstance.getModelMetadata()?.category || "Asset";

    const modelData = {
      name: item.name,
      id: item.id,
      price: item.price,
      format: item.format,
    };

    console.log("replace item is:", item);
    closeAll();
    let isReplace = await configuratorInstance.replaceModel(
      item.uri,
      modelData
    );
    if (!isReplace) {
      addToast({
        title: "Error",
        description: `Failed to replace ${selectedModelCategory.toLowerCase()}`,
        timeout: 3000,
        color: "warning",
        shouldShowTimeoutProgress: true,
      });
    }
  };
  // const closePanel = () => {
  //   setIsRightSidebarOpen(false);
  // };
  return (
    <div className="flex w-full flex-col h-full">
      <Card className="h-full">
        <CardBody style={{ height: "100%", overflowY: "auto" }}>
          <div style={{ height: "100%", width: "100%" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "5px",
              }}
            >
              {replacementOptions.length > 0 ? (
                replacementOptions.map((item: any, index: any) => (
                  <Card
                    key={index}
                    isPressable
                    className="w-full"
                    onClick={() => handleReplace(item)}
                  >
                    <CardBody className="p-0">
                      <img
                        src={item.previewImage}
                        alt={item.name}
                        className="w-full h-32 object-contain bg-white scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </CardBody>
                    <CardFooter className="flex-col items-start p-2">
                      <h3 className="text-sm font-semibold">{item.name}</h3>
                    </CardFooter>
                    <div className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1">
                      <Icon icon={Icons.heart_outline} className="w-4 h-4" />
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500 mt-4">
                  {searchTerm ? "Item not found" : "No items available. Please select an Asset."}
                </p>
              )}
            </div>
            {/* <button
              className={`absolute bottom-4 right-4 w-16 h-8 rounded p-1 ${
                theme === "dark" ? "bg-amber-400 hover:bg-amber-500 text-black font-bold" : "bg-gray-200 text-black"
              }`}
              onClick={closePanel}
            >
              Done
            </button> */}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ReplacePanel;
