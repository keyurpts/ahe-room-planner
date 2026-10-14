import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LengthUnit, fromCentimeters, toCentimeters, formatLength, normalizeLengthUnit } from '../dist/units.js';

test('display units preserve physical length across round trips', () => {
  for (const unit of Object.values(LengthUnit)) {
    assert.ok(Math.abs(toCentimeters(fromCentimeters(123.45, unit), unit) - 123.45) < 1e-10);
  }
  assert.equal(fromCentimeters(2.54, LengthUnit.INCH), 1);
  assert.equal(fromCentimeters(30.48, LengthUnit.FOOT), 1);
  assert.equal(formatLength(300, LengthUnit.MM), '3000.0 mm');
});
test('unit aliases match the reference implementation', () => {
  assert.equal(normalizeLengthUnit(' FT '), LengthUnit.FOOT);
  assert.equal(normalizeLengthUnit('inches'), LengthUnit.INCH);
  assert.equal(normalizeLengthUnit('unknown'), LengthUnit.MM);
});
