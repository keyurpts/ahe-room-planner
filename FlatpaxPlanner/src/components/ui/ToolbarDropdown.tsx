import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import '@/styles/toolbar-dropdown.css';

export interface DropdownGroup<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
}
interface Props<T extends string> {
  value: T | null;
  onChange: (value: T) => void;
  onClear?: () => void;
  groups: readonly DropdownGroup<T>[];
  label: string;
  triggerContent: ReactNode;
  disabled?: boolean;
}
export function ToolbarDropdown<T extends string>({
  value,
  onChange,
  onClear,
  groups,
  label,
  triggerContent,
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [alignStart, setAlignStart] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  function showMenu() {
    const element = container.current;
    if (element) {
      const bounds = element.getBoundingClientRect();
      const scale = bounds.width / element.offsetWidth;
      const menuWidth = 13 * parseFloat(getComputedStyle(element).fontSize) * scale;
      setAlignStart(bounds.right < menuWidth + 16);
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const initialOption =
      container.current?.querySelector<HTMLInputElement>('input:checked') ??
      container.current?.querySelector<HTMLInputElement>('input');
    initialOption?.focus();
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
    };
  }, [open]);
  return (
    <div
      className="toolbar-dropdown-control"
      ref={container}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
          setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-pressed={onClear ? value !== null : undefined}
        aria-controls={id}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => {
          if (open) setOpen(false);
          else showMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            showMenu();
          }
        }}
      >
        <span className="toolbar-dropdown-symbol">
          {triggerContent}
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="m1 1 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          id={id}
          className="toolbar-dropdown-menu"
          data-align-start={alignStart}
          role="dialog"
          aria-label={label}
        >
          <p className="toolbar-dropdown-menu-title">{label}</p>
          {groups.map((group) => (
            <fieldset key={group.label} className="toolbar-dropdown-group">
              <legend>{group.label}</legend>
              {group.options.map((option) => (
                <label
                  key={option.value}
                  className="toolbar-dropdown-option"
                  onPointerDown={(event) => {
                    event.preventDefault();
                  }}
                >
                  <input
                    type={onClear ? 'checkbox' : 'radio'}
                    className="sr-only"
                    name={id}
                    value={option.value}
                    checked={value === option.value}
                    disabled={disabled}
                    onChange={(event) => {
                      if (onClear && !event.currentTarget.checked) onClear();
                      else onChange(option.value);
                      setOpen(false);
                      trigger.current?.focus();
                    }}
                  />
                  <span>{option.label}</span>
                  <span aria-hidden="true">{value === option.value ? '✓' : ''}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}
