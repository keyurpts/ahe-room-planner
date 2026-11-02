import { ToolbarDropdown } from '@/components/ui/ToolbarDropdown';
import { LengthUnit } from 'three-configurator';

const groups = [
  {
    label: 'Metric',
    options: [
      { value: LengthUnit.MM, label: 'mm' },
      { value: LengthUnit.CM, label: 'cm' },
    ],
  },
  {
    label: 'Imperial',
    options: [
      { value: LengthUnit.INCH, label: 'inch' },
      { value: LengthUnit.FOOT, label: 'foot' },
    ],
  },
] as const;

export function UnitSelector({
  unit,
  onChange,
}: {
  unit: LengthUnit;
  onChange: (unit: LengthUnit) => void;
}) {
  const symbol = unit === LengthUnit.INCH ? 'in' : unit === LengthUnit.FOOT ? 'ft' : unit;
  return (
    <ToolbarDropdown
      value={unit}
      onChange={onChange}
      groups={groups}
      label={`Measurement unit: ${symbol}`}
      triggerContent={symbol}
    />
  );
}
