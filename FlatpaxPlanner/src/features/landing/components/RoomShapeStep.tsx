import { useId } from 'react';
import type { RoomShape } from '@/features/planner/types';
import '@/styles/room-shape.css';

const roomShapes = [
  { id: 'rectangle', label: 'Wide rectangular room', path: 'M10 30H90V72H10Z' },
  { id: 'l-top-left', label: 'L-shaped room, upper left corner', path: 'M10 18H63V50H91V79H10Z' },
  { id: 'l-top-right', label: 'L-shaped room, upper right corner', path: 'M8 50H38V18H92V79H8Z' },
  { id: 'square', label: 'Square room', path: 'M15 15H85V85H15Z' },
  {
    id: 'l-bottom-right',
    label: 'L-shaped room, lower right corner',
    path: 'M10 20H90V80H36V55H10Z',
  },
  {
    id: 'l-bottom-left',
    label: 'L-shaped room, lower left corner',
    path: 'M10 20H95V48H65V80H10Z',
  },
] as const;

interface Props {
  selected: RoomShape | null;
  onSelect: (shape: RoomShape) => void;
  onCustom: () => void;
  message: string;
}

export function RoomShapeStep({ selected, onSelect, onCustom, message }: Props) {
  const id = useId();
  return (
    <>
      <fieldset className="room-shape-panel">
        <legend className="sr-only">Select the shape of your room</legend>
        <div className="room-shape-grid">
          {roomShapes.map((shape) => (
            <label className="room-shape-card" key={shape.id}>
              <input
                type="radio"
                className="room-shape-input"
                name={`${id}-shape`}
                value={shape.id}
                checked={selected === shape.id}
                onChange={() => {
                  onSelect(shape.id);
                }}
                aria-label={shape.label}
              />
              <svg width="104" height="100" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <path d={shape.path} stroke="currentColor" strokeWidth="4" />
              </svg>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="room-shape-custom-section">
        <div className="room-shape-custom-panel">
          <p
            className={message ? 'shape-step-message' : 'room-shape-or'}
            role={message ? 'status' : undefined}
          >
            {message || 'Or'}
          </p>
          <button type="button" className="custom-room-button" onClick={onCustom}>
            Draw walls for a custom design
            <svg width="34" height="24" viewBox="0 0 34 24" fill="none" aria-hidden="true">
              <path
                d="M2 12h29m0 0-8-8m8 8-8 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
