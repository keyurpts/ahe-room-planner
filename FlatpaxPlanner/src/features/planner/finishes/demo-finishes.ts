export interface DemoFinish {
  name: string;
  background: string;
}

function wood(name: string, light: string, dark: string): DemoFinish {
  return {
    name,
    background: `repeating-linear-gradient(92deg, transparent 0 5px, ${dark}55 6px 7px, transparent 8px 14px), repeating-linear-gradient(0deg, ${light} 0 15px, ${dark} 16px 17px)`,
  };
}
function tile(name: string, colour: string, grout: string): DemoFinish {
  return {
    name,
    background: `repeating-linear-gradient(0deg, transparent 0 15px, ${grout} 15px 17px), repeating-linear-gradient(90deg, ${colour} 0 15px, ${grout} 15px 17px)`,
  };
}
function stone(name: string, light: string, dark: string): DemoFinish {
  return {
    name,
    background: `repeating-linear-gradient(135deg, ${light} 0 9px, ${dark} 10px, ${light} 12px 22px)`,
  };
}

// Presentation-only previews; replace with material assets when renderer finishes are integrated.
export const floorTextures: readonly DemoFinish[] = [
  wood('Natural oak', '#c79d6b', '#8d633c'),
  wood('Walnut planks', '#79543d', '#493226'),
  wood('Whitewashed timber', '#e0d8c8', '#b5ac9a'),
  wood('Honey maple', '#dcbb7d', '#ae8247'),
  tile('Grey porcelain', '#aaaeb1', '#ececea'),
  tile('Cream ceramic', '#e5dcc9', '#faf7ef'),
  tile('Terracotta tiles', '#be7653', '#eee1ca'),
  tile('Slate tiles', '#535e66', '#949a9e'),
  stone('White marble', '#f3f0ed', '#b4bbc0'),
  stone('Sandstone', '#d8c4a3', '#b5a17f'),
  {
    name: 'Terrazzo',
    background:
      'radial-gradient(ellipse at 20% 30%, #bca78e 0 2px, transparent 3px), radial-gradient(ellipse at 70% 70%, #747d81 0 2px, transparent 3px), repeating-conic-gradient(#e4ddd2 0% 25%, #d6cfc5 0% 50%) 0 0 / 11px 13px',
  },
];
export const wallTextures: readonly DemoFinish[] = [
  tile('White subway tile', '#f6f5ef', '#cbd0ce'),
  tile('Sage tile', '#9eafa0', '#eef0e9'),
  tile('Blue mosaic', '#729aa8', '#dce6e6'),
  tile('Charcoal mosaic', '#454f52', '#b5bdbd'),
  stone('Limewash plaster', '#e7dfd1', '#d0c6b5'),
  stone('Concrete plaster', '#b5b7b5', '#949997'),
  stone('Travertine', '#d9c5a7', '#b6a184'),
  wood('Vertical timber', '#c69d71', '#8e6c49'),
  tile('Brickwork', '#b97863', '#dbcabb'),
  stone('Pearl marble', '#eee9e1', '#c7b9a8'),
  {
    name: 'Linen wallpaper',
    background:
      'repeating-linear-gradient(0deg, #d9d2c6 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, #eae4d9 0 2px, #c8bfaf 2px 3px)',
  },
];
const colours = (values: readonly (readonly [string, string])[]): readonly DemoFinish[] =>
  values.map(([name, background]) => ({ name, background }));
export const floorColours = colours([
  ['Warm white', '#f3eee4'],
  ['Ivory', '#e9ddc3'],
  ['Sand', '#cbbb9b'],
  ['Taupe', '#a89787'],
  ['Pebble grey', '#b4b7b4'],
  ['Concrete grey', '#8d9599'],
  ['Slate', '#626f78'],
  ['Charcoal', '#3d4448'],
  ['Terracotta', '#bd7354'],
  ['Chocolate', '#685044'],
  ['Olive grey', '#8c927d'],
]);
export const wallColours = colours([
  ['Pure white', '#ffffff'],
  ['Soft cream', '#f5efd8'],
  ['Sage green', '#a2b69c'],
  ['Seafoam', '#b6d5cb'],
  ['Dusty blue', '#96b4c8'],
  ['Navy', '#354e68'],
  ['Blush', '#e5bdb2'],
  ['Clay', '#bd8a70'],
  ['Butter yellow', '#edda94'],
  ['Lavender', '#bdb1d0'],
  ['Graphite', '#555b61'],
]);
