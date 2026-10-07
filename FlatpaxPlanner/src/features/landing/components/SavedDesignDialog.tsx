import { useId, useRef, useState, type SubmitEvent } from 'react';
import { Button } from '@/components/ui/Button';
import '@/styles/text-input.css';
import { Dialog } from '@/components/ui/Dialog';
import '@/styles/saved-design.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SavedDesignDialog({ open, onClose }: Props) {
  const [code, setCode] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const normalizedCode = code.replace(/\s/g, '').toUpperCase();
  const invalid = attempted && normalizedCode.length !== 6;
  const error = normalizedCode ? 'Enter exactly 6 characters' : 'Enter your design code';

  function close() {
    setCode('');
    setAttempted(false);
    setSubmitted(false);
    onClose();
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (normalizedCode.length !== 6) {
      if (!normalizedCode) setCode('');
      inputRef.current?.focus();
      return;
    }
    setCode(normalizedCode);
    setSubmitted(true);
  }

  return (
    <Dialog
      open={open}
      title="Opened saved project"
      subtitle="Enter your 6-character design code"
      layout="saved-design"
      onClose={close}
      footer={
        <Button
          variant="outline"
          size="compact"
          className="saved-design-back rounded-[0.625rem]! text-base uppercase"
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
      <form className="saved-design-form" onSubmit={submit} noValidate>
        <div className="saved-design-entry">
          <div className="saved-code-field">
            <label htmlFor={id} className="sr-only">
              Design code
            </label>
            <input
              ref={inputRef}
              id={id}
              name="designCode"
              type="text"
              placeholder={invalid ? error : 'ABC 123'}
              value={code}
              required
              aria-invalid={invalid}
              aria-describedby={invalid ? `${id}-error` : `${id}-hint`}
              className="project-name-input design-code-input"
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(event) => {
                setCode(event.target.value);
                setSubmitted(false);
                setAttempted(false);
              }}
            />
            <span id={`${id}-hint`} className="sr-only">
              Enter the six-character code for your saved design.
            </span>
            {invalid && (
              <span id={`${id}-error`} role="alert" className="saved-code-error">
                {error}
              </span>
            )}
          </div>
          <Button
            type="submit"
            size="compact"
            className="load-design-button rounded-[0.625rem]! text-base uppercase"
          >
            Load design
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
              <path
                d="M2 10h24m0 0-7-7m7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
        {submitted && (
          <p role="status" className="saved-design-status">
            Design loading is not available yet.
          </p>
        )}
      </form>
    </Dialog>
  );
}
