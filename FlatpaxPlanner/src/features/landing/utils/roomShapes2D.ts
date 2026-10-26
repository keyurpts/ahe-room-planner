export const roomShapes2D = [
  { id: 'rectangle', label: 'Wide rectangular room', path: 'M10 30H90V72H10Z' },
  { id: 'l-top-left', label: 'L-shaped room, upper left corner', path: 'M10 10H50V50H90V90H10Z' },
  { id: 'l-top-right', label: 'L-shaped room, upper right corner', path: 'M10 50H50V10H90V90H10Z' },
  { id: 'square', label: 'Square room', path: 'M10 10H90V90H10Z' },
  {
    id: 'l-bottom-right',
    label: 'L-shaped room, lower right corner',
    path: 'M10 10H90V50H50V90H10Z',
  },
  {
    id: 'l-bottom-left',
    label: 'L-shaped room, lower left corner',
    path: 'M10 10H90V90H50V50H10Z',
  },
] as const;