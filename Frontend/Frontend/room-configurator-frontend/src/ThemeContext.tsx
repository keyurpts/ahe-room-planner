import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeColors {
  // General
  textMain: string;
  borderAccent: string;

  // TwoD
  twoDBg: string;

  // TwoDToolsPanel
  twoDToolsPanelBg: string;
  twoDToolActive: string;
  twoDToolInactive: string;

  // ViewPanel
  viewBg: string;
  viewCard: string;
  viewText: string;
  viewTextMuted: string;
  viewTextCardSub: string;
  viewTextCardHeaderHover: string;

  // TopPanel
  topPanelBg: string;
  topPanelBorder: string;
  topPanelText: string;
  topPanelSelectorBg: string;

  // FurnitureGrid
  gridItemBg: string;
  gridItemBorder: string;
  gridItemHoverBorder: string;
  gridItemHoverShadow: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const themeColors: Record<Theme, ThemeColors> = {
  dark: {
    textMain: "text-white",
    borderAccent: "border-zinc-800/80",

    // TwoD
    twoDBg: "bg-[#899499]",

    // TwoDToolsPanel
    twoDToolsPanelBg: "bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-md text-white",
    twoDToolActive: "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold",
    twoDToolInactive: "hover:bg-zinc-800/80 text-zinc-400 hover:text-white",

    // ViewPanel
    viewBg: "bg-[radial-gradient(circle_at_60%_45%,#7b8da6_0%,#3a4b63_45%,#1c2533_100%)]",
    viewCard: "bg-[#0e1116]/75 border border-white/10 text-white",
    viewText: "text-white",
    viewTextMuted: "text-zinc-300",
    viewTextCardSub: "text-zinc-400",
    viewTextCardHeaderHover: "text-white group-hover:text-amber-400",

    // TopPanel
    topPanelBg: "bg-[#212429]",
    topPanelBorder: "border-zinc-850",
    topPanelText: "text-white",
    topPanelSelectorBg: "bg-[#2b3036]/60",

    // FurnitureGrid
    gridItemBg: "bg-gradient-to-b from-[#2b3036] to-[#212429]",
    gridItemBorder: "border-zinc-800",
    gridItemHoverBorder: "hover:border-amber-400/50",
    gridItemHoverShadow: "hover:shadow-[0_4px_20px_rgba(251,191,36,0.08)]",
  },
  light: {
    textMain: "text-zinc-900",
    borderAccent: "border-zinc-300",

    // TwoD
    twoDBg: "bg-[#f8f9fa]",

    // TwoDToolsPanel
    twoDToolsPanelBg: "bg-black text-white border-none",
    twoDToolActive: "bg-blue-500 text-white shadow-md shadow-blue-500/20 font-bold",
    twoDToolInactive: "hover:bg-zinc-800/80 text-zinc-400 hover:text-white",

    // ViewPanel
    viewBg: "bg-[radial-gradient(circle_at_60%_45%,#ffffff_0%,#f5efe3_45%,#e3d5bd_100%)]",
    viewCard: "bg-[#ffffff]/90 border border-zinc-300 text-zinc-900 shadow-lg",
    viewText: "text-zinc-900",
    viewTextMuted: "text-zinc-650",
    viewTextCardSub: "text-zinc-500",
    viewTextCardHeaderHover: "text-zinc-900 group-hover:text-black",

    // TopPanel
    topPanelBg: "bg-[#ffffff]",
    topPanelBorder: "border-zinc-200",
    topPanelText: "text-zinc-900",
    topPanelSelectorBg: "bg-[#e9ecef]",

    // FurnitureGrid
    gridItemBg: "bg-gradient-to-b from-[#ffffff] to-[#f8f9fa]",
    gridItemBorder: "border-zinc-250",
    gridItemHoverBorder: "hover:border-zinc-300",
    gridItemHoverShadow: "hover:shadow-md",
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved as Theme) || "dark";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("app-theme", next);
      return next;
    });
  };

  useEffect(() => {
    // Synchronize HTML element classes for potential library classes or global style rules
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  const colors = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
