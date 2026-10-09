import { useRef } from 'react';
import { FinishesPanel } from '@/features/planner/components/FinishesPanel';
import customiseIcon from '@/assets/icons/FP-FLOATED-CUSTOMISE.svg';
import { useAppSelector } from '@/app/store-hooks';

interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function PlannerFinishesControls({ open, onOpen, onClose }: Props) {
  const launcher = useRef<HTMLButtonElement>(null);
  const configuratorCore = useAppSelector((state) => state.configurator.configuratorCore);

  return (
    <>
      <button
        ref={launcher}
        type="button"
        id="open-finishes"
        className="open-finishes-button"
        aria-label="Open floor and wall finishes"
        aria-haspopup="dialog"
        aria-expanded={open}
        hidden={open}
        onClick={onOpen}
      >
        <img src={customiseIcon} width={114} height={114} alt="" />
      </button>
      <FinishesPanel
        open={open}
        onClose={() => {
          onClose();
          requestAnimationFrame(() => {
            launcher.current?.focus();
          });
          configuratorCore?.enableWallColoringMode?.(false);
          configuratorCore?.enableWallTextureMode?.(false);
          configuratorCore?.enableWallMaterialResetMode?.(false);
        }}
      />
    </>
  );
}
