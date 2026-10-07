import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import roomOutline from '@/assets/images/Group 13-1.png';
import '@/styles/presets.css';

const presets = [
  {
    id: 'single-wall',
    title: ['Single wall', 'kitchen'],
    description: 'Cabinets along two adjacent walls.',
  },
  {
    id: 'l-shape',
    title: ['L-shape', 'kitchen'],
    description: 'Cabinets along two adjacent walls.',
  },
  {
    id: 'galley',
    title: ['Galley', 'kitchen'],
    description: 'Two parallel runs facing each other.',
  },
  {
    id: 'u-shape',
    title: ['U-shape', 'kitchen'],
    description: 'Cabinets on three walls',
  },
  {
    id: 'laundry',
    title: ['Laundry', 'room'],
    description: 'Front loader, dryer and storage',
  },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PresetLayoutDialog({ open, onClose }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  function close() {
    setSelectedPreset(null);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Choose a preset layout"
      layout="preset"
      footer={
        <Button
          variant="outline"
          size="compact"
          className="preset-back min-w-[7.1875rem] text-sm uppercase"
          style={{ borderColor: 'var(--color-brand)' }}
          onClick={close}
        >
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
            <path
              d="M26 10H2m0 0 7-7m-7 7 7 7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Button>
      }
    >
      <div className="preset-dialog-body">
        <div className="preset-grid" role="group" aria-label="Preset layouts">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset-card"
              aria-pressed={selectedPreset === preset.id}
              onClick={() => {
                setSelectedPreset(preset.id);
              }}
            >
              <span className="preset-preview" aria-hidden="true">
                <img src={roomOutline} width={174} height={184} alt="" className="preset-room" />
              </span>
              <span className="preset-card-title">
                {preset.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
              <span className="preset-card-description">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
