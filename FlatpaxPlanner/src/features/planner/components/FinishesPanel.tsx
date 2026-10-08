import { useEffect, useId, useRef, useState } from 'react';
import closeIcon from '@/assets/icons/Close.svg';
import resetIcon from '@/assets/icons/material-symbols_restart-alt-rounded.svg';
import '@/styles/finishes.css';
import {
  floorTextures,
  wallTextures,
  floorColours,
  wallColours,
  type DemoFinish,
} from '@/features/planner/finishes/demo-finishes';

interface Props {
  open: boolean;
  onClose: () => void;
}
type FinishMode = 'Textures' | 'Colours';

function FinishSymbol({
  type,
}: {
  type: 'textures' | 'colours' | 'all' | 'selection' | 'finishes';
}) {
  return (
    <svg
      width={type === 'finishes' ? 40 : 24}
      height={type === 'finishes' ? 40 : 24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {type === 'textures' && (
        <path
          d="m3 8 5-5M3 15 15 3M3 22 22 3M10 22l12-12m-5 12 5-5"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
      {type === 'colours' && (
        <>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5" stroke="white" strokeWidth="1.5" />
        </>
      )}
      {type === 'all' && (
        <path d="M2 2h9v9H2zm11 0h9v9h-9zM2 13h9v9H2zm11 0h9v9h-9z" fill="currentColor" />
      )}
      {type === 'selection' && (
        <path
          d="m10 7 9 9-5 1 3 5-3 1-3-5-3 4V7ZM10 1v3M3 4l3 2M1 11h4M18 3l-3 3M20 10h-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {type === 'finishes' && (
        <path
          d="M12 1v4m0 14v4M1 12h4m14 0h4M4 4l3 3m10 10 3 3M4 20l3-3M17 7l3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function SwatchGrid({
  label,
  options,
  mode,
  selected,
  onSelect,
}: {
  label: string;
  options: readonly DemoFinish[];
  mode: FinishMode;
  selected: number | null;
  onSelect: (index: number | null) => void;
}) {
  return (
    <div className="finish-swatch-grid" role="group" aria-label={`${label} ${mode.toLowerCase()}`}>
      <button
        type="button"
        className="finish-reset"
        aria-label={`Reset ${label.toLowerCase()} finish`}
        onClick={() => {
          onSelect(null);
        }}
      >
        <img src={resetIcon} width={24} height={24} alt="" />
        <span>Reset</span>
      </button>
      {options.map((option, index) => (
        <button
          key={option.name}
          type="button"
          className="finish-swatch"
          aria-label={`${label}: ${option.name}`}
          title={option.name}
          style={{ background: option.background }}
          aria-pressed={selected === index}
          onClick={() => {
            onSelect(index);
          }}
        >
          {selected === index && (
            <span className="finish-swatch-check" aria-hidden="true">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function FinishesPanel({ open, onClose }: Props) {
  const [mode, setMode] = useState<FinishMode>('Textures');
  const [wallScope, setWallScope] = useState<'all' | 'selection'>('all');
  const [floor, setFloor] = useState<number | null>(null);
  const [walls, setWalls] = useState<number | null>(null);

  const closeRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="finishes-panel"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="finishes-panel-header">
        <FinishSymbol type="finishes" />
        <div>
          <h2 id={`${id}-title`}>Finishes</h2>
          <p id={`${id}-description`}>Floor &amp; wall styling</p>
        </div>
        <button
          ref={closeRef}
          type="button"
          className="finishes-close"
          aria-label="Close finishes"
          onClick={onClose}
        >
          <img src={closeIcon} width={30} height={30} alt="" />
        </button>
      </header>
      <div role="tablist" aria-label="Finish type" className="finishes-tabs">
        {(['Textures', 'Colours'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${id}-${tab}`}
            aria-selected={mode === tab}
            aria-controls={`${id}-options`}
            tabIndex={mode === tab ? 0 : -1}
            onClick={() => {
              setMode(tab);
              setFloor(null);
              setWalls(null);
            }}
            onKeyDown={(event) => {
              if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                const next =
                  event.key === 'Home'
                    ? 'Textures'
                    : event.key === 'End'
                      ? 'Colours'
                      : mode === 'Textures'
                        ? 'Colours'
                        : 'Textures';
                setMode(next);
                setFloor(null);
                setWalls(null);

                document.getElementById(`${id}-${next}`)?.focus();
              }
            }}
          >
            <FinishSymbol type={tab === 'Textures' ? 'textures' : 'colours'} />
            {tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-options`} aria-labelledby={`${id}-${mode}`}>
        <section className="finishes-surfaces" aria-label="Floor finishes">
          <h3>Floor</h3>
          <SwatchGrid
            label="Floor"
            options={mode === 'Textures' ? floorTextures : floorColours}
            mode={mode}
            selected={floor}
            onSelect={setFloor}
          />
        </section>
        <section aria-label="Wall finishes" className="finishes-walls">
          <h3>Walls</h3>
          <div className="finish-apply-controls" role="group" aria-label="Wall application scope">
            <button
              type="button"
              aria-pressed={wallScope === 'all'}
              onClick={() => {
                setWallScope('all');
              }}
            >
              <FinishSymbol type="all" />
              Apply to all
            </button>
            <button
              type="button"
              aria-pressed={wallScope === 'selection'}
              onClick={() => {
                setWallScope('selection');
              }}
            >
              <FinishSymbol type="selection" />
              <span>
                Apply
                <br />
                to selection
              </span>
            </button>
          </div>
          <div className="finishes-wall-options">
            <SwatchGrid
              label="Walls"
              options={mode === 'Textures' ? wallTextures : wallColours}
              mode={mode}
              selected={walls}
              onSelect={setWalls}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
