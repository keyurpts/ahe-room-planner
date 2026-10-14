import { Predefined2DShapes } from 'three-configurator';
import type { RoomShape } from './FloorplanManager';

interface WallTemplate {
  attrs: { userData: { id: string; startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; connections: unknown[] } };
  children: { attrs: { name: string; points: number[] } }[];
}

/** Match the four L orientations shown by the frontend's room selector. */
export function roomTemplate(shape: RoomShape): Parameters<import('three-configurator').FloorplanManager['addPredefinedShape']>[0] {
  if (shape === 'rectangle') return Predefined2DShapes.RECTANGLE;
  if (shape === 'square') return Predefined2DShapes.SQUARE;
  const outlines = {
    'l-top-left': [[-250, -250], [0, -250], [0, 0], [250, 0], [250, 250], [-250, 250]],
    'l-top-right': [[-250, 0], [0, 0], [0, -250], [250, -250], [250, 250], [-250, 250]],
    'l-bottom-right': [[-250, -250], [250, -250], [250, 0], [0, 0], [0, 250], [-250, 250]],
    'l-bottom-left': [[-250, -250], [250, -250], [250, 250], [0, 250], [0, 0], [-250, 0]],
  } as const;
  const points = outlines[shape];
  const template = JSON.parse(Predefined2DShapes.L_SHAPE) as { children: WallTemplate[] };
  const prototype = template.children[0];
  template.children = points.map(([x, y], index) => {
    const [ex, ey] = points[(index + 1) % points.length];
    const wall = structuredClone(prototype);
    wall.attrs.userData.id = crypto.randomUUID();
    wall.attrs.userData.startPoint = { x, y };
    wall.attrs.userData.endPoint = { x: ex, y: ey };
    wall.attrs.userData.connections = [];
    const line = wall.children.find(child => child.attrs.name === 'wall');
    if (!line) throw new Error('The SDK room template has no wall line.');
    line.attrs.points = [x, y, ex, ey];
    return wall;
  });
  // The SDK accepts serialized Konva templates but types them as enum values.
  return JSON.stringify(template) as Parameters<import('three-configurator').FloorplanManager['addPredefinedShape']>[0];
}
