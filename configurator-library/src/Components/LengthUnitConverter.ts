import { LengthUnit } from "../Constants";

/**
 * Provides common length unit conversion and formatting utilities.
 */
export class LengthUnitConverter {
  /**
  * Current unit for displaying wall lengths ('mm', 'cm', 'inch', 'foot').
  * Default is 'mm' (millimeters).
  */
  public static currentUnit: LengthUnit = LengthUnit.MM;
  /**
   * Normalizes a string representation into a supported LengthUnit.
   * Defaults to millimeters when the provided unit is invalid.
   */
  public static normalizeUnit(unit: string | LengthUnit): LengthUnit {
    if (!unit) return LengthUnit.MM;

    const normalizedUnit = unit.toString().toLowerCase().trim();

    switch (normalizedUnit) {
      case "mm":
      case "millimeter":
      case "millimeters":
        return LengthUnit.MM;

      case "cm":
      case "centimeter":
      case "centimeters":
        return LengthUnit.CM;

      case "inch":
      case "inches":
      case "in":
        return LengthUnit.INCH;

      case "foot":
      case "feet":
      case "ft":
        return LengthUnit.FOOT;

      default:
        return LengthUnit.MM;
    }
  }

  /**
   * Converts centimeters into the specified length unit.
   */
  public static convertCentimetersToUnit(
    valueInCm: number,
    targetUnit: LengthUnit,
  ): number {
    switch (targetUnit) {
      case LengthUnit.MM:
        return valueInCm * 10;

      case LengthUnit.CM:
        return valueInCm;

      case LengthUnit.INCH:
        return valueInCm / 2.54;

      case LengthUnit.FOOT:
        return valueInCm / 30.48;

      default:
        return valueInCm;
    }
  }

  /**
   * Converts the specified length unit into centimeters.
   */
  public static convertUnitToCentimeters(
    value: number,
    sourceUnit: LengthUnit,
  ): number {
    switch (sourceUnit) {
      case LengthUnit.MM:
        return value / 10;

      case LengthUnit.CM:
        return value;

      case LengthUnit.INCH:
        return value * 2.54;

      case LengthUnit.FOOT:
        return value * 30.48;

      default:
        return value;
    }
  }

  /**
   * Converts and formats a centimeter value into the specified unit.
   */
  public static formatLengthFromCentimeters(
    valueInCm: number,
    unit: LengthUnit,
    precision: number = 1,
  ): string {
    const convertedValue = this.convertCentimetersToUnit(valueInCm, unit);

    return `${convertedValue.toFixed(precision)} ${unit}`;
  }

  /**
   * Converts a raw 2D canvas length into the specified display unit
   * and returns the formatted measurement.
   */
  public static formatCanvasLength(
    length: number,
    conversionToCm: number,
    unit: LengthUnit,
    precision: number = 1,
  ): string {
    const lengthInCm = length * conversionToCm;

    return this.formatLengthFromCentimeters(lengthInCm, unit, precision);
  }
}
