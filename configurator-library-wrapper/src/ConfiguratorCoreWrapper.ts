import { ConfiguratorCore } from 'three-configurator';
import type { Sprite } from 'three';
import { LengthUnit, formatLength } from './units';

/** Format measurement labels using the SDK's public measurement methods. */
export class ConfiguratorCoreWrapper extends ConfiguratorCore {
  private unit = LengthUnit.MM;

  setLengthUnit(unit: LengthUnit): void {
    this.unit = unit;
    this.refreshMeasurementLabels();
  }

  override drawMeasurementLine(...args: Parameters<ConfiguratorCore['drawMeasurementLine']>): void {
    super.drawMeasurementLine(...args);
    this.refreshMeasurementLabels();
  }

  private refreshMeasurementLabels(): void {
    this.measurementGroup?.children.forEach(child => {
      if (child.type !== 'Sprite' || typeof child.userData.distance !== 'number') return;
      const sprite = child as Sprite;
      const text = formatLength(child.userData.distance * 100, this.unit ?? LengthUnit.MM);
      if (sprite.userData.text === text) return;
      const texture = sprite.material.map;
      if (!texture) return;
      const canvas = texture.image as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to format the measurement label.');
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Preserve the SDK's existing font, color and alignment.
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      sprite.userData.text = text;
      texture.needsUpdate = true;
    });
  }
}
