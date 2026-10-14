export enum LengthUnit {
  MM = 'mm', CM = 'cm', INCH = 'inch', FOOT = 'foot',
}

export function normalizeLengthUnit(unit: string): LengthUnit {
  const units: Record<string, LengthUnit> = {
    mm: LengthUnit.MM, millimeter: LengthUnit.MM, millimeters: LengthUnit.MM,
    cm: LengthUnit.CM, centimeter: LengthUnit.CM, centimeters: LengthUnit.CM,
    inch: LengthUnit.INCH, inches: LengthUnit.INCH, in: LengthUnit.INCH,
    foot: LengthUnit.FOOT, feet: LengthUnit.FOOT, ft: LengthUnit.FOOT,
  };
  return units[unit.trim().toLowerCase()] ?? LengthUnit.MM;
}

export function fromCentimeters(value: number, unit: LengthUnit): number {
  return value / { mm: 0.1, cm: 1, inch: 2.54, foot: 30.48 }[unit];
}

export function toCentimeters(value: number, unit: LengthUnit): number {
  return value * { mm: 0.1, cm: 1, inch: 2.54, foot: 30.48 }[unit];
}

export function formatLength(cm: number, unit: LengthUnit): string {
  return fromCentimeters(cm, unit).toFixed(1) + ' ' + unit;
}
