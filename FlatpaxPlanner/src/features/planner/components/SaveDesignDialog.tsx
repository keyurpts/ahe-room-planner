import { useId, useState, type SubmitEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import '@/styles/save-design.css';
import { useAppSelector } from '@/app/store-hooks';

interface SaveDesignDialogProps {
  open: boolean;
  onClose: () => void;
  designCode?: string;
}

export function SaveDesignDialog({ open, onClose }: SaveDesignDialogProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState('');

  const code = useAppSelector((state) => state.project.designCode);
  const designCode = code ? code : 'RP7N4L';

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(designCode);
      setStatus(
        designCode
          ? 'Code copied.'
          : 'Error while copying code',
      );
    } catch {
      setStatus('Unable to copy. Select the code and copy it manually.');
    }
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Email delivery will be available when the backend is connected.');
  }
  return (
    <Dialog
      open={open}
      title="Save design"
      subtitle="Your design code is"
      layout="save-design"
      onClose={() => {
        setStatus('');
        onClose();
      }}
    >
      <section className="save-design-code-section" aria-label="Design code">
        <p className="save-design-code">{designCode}</p>
        {!designCode && <p className="sr-only">Sample design code for preview only.</p>}
        <Button
          variant="brand-outline"
          onClick={() => {
            void copyCode();
          }}
        >
          Copy code
        </Button>
      </section>
      <form onSubmit={submit}>
        <div className="save-design-email-section">
          <h3>Email design code</h3>
          <label className="sr-only" htmlFor={`${id}-email`}>
            Enter your email address
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setStatus('');
            }}
            placeholder="Enter your email address"
          />
        </div>
        <div className="save-design-send-section">
          <label className="save-design-terms">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
              }}
            />
            <span>
              These Terms of Use (“Terms”) govern your access to and use of our website. Please
              carefully read these Terms and contact us if you have any questions. By accessing or
              using our website you agree to these Terms and our Privacy Policy.
            </span>
          </label>
          <Button type="submit" size="planner">
            Send code to email
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
          <p className="save-design-status" role="status">
            {status}
          </p>
        </div>
      </form>
    </Dialog>
  );
}
