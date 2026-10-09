import { useEffect, useId, useRef, useState } from 'react';
import resetIcon from '@/assets/icons/material-symbols_restart-alt-rounded.svg';

export interface ItemFinishes {
  sink: number | null;
  benchtop: number | null;
}
interface Props {
  finishes: ItemFinishes;
  onChange: (finishes: ItemFinishes) => void;
  onBack: () => void;
}

export function ItemCustomisationSidebar({ finishes, onChange, onBack }: Props) {
  const [section, setSection] = useState<'sink' | 'benchtop' | null>('benchtop');
  const backRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    backRef.current?.focus();
  }, []);
  return (
    <aside className="items-sidebar customisation-sidebar" aria-label="Item customisation">
      <div className="customisation-card">
        {(['sink', 'benchtop'] as const).map((key) => (
          <section key={key}>
            <h2>
              <button
                type="button"
                className="customisation-section-toggle"
                aria-expanded={section === key}
                aria-controls={`${id}-${key}`}
                onClick={() => {
                  setSection(section === key ? null : key);
                }}
              >
                {key === 'sink' ? 'Sink' : 'Benchtops'}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="m4 7 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h2>
            <div
              id={`${id}-${key}`}
              hidden={section !== key}
              className="customisation-swatches"
              role="group"
              aria-label={`${key} finishes`}
            >
              <button
                type="button"
                className="customisation-reset"
                aria-label={`Reset ${key} finish`}
                onClick={() => {
                  onChange({ ...finishes, [key]: null });
                }}
              >
                <img src={resetIcon} width={30} height={30} alt="" />
                <span>Reset</span>
              </button>
              {Array.from({ length: 5 }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className="customisation-swatch"
                  aria-label={`${key} finish option ${String(index + 1)}`}
                  aria-pressed={finishes[key] === index}
                  onClick={() => {
                    onChange({ ...finishes, [key]: index });
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <button
        ref={backRef}
        type="button"
        className="customisation-back brand-outline-control navigation-control"
        onClick={onBack}
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
      </button>
    </aside>
  );
}
