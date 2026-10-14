import { Design2D, Config, NodeName } from 'three-configurator';
import type Konva from 'konva';
import { LengthUnit, formatLength, toCentimeters } from './units';

/** Unit display and input conversion belong to the wrapper. */
export class Design2DWrapper extends Design2D {
  private unit = LengthUnit.MM;

  setLengthUnit(unit: LengthUnit): void {
    this.unit = unit;
    this.refreshDimensions();
  }

  override createDimension(...args: Parameters<Design2D['createDimension']>): ReturnType<Design2D['createDimension']> {
    const group = super.createDimension(...args);
    if (group) this.updateLabel(group, args[0], args[1], args[2], args[3]);
    return group;
  }

  override refreshDimensions(): void {
    super.refreshDimensions();
    this.stage.find('.' + NodeName.DIMENSION_GROUP).forEach(node => {
      const group = node as Konva.Group;
      const wall = group.getParent()?.findOne('.' + NodeName.WALL) as Konva.Line | undefined;
      if (wall) {
        const [x1, y1, x2, y2] = wall.points();
        this.updateLabel(group, x1, y1, x2, y2);
      }
    });
    this.stage.batchDraw();
  }

  override editWallDimensions(...args: Parameters<Design2D['editWallDimensions']>): boolean {
    const [wall, length, point] = args;
    const result = super.editWallDimensions(wall, toCentimeters(length, this.unit), point);
    this.refreshDimensions();
    return result;
  }

  override placePreview(): void {
    super.placePreview();
    this.refreshDimensions();
  }

  private updateLabel(group: Konva.Group, x1: number, y1: number, x2: number, y2: number): void {
    const label = group.findOne('.' + NodeName.DIMENSION_TEXT) as Konva.Text | undefined;
    if (!label) return;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const cm = length * Config.KONVA_UNIT_TO_CM * this.unit_conversion_factor;
    label.text(formatLength(cm, this.unit ?? LengthUnit.MM));
    label.offsetX(label.width() / 2);
    label.offsetY(label.height() / 2);
    const left = group.findOne('.' + NodeName.DIMENSION_LEFT_LINE) as Konva.Line | undefined;
    const right = group.findOne('.' + NodeName.DIMENSION_RIGHT_LINE) as Konva.Line | undefined;
    if (!left || !right || length === 0) return;
    const [sx, sy] = left.points();
    const points = right.points();
    const ex = points[points.length - 2], ey = points[points.length - 1];
    const gap = Math.min(length, label.width() + Config.DIMENSION_TEXT_PADDING);
    const ux = (ex - sx) / length, uy = (ey - sy) / length;
    left.points([sx, sy, sx + ux * (length - gap) / 2, sy + uy * (length - gap) / 2]);
    right.points([sx + ux * (length + gap) / 2, sy + uy * (length + gap) / 2, ex, ey]);
  }
}
