import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import '@/styles/leave-design.css';

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LeaveDesignDialog({ open, onCancel, onConfirm }: Props) {
  return (
    <Dialog
      open={open}
      title="Go back"
      layout="leave-design"
      hideCloseButton
      onClose={onCancel}
      footer={
        <>
          <Button variant="brand-outline" autoFocus onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>OK</Button>
        </>
      }
    >
      <div className="leave-design-message">
        <p>Are you sure you want to go back?</p>
        <p>All current changes will be lost.</p>
      </div>
    </Dialog>
  );
}
