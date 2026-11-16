[three-configurator](../index.md) / LengthUnitConverter

# Class: LengthUnitConverter

Defined in: [Components/LengthUnitConverter.ts:6](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/LengthUnitConverter.ts#L6)

Provides common length unit conversion and formatting utilities.

## Constructors

### Constructor

```ts
new LengthUnitConverter(): LengthUnitConverter;
```

#### Returns

`LengthUnitConverter`

## Properties

### currentUnit

```ts
static currentUnit: LengthUnit = LengthUnit.MM;
```

Defined in: [Components/LengthUnitConverter.ts:11](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/LengthUnitConverter.ts#L11)

Current unit for displaying wall lengths ('mm', 'cm', 'inch', 'foot').
Default is 'mm' (millimeters).

## Methods

### convertCentimetersToUnit()

```ts
static convertCentimetersToUnit(valueInCm, targetUnit): number;
```

Defined in: [Components/LengthUnitConverter.ts:50](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/LengthUnitConverter.ts#L50)

Converts centimeters into the specified length unit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `valueInCm` | `number` |
| `targetUnit` | `LengthUnit` |

#### Returns

`number`

***

### convertUnitToCentimeters()

```ts
static convertUnitToCentimeters(value, sourceUnit): number;
```

Defined in: [Components/LengthUnitConverter.ts:75](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/LengthUnitConverter.ts#L75)

Converts the specified length unit into centimeters.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |
| `sourceUnit` | `LengthUnit` |

#### Returns

`number`

***

### formatCanvasLength()

```ts
static formatCanvasLength(
   length, 
   conversionToCm, 
   unit, 
   precision?): string;
```

Defined in: [Components/LengthUnitConverter.ts:114](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/LengthUnitConverter.ts#L114)

Converts a raw 2D canvas length into the specified display unit
and returns the formatted measurement.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `length` | `number` | `undefined` |
| `conversionToCm` | `number` | `undefined` |
| `unit` | `LengthUnit` | `undefined` |
| `precision` | `number` | `1` |

#### Returns

`string`

***

### formatLengthFromCentimeters()

```ts
static formatLengthFromCentimeters(
   valueInCm, 
   unit, 
   precision?): string;
```

Defined in: [Components/LengthUnitConverter.ts:100](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/LengthUnitConverter.ts#L100)

Converts and formats a centimeter value into the specified unit.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `valueInCm` | `number` | `undefined` |
| `unit` | `LengthUnit` | `undefined` |
| `precision` | `number` | `1` |

#### Returns

`string`

***

### normalizeUnit()

```ts
static normalizeUnit(unit): LengthUnit;
```

Defined in: [Components/LengthUnitConverter.ts:16](https://github.com/rahulkhandepts/3d-configurator-library/blob/a79d327b61a9aa580050f34f2f5d81c9e44bfac7/Library/three-configurator/src/Components/LengthUnitConverter.ts#L16)

Normalizes a string representation into a supported LengthUnit.
Defaults to millimeters when the provided unit is invalid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `unit` | `string` |

#### Returns

`LengthUnit`
