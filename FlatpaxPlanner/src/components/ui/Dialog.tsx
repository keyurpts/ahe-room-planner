import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import closeIcon from '@/assets/icons/Close.svg';
import { useViewportScale } from '@/hooks/useViewportScale';

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  layout?:
    | 'default'
    | 'preset'
    | 'new-design'
    | 'saved-design'
    | 'room-shape'
    | 'item-list'
    | 'save-design'
    | 'leave-design';
  hideCloseButton?: boolean;
  subtitle?: string;

  footer?: ReactNode;
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  layout = 'default',
  footer,
  subtitle,
  hideCloseButton = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scale = useViewportScale();
  const titleId = useId();
  const contentId = useId();
  const previousLayout = useRef(layout);

  useEffect(() => {
    if (open && previousLayout.current !== layout) {
      dialogRef.current?.querySelector('h2')?.focus();
    }
    previousLayout.current = layout;
  }, [layout, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      style={{ zoom: scale, maxHeight: `calc(100svh / ${String(scale)} - 2rem)` }}
      aria-labelledby={titleId}
      aria-describedby={layout === 'default' || subtitle ? contentId : undefined}
      className={`app-dialog m-auto bg-surface p-0 shadow-panel ${layout !== 'default' ? `${layout}-dialog text-black` : 'w-[calc(100%-2rem)] max-w-lg rounded-panel text-foreground backdrop:bg-black/45'}`}
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      {layout !== 'default' ? (
        <>
          <header className={`${layout}-dialog-header`}>
            <div>
              <h2
                id={titleId}
                tabIndex={-1}
                className={
                  layout === 'item-list'
                    ? 'text-xl font-bold uppercase focus:outline-none'
                    : `text-preset-title uppercase focus:outline-none ${layout === 'new-design' ? 'font-design-heading' : 'font-extrabold'}`
                }
              >
                {title}
              </h2>
              {subtitle && (
                <p id={contentId} className="dialog-subtitle">
                  {subtitle}
                </p>
              )}
            </div>
            {layout !== 'saved-design' && !hideCloseButton && (
              <button
                type="button"
                aria-label={
                  layout === 'save-design'
                    ? 'Close save design'
                    : layout === 'item-list'
                      ? 'Close item list'
                      : layout === 'preset'
                        ? 'Close preset layouts'
                        : layout === 'room-shape'
                          ? 'Close room shapes'
                          : 'Close new design'
                }
                className={
                  layout === 'item-list'
                    ? 'item-list-close'
                    : 'preset-close rounded-full hover:bg-brand-subtle active:bg-brand-soft'
                }
                onClick={onClose}
              >
                {layout === 'item-list' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="white" />
                    <path d="m8 8 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <img src={closeIcon} width={30} height={30} alt="" />
                )}
              </button>
            )}
          </header>
          {children}
          <footer className={`${layout}-dialog-footer`}>{footer}</footer>
        </>
      ) : (
        <div className="p-6 sm:p-8">
          <h2 id={titleId} className="text-xl font-bold sm:text-2xl">
            {title}
          </h2>
          <div id={contentId} className="mt-4 leading-relaxed text-muted">
            {children}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
