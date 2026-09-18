import { getIconData } from "@iconify/utils";
import type { IconifyIcon } from "@iconify/react";
import { icons as mdiIcons } from "@iconify-json/mdi";
import { icons as icIcons } from "@iconify-json/ic";
import { icons as epIcons } from "@iconify-json/ep";
import { icons as heroicons } from "@iconify-json/heroicons";
import { icons as tdesignIcons } from "@iconify-json/tdesign";
import { icons as lucideIcons } from "@iconify-json/lucide";

function icon(collection: any, name: string): IconifyIcon {
  const data = getIconData(collection, name);
  if (!data) throw new Error(`Unknown icon: ${name} in collection`);
  return data;
}

const Icons = {
  paletteSwatchOutline: icon(mdiIcons, "palette-swatch-outline"),
  baselineAutorenew: icon(icIcons, "baseline-autorenew"),
  rankIcon: icon(epIcons, "rank"),
  baselineSyncAlt: icon(icIcons, "baseline-sync-alt"),
  outlineContentCopy: icon(icIcons, "outline-content-copy"),
  trashSolid: icon(heroicons, "trash-solid"),
  measurementIcon: icon(tdesignIcons, "measurement"),
  rulerIcon: icon(lucideIcons, "ruler"),
  wallIcon: icon(mdiIcons, "wall"),
  cameraIcon: icon(lucideIcons, "camera"),
  heart_outline :icon (lucideIcons,"heart"),
  heart_filled :icon (heroicons, "heart-solid"),
  twotoneTableBar: icon(icIcons, "twotone-table-bar"),
  searchIcon: icon(lucideIcons, "search"),
  layersIcon: icon(lucideIcons, "layers"),
  infoIcon: icon(lucideIcons, "info"),
  checkIcon: icon(lucideIcons, "check"),
  xIcon: icon(lucideIcons, "x"),
  mousePointerClick: icon(lucideIcons, "mouse-pointer-click"),
  textureIcon: icon(mdiIcons, "texture"),
  paletteOutline: icon(mdiIcons, "palette-outline"),
  arrowLeft: icon(lucideIcons, "arrow-left"),
  arrowRight: icon(lucideIcons, "arrow-right"),
  arrowUp: icon(lucideIcons, "arrow-up"),
  arrowDown: icon(lucideIcons, "arrow-down"),
  floorPlanIcon: icon(mdiIcons, "floor-plan"),
  cubeOutline: icon(mdiIcons, "cube-outline"),
  settings2Icon: icon(lucideIcons, "settings-2"),
  sunIcon: icon(lucideIcons, "sun"),
  moonIcon: icon(lucideIcons, "moon"),
  panelLeftClose: icon(lucideIcons, "panel-left-close"),
  panelLeftOpen: icon(lucideIcons, "panel-left-open"),
  pencilSolid: icon(heroicons, "pencil-solid"),
  minusSolid: icon(heroicons, "minus-solid"),
  doorOpen: icon(lucideIcons, "door-open"),
  windowClosed: icon(mdiIcons, "window-closed"),
  squares2x2Solid: icon(heroicons, "squares-2x2-solid"),
  maximizeIcon: icon(lucideIcons, "maximize"),
  eraserIcon: icon(lucideIcons, "eraser"),
  sparklesSolid: icon(heroicons, "sparkles-solid"),
  xMark20Solid: icon(heroicons, "x-mark-20-solid"),
  cloudArrowUpSolid: icon(heroicons, "cloud-arrow-up-solid"),
  eyeSolid: icon(heroicons, "eye-solid"),
  eyeSlashSolid: icon(heroicons, "eye-slash-solid"),
  pencilRuler: icon(lucideIcons, "pencil-ruler"),
  eyeOff: icon(lucideIcons, "eye-off"),
  downloadIcon: icon(lucideIcons, "download"),
  uploadIcon: icon(lucideIcons, "upload"),
  shapeOutline: icon(mdiIcons, "shape-outline"),
  logOut: icon(lucideIcons, "log-out"),
};

export default Icons;