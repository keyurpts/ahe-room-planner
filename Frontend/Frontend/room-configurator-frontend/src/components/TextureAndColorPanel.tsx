import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import { Tooltip } from "@heroui/react";
import { useTheme } from "../ThemeContext";
import { ConfiguratorCore } from "three-configurator";
import {
  TexturePreset,
  ColorPreset,
  floorPresets,
  wallPresets,
  colorPresets,
} from "../constant";

type TexturePanelProps = {
  open: boolean;
  onClose: () => void;
  configuratorInstance?: ConfiguratorCore;
};
type SwatchProps = {
  preset: TexturePreset;
  selected: boolean;
  onClick: () => void;
  theme: "dark" | "light";
};

function TextureSwatch({ preset, selected, onClick, theme }: SwatchProps) {
  return (
    <Tooltip content={preset.name} closeDelay={0} showArrow>
      <button
        onClick={onClick}
        className={`group relative w-full aspect-square rounded-xl border-2 overflow-hidden transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 ${selected
          ? theme === "dark"
            ? "border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.4)]"
            : "border-zinc-900 shadow-lg"
          : theme === "dark"
            ? "border-zinc-800 hover:border-amber-400/70 hover:shadow-[0_0_14px_rgba(251,191,36,0.2)]"
            : "border-zinc-200 hover:border-zinc-400 hover:shadow-md"
          }`}
        aria-label={preset.name}
      >
        <img
          src={preset.thumbnail}
          alt={preset.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${selected
          ? "opacity-0"
          : theme === "dark"
            ? "bg-gradient-to-t from-black/40 to-transparent opacity-100 group-hover:opacity-0"
            : "bg-gradient-to-t from-black/15 to-transparent opacity-100 group-hover:opacity-0"
          }`} />
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
            <Icon icon={Icons.checkIcon} width={10} height={10} className="text-black" />
          </div>
        )}
      </button>
    </Tooltip>
  );
}

type ColorSwatchProps = {
  preset: ColorPreset;
  selected: boolean;
  onClick: () => void;
  theme: "dark" | "light";
};

function ColorSwatchTile({ preset, selected, onClick, theme }: ColorSwatchProps) {
  return (
    <Tooltip content={preset.name} closeDelay={0} showArrow>
      <button
        onClick={onClick}
        className={`group relative w-full aspect-square rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 ${selected
          ? theme === "dark"
            ? "border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.4)]"
            : "border-zinc-900 shadow-lg"
          : theme === "dark"
            ? "border-zinc-800 hover:border-amber-400/70 hover:shadow-[0_0_14px_rgba(251,191,36,0.2)]"
            : "border-zinc-200 hover:border-zinc-400 hover:shadow-md"
          }`}
        style={{ backgroundColor: preset.color }}
        aria-label={preset.name}
      >
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] pointer-events-none" />
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
            <Icon icon={Icons.checkIcon} width={10} height={10} className="text-black" />
          </div>
        )}
      </button>
    </Tooltip>
  );
}

// EraserSwatch component for resetting materials
function EraserSwatch({ selected, onClick, theme, label = "Reset" }: { selected: boolean, onClick: () => void, theme: "dark" | "light", label?: string }) {
  return (
    <Tooltip content={label} closeDelay={0} showArrow>
      <button
        onClick={onClick}
        className={`group relative w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${selected
          ? theme === "dark"
            ? "border-amber-400 bg-amber-400/10 shadow-[0_0_18px_rgba(251,191,36,0.4)]"
            : "border-zinc-900 bg-zinc-900/5 shadow-lg"
          : theme === "dark"
            ? "border-zinc-600 hover:border-amber-400/70 hover:bg-zinc-800"
            : "border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50"
          }`}
        aria-label={label}
      >
        <Icon icon={Icons.eraserIcon} width={18} height={18} className={theme === "dark" ? (selected ? "text-amber-400" : "text-zinc-500 group-hover:text-amber-400") : (selected ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-900")} />
        <span className={`text-[8px] font-semibold tracking-wider uppercase ${theme === "dark" ? (selected ? "text-amber-400" : "text-zinc-500 group-hover:text-amber-400") : (selected ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-900")}`}>{label}</span>
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
            <Icon icon={Icons.checkIcon} width={10} height={10} className="text-black" />
          </div>
        )}
      </button>
    </Tooltip>
  );
}

type Tab = "texture" | "color";

export default function TextureAndColorPanel({ open, onClose, configuratorInstance }: TexturePanelProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("texture");

  // Floor handles instantly, no staged logic
  const [activeFloorTex, setActiveFloorTex] = useState<string | null>(null);
  const [activeFloorColor, setActiveFloorColor] = useState<string | null>(null);

  // Global mode: 'all' (instantly fills room) or 'single' (arms cursor to click specific walls)
  const [wallPaintMode, setWallPaintMode] = useState<'all' | 'single'>('all');

  // Track what's currently active (mostly for UI highlight and single-paint arming)
  type ActiveSelection = { type: 'texture' | 'color' | 'eraser', id: string, data?: any } | null;
  const [activeWallSelection, setActiveWallSelection] = useState<ActiveSelection>(null);

  // Synchronize the 3D scene mode based on wallPaintMode
  useEffect(() => {
    if (!open || wallPaintMode === 'all' || !activeWallSelection) {
      configuratorInstance?.enableWallColoringMode?.(false);
      configuratorInstance?.enableWallTextureMode?.(false);
      configuratorInstance?.enableWallMaterialResetMode?.(false);
    } else if (wallPaintMode === 'single' && activeWallSelection) {
      if (activeWallSelection.type === 'eraser') {
        configuratorInstance?.enableWallColoringMode?.(false);
        configuratorInstance?.enableWallTextureMode?.(false);
        configuratorInstance?.enableWallMaterialResetMode?.(true);
      } else if (activeWallSelection.type === 'color') {
        console.log("activeWallSelection : ", activeWallSelection);


        // configuratorInstance?.setWallColor?.(activeWallSelection.data.color);
        configuratorInstance?.setWallColor?.(activeWallSelection.data);
        configuratorInstance?.enableWallColoringMode?.(true);
        configuratorInstance?.enableWallTextureMode?.(false);
        configuratorInstance?.enableWallMaterialResetMode?.(false);
      } else if (activeWallSelection.type === 'texture') {
        console.log("activeWallSelection", activeWallSelection);

        configuratorInstance?.setWallTexture?.(activeWallSelection.data);
        configuratorInstance?.enableWallTextureMode?.(true);
        configuratorInstance?.enableWallColoringMode?.(false);
        configuratorInstance?.enableWallMaterialResetMode?.(false);
      }
    }
    return () => {
      configuratorInstance?.enableWallColoringMode?.(false);
      configuratorInstance?.enableWallTextureMode?.(false);
      configuratorInstance?.enableWallMaterialResetMode?.(false);
    };
  }, [open, wallPaintMode, activeWallSelection, configuratorInstance]);

  // Wall Action Handlers
  const handleWallSwatchClick = (selection: ActiveSelection) => {
    if (wallPaintMode === 'all') {
      // Instant apply
      if (selection?.type === 'eraser') {
        configuratorInstance?.resetWalls?.();
        setActiveWallSelection(null); // Do not highlight eraser when applying to all
      } else if (selection?.type === 'color') {
        configuratorInstance?.applyColorToAllWalls?.(selection.data.color);
        setActiveWallSelection(selection); // Highlight the selected color
      } else if (selection?.type === 'texture') {
        configuratorInstance?.applyTextureToAllWalls?.(selection.data);
        setActiveWallSelection(selection); // Highlight the selected texture
      }
    } else {
      // Arm single paint mode
      setActiveWallSelection(selection);
    }
  };

  // Floor Action Handlers
  const applyFloorTexture = (preset: TexturePreset) => {
    setActiveFloorTex(preset.id);
    setActiveFloorColor(null);
    console.log("preset : ", preset);

    configuratorInstance?.applyTextureToAllFloors?.(preset);
  };

  const applyFloorColor = (preset: ColorPreset) => {
    setActiveFloorColor(preset.id);
    setActiveFloorTex(null);
    console.log("preset : ", preset);

    configuratorInstance?.applyColorToAllFloors?.(preset.color, preset.id);
  };

  const resetFloor = () => {
    setActiveFloorTex(null);
    setActiveFloorColor(null);
    configuratorInstance?.resetFloor?.();
  };

  if (!open) return null;

  // Reusable UI for Segmented Control
  const renderWallModeToggle = () => (
    <div className={`flex gap-1 p-1 mx-0 mb-3 rounded-xl ${theme === "dark" ? "bg-zinc-900/60 border border-zinc-800" : "bg-zinc-100 border border-zinc-200"}`}>
      <button
        onClick={() => {
          setWallPaintMode('all');
          setActiveWallSelection(null); // Clear selection when switching modes
        }}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${wallPaintMode === 'all'
          ? theme === "dark"
            ? "bg-amber-400 text-black shadow-md"
            : "bg-zinc-900 text-white shadow-md"
          : theme === "dark"
            ? "text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-white"
          }`}
      >
        <Icon icon={Icons.squares2x2Solid} width={14} height={14} />
        Apply to All
      </button>
      <button
        onClick={() => setWallPaintMode('single')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${wallPaintMode === 'single'
          ? theme === "dark"
            ? "bg-amber-400 text-black shadow-md"
            : "bg-zinc-900 text-white shadow-md"
          : theme === "dark"
            ? "text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-white"
          }`}
      >
        <Icon icon={Icons.mousePointerClick} width={14} height={14} />
        Apply to Selection
      </button>
    </div>
  );

  return (
    <div
      className={`absolute right-10 top-1/2 -translate-y-1/2 w-96 z-30 rounded-2xl border shadow-2xl flex flex-col select-none animate-slide-in-right overflow-hidden ${theme === "dark"
        ? "bg-zinc-950/95 backdrop-blur-xl border-zinc-800/80 text-zinc-200"
        : "bg-white/95 backdrop-blur-xl border-zinc-200/90 text-zinc-800"
        }`}
      style={{ maxHeight: "88%" }}
    >
      {/* Decorative gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-px ${theme === "dark"
        ? "bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
        : "bg-gradient-to-r from-transparent via-zinc-400 to-transparent"
        }`} />

      {/* Header */}
      <div className={`relative flex justify-between items-center px-4 py-3 border-b ${theme === "dark"
        ? "border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-transparent"
        : "border-zinc-200/90 bg-gradient-to-b from-zinc-50 to-transparent"
        }`}>
        <div className="flex items-center gap-2.5">
          <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${theme === "dark"
            ? "bg-gradient-to-br from-amber-300 to-amber-500 text-black"
            : "bg-gradient-to-br from-zinc-800 to-zinc-950 text-white"
            }`}>
            <Icon icon={Icons.textureIcon} width={16} height={16} />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${theme === "dark"
              ? "bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent"
              : "text-zinc-900"
              }`}>
              Finishes
            </h3>
            <p className={`text-[10px] tracking-wide ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>
              Floor &amp; wall styling
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-full transition-all duration-200 hover:rotate-90 ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
            }`}
          title="Close panel"
          aria-label="Close textures panel"
        >
          <Icon icon={Icons.xIcon} width={15} height={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className={`px-3 pt-3 pb-2 border-b ${theme === "dark" ? "border-zinc-800/80" : "border-zinc-200/90"}`}>
        <div className={`flex gap-1 p-1 rounded-xl ${theme === "dark" ? "bg-zinc-900/60 border border-zinc-800" : "bg-zinc-100 border border-zinc-200"}`}>
          <TabButton
            label="Texture"
            icon={Icons.textureIcon}
            active={activeTab === "texture"}
            onClick={() => setActiveTab("texture")}
            theme={theme}
          />
          <TabButton
            label="Color"
            icon={Icons.paletteOutline}
            active={activeTab === "color"}
            onClick={() => setActiveTab("color")}
            theme={theme}
          />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 overflow-hidden">
        {activeTab === "texture" ? (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Floor textures */}
            <div className="flex flex-col min-h-0">
              <SectionHeader label="Floor" theme={theme} />
              <div className="grid grid-cols-6 gap-2 overflow-y-auto pb-2 max-h-[172px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <EraserSwatch
                  selected={activeFloorTex === 'eraser'}
                  onClick={resetFloor}
                  theme={theme}
                />
                {floorPresets.map((preset) => (
                  <TextureSwatch
                    key={preset.id}
                    preset={preset}
                    selected={activeFloorTex === preset.id}
                    onClick={() => applyFloorTexture(preset)}
                    theme={theme}
                  />
                ))}
              </div>
            </div>

            {/* Wall textures */}
            <div className="flex flex-col min-h-0">
              <SectionHeader label="Walls" theme={theme} />

              {renderWallModeToggle()}

              {wallPaintMode === 'single' && (
                <div className={`flex items-start gap-2 p-2 mb-3 rounded-lg border text-[10px] leading-relaxed shadow-sm shrink-0 animate-fade-in ${theme === "dark"
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-100"
                  : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}>
                  <Icon icon={Icons.infoIcon} className="shrink-0 mt-0.5" width={12} height={12} />
                  <span>
                    {activeWallSelection?.type === 'eraser'
                      ? "Click any wall in the 3D view to reset it to default."
                      : activeWallSelection
                        ? "Click any wall in the 3D view to apply the selected material."
                        : "Select a material below, then click any wall in the 3D view to paint it."}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-6 gap-2 overflow-y-auto pb-2 max-h-[172px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <EraserSwatch
                  selected={activeWallSelection?.type === 'eraser'}
                  onClick={() => handleWallSwatchClick({ type: 'eraser', id: 'eraser' })}
                  theme={theme}
                />
                {wallPresets.map((preset) => (
                  <TextureSwatch
                    key={preset.id}
                    preset={preset}
                    selected={activeWallSelection?.type === 'texture' && activeWallSelection.data.id === preset.id}
                    onClick={() => handleWallSwatchClick({ type: 'texture', id: preset.id, data: preset })}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Floor colors */}
            <div className="flex flex-col min-h-0">
              <SectionHeader label="Floor" theme={theme} />
              <div className="grid grid-cols-6 gap-2 overflow-y-auto pb-2 max-h-[172px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <EraserSwatch
                  selected={activeFloorColor === 'eraser'}
                  onClick={resetFloor}
                  theme={theme}
                />
                {colorPresets.map((preset) => (
                  <ColorSwatchTile
                    key={preset.id}
                    preset={preset}
                    selected={activeFloorColor === preset.id}
                    onClick={() => applyFloorColor(preset)}
                    theme={theme}
                  />
                ))}
              </div>
            </div>

            {/* Wall colors */}
            <div className="flex flex-col min-h-0">
              <SectionHeader label="Walls" theme={theme} />

              {renderWallModeToggle()}

              {wallPaintMode === 'single' && (
                <div className={`flex items-start gap-2 p-2 mb-3 rounded-lg border text-[10px] leading-relaxed shadow-sm shrink-0 animate-fade-in ${theme === "dark"
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-100"
                  : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}>
                  <Icon icon={Icons.infoIcon} className="shrink-0 mt-0.5" width={12} height={12} />
                  <span>
                    {activeWallSelection?.type === 'eraser'
                      ? "Click any wall in the 3D view to reset it to default."
                      : activeWallSelection
                        ? "Click any wall in the 3D view to apply the selected material."
                        : "Select a material below, then click any wall in the 3D view to paint it."}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-6 gap-2 overflow-y-auto pb-2 max-h-[172px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <EraserSwatch
                  selected={activeWallSelection?.type === 'eraser'}
                  onClick={() => handleWallSwatchClick({ type: 'eraser', id: 'eraser' })}
                  theme={theme}
                />
                {colorPresets.map((preset) => (
                  <ColorSwatchTile
                    key={preset.id}
                    preset={preset}
                    selected={activeWallSelection?.type === 'color' && activeWallSelection.data.id === preset.id}
                    onClick={() => handleWallSwatchClick({ type: 'color', id: preset.id, data: preset })}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type TabButtonProps = {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
  theme: "dark" | "light";
};

function TabButton({ label, icon, active, onClick, theme }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${active
        ? theme === "dark"
          ? "bg-gradient-to-br from-amber-300 to-amber-500 text-black shadow-md"
          : "bg-zinc-900 text-white shadow-md"
        : theme === "dark"
          ? "text-zinc-400 hover:text-amber-400 hover:bg-zinc-900"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-white"
        }`}
    >
      <Icon icon={icon} width={14} height={14} />
      {label}
    </button>
  );
}

type SectionHeaderProps = {
  label: string;
  theme: "dark" | "light";
  action?: React.ReactNode;
};

function SectionHeader({ label, theme, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className={`w-1.5 h-1.5 rounded-full ${theme === "dark" ? "bg-amber-400" : "bg-zinc-900"}`} />
      <p className={`text-[10px] uppercase tracking-[0.15em] font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
        {label}
      </p>
      <div className={`flex-1 h-px ${theme === "dark" ? "bg-gradient-to-r from-zinc-800 to-transparent" : "bg-gradient-to-r from-zinc-200 to-transparent"}`} />
      {action}
    </div>
  );
}
