import { ConfiguratorEventType, Events } from "three-configurator";
import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { Icon } from "@iconify/react";
import Icons from "../icons";

type TakeoffData = {
  models: { id: string; name: string; unitPrice: number; quantity: number }[];
  grandTotal: number;
};

const PriceSummaryPanel = ({
  configuratorInstance,
  isModelPanelOpen,
  isRightSidebarOpen
}: {
  configuratorInstance: any;
  isModelPanelOpen?: boolean;
  isRightSidebarOpen?: boolean;
}) => {
  const { theme } = useTheme();
  const [takeoffData, setTakeoffData] = useState<TakeoffData>({ models: [], grandTotal: 0 });

  useEffect(() => {
    if (!configuratorInstance) return;

    const handleSummaryUpdate = (summaryData: TakeoffData) => {
      setTakeoffData(summaryData);
    };

    // Listen directly for the new event payload
    Events.on(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, handleSummaryUpdate);

    // Initial fetch
    setTakeoffData(configuratorInstance.getModelsSummary());

    return () => {
      Events.off(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, handleSummaryUpdate);
    };
  }, [configuratorInstance]);



  return (
    <div
      className={`absolute bottom-0 z-50 shadow-2xl overflow-hidden border backdrop-blur-xl pointer-events-auto ${theme === "dark"
          ? "bg-zinc-950/85 border-zinc-800 shadow-black/50"
          : "bg-white/85 border-zinc-200 shadow-zinc-300/50"
        }`}
      style={{
        right: isModelPanelOpen || isRightSidebarOpen ? "17.9%" : "0%",
        width: "15%",
        maxHeight: "40%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${theme === "dark" ? "border-zinc-800/80 bg-zinc-900/30" : "border-zinc-200/80 bg-zinc-50/50"
        }`}>
        <div className="flex items-center gap-2">
          <Icon icon={Icons.layersIcon} className="w-5 h-5 text-amber-500" />
          <h3 className={`font-bold text-sm tracking-wide ${theme === "dark" ? "text-zinc-100" : "text-zinc-800"}`}>Price Summary</h3>
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${theme === "dark" ? "bg-zinc-800/80 text-zinc-300" : "bg-zinc-200/80 text-zinc-600"
          }`}>
          {takeoffData.models.reduce((total, item) => total + item.quantity, 0)} items
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
        {takeoffData.models.map((item, index) => (
          <div key={`${item.id}-${index}`} className={`flex flex-col gap-1 pb-3 border-b last:border-b-0 ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200/60"
            }`}>
            <div className="flex justify-between items-start mt-1">
              <span className={`font-semibold text-sm truncate pr-2 ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>{item.name}</span>
              <span className={`font-bold text-sm ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
            <div className={`flex justify-between text-xs font-medium ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              <span>Qty: {item.quantity}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`px-4 py-4 mt-auto border-t ${theme === "dark" ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-zinc-100/50"
        }`}>
        <div className="flex justify-between items-center">
          <span className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Grand Total</span>
          <span className="text-xl font-black text-amber-500">
            ${takeoffData.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceSummaryPanel;
