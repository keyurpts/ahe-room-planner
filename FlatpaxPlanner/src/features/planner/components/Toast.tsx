import '@/styles/toast.css';

export interface ToastProps {
  message: string;
  onClose: () => void;
  open?: boolean;
  closeLabel?: string;
  className?: string;
}

/** A controlled success notification. The caller owns visibility and placement. */
export function Toast({
  message,
  onClose,
  open = true,
  closeLabel = 'Dismiss notification',
  className = '',
}: ToastProps) {
  return (
    <div className={`toast ${className}`} hidden={!open}>
      <svg className="toast-success" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#008C99" />
        <path
          d="m6.888 16.165 5.629 5.442L25.494 9.061"
          fill="none"
          stroke="white"
          strokeWidth="4.16149"
        />
      </svg>
      <span className="toast-message" role="status" aria-atomic="true">
        {open ? message : ''}
      </span>
      <button type="button" className="toast-close" aria-label={closeLabel} onClick={onClose}>
        <svg width="27" height="27" viewBox="0 0 27 27" aria-hidden="true">
          <circle cx="13.5" cy="13.5" r="13.0781" fill="white" />
          <path
            d="m8.5 7.6 5 5.9 5-5.9m-10 11.8 5-5.9 5 5.9"
            fill="none"
            stroke="#008C99"
            strokeWidth="2"
          />
        </svg>
      </button>
    </div>
  );
}