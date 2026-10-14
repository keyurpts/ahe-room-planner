import type { FloorplanManager, ConfiguratorCore } from 'three-configurator';
import { formatLength, toCentimeters, type LengthUnit } from './units';

// The fixed SDK has no public unit-display extension point. Keep its instance
// hooks isolated here, validate them at startup, and restore them on disposal.
// No SDK files or class prototypes are changed.
interface CanvasNode {
  find(selector: string): CanvasNode[];
  findOne(selector: string): CanvasNode | undefined;
  getParent(): CanvasNode | null;
  points(value?: number[]): number[];
  text(value?: string): string;
  width(): number;
  height(): number;
  offsetX(value: number): void;
  offsetY(value: number): void;
}

interface Editor {
  stage: CanvasNode & { batchDraw(): void };
  unit_conversion_factor: number;
  createDimension(x1: number, y1: number, x2: number, y2: number, color?: string): CanvasNode | null;
  refreshDimensions(): void;
  editWallDimensions(wall: CanvasNode, value: number, point: string): void;
  placePreview(): void;
}

interface CoreHooks {
  createTextSprite(text: string): unknown;
  isShowAllMeasurementsActive: boolean;
}

export function installUnitBridge(manager: FloorplanManager, core: ConfiguratorCore, getUnit: () => LengthUnit) {
  const editor = (manager as unknown as { design2D: Editor }).design2D;
  const hooks = core as unknown as CoreHooks;
  if (!editor?.stage || typeof editor.createDimension !== 'function' ||
      typeof editor.refreshDimensions !== 'function' || typeof editor.editWallDimensions !== 'function' ||
      typeof editor.placePreview !== 'function' || typeof hooks.createTextSprite !== 'function') {
    throw new Error('The fixed configurator package is incompatible with the wrapper unit extension.');
  }
  const create = editor.createDimension;
  const refresh = editor.refreshDimensions;
  const edit = editor.editWallDimensions;
  const sprite = hooks.createTextSprite;

  function updateDimension(group: CanvasNode) {
    const wall = group.getParent()?.findOne('.wall');
    const label = group.findOne('.dimensionText');
    if (!wall || !label) return;
    const [x1, y1, x2, y2] = wall.points();
    const length = Math.hypot(x2 - x1, y2 - y1);
    label.text(formatLength(length * 0.6 * editor.unit_conversion_factor, getUnit()));
    label.offsetX(label.width() / 2);
    label.offsetY(label.height() / 2);
    // Resize the gap around the longer label without changing wall geometry.
    const left = group.findOne('.leftDimensionLine');
    const right = group.findOne('.rightDimensionLine');
    if (left && right && length > 0) {
      const [sx, sy] = left.points();
      const points = right.points();
      const ex = points[points.length - 2], ey = points[points.length - 1];
      const gap = Math.min(length, label.width() + 10);
      const ux = (ex - sx) / length, uy = (ey - sy) / length;
      left.points([sx, sy, sx + ux * (length - gap) / 2, sy + uy * (length - gap) / 2]);
      right.points([sx + ux * (length + gap) / 2, sy + uy * (length + gap) / 2, ex, ey]);
    }
  }

  function refreshUnits() {
    editor.stage.find('.dimensionGroup').forEach(updateDimension);
    editor.stage.batchDraw();
  }

  editor.createDimension = function (...args) {
    const group = create.apply(this, args);
    // New dimension groups have not been attached to their wall yet.
    if (group) {
      const label = group.findOne('.dimensionText');
      if (label) {
        label.text(formatLength(Math.hypot(args[2] - args[0], args[3] - args[1]) * 0.6 * editor.unit_conversion_factor, getUnit()));
        label.offsetX(label.width() / 2);
      }
    }
    return group;
  };
  editor.refreshDimensions = function () { refresh.call(this); refreshUnits(); };
  editor.editWallDimensions = function (wall, value, point) {
    edit.call(this, wall, toCentimeters(value, getUnit()), point);
    refreshUnits();
  };
  hooks.createTextSprite = function (text) {
    const match = /^([\d.]+) unit$/.exec(text);
    return sprite.call(this, match ? formatLength(Number(match[1]) * 100, getUnit()) : text);
  };

  return {
    refresh() {
      refreshUnits();
      if (hooks.isShowAllMeasurementsActive) core.showAllMeasurements();
      else if (core.measurementState.isActive) core.toggleMeasurement();
    },
    placeRoom() { editor.placePreview(); refreshUnits(); },
    dispose() {
      editor.createDimension = create;
      editor.refreshDimensions = refresh;
      editor.editWallDimensions = edit;
      hooks.createTextSprite = sprite;
    },
  };
}
