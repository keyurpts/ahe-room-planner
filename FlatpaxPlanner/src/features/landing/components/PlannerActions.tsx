import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SavedDesignDialog } from '@/features/landing/components/SavedDesignDialog';
import { PresetLayoutDialog } from '@/features/landing/components/PresetLayoutDialog';
import { NewDesignDialog } from '@/features/landing/components/NewDesignDialog';
import { actions } from '../utils/actions';

export function PlannerActions() {
  
  const [selectedAction, setSelectedAction] = useState<(typeof actions)[number] | null>(null);

  return (
    <section aria-label="Choose how to begin your design" className="bg-surface">
      <div className="planner-actions mx-auto grid w-full max-w-actions gap-3 px-4 py-3 sm:px-6 xl:px-0">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="brand-outline"
            size="planner"
            className="group planner-action min-h-14 w-full text-action uppercase max-sm:justify-start max-sm:px-4 max-sm:text-left"
            aria-haspopup="dialog"
            aria-expanded={selectedAction?.id === action.id}
            onClick={() => {
              setSelectedAction(action);
            }}
          >
            <img
              src={action.icon}
              width={action.iconSize}
              height={action.iconSize}
              alt=""
              className="shrink-0 group-hover:hidden group-focus-visible:hidden group-active:hidden"
            />
            <img
              src={action.hoverIcon}
              width={action.iconSize}
              height={action.iconSize}
              alt=""
              className="hidden shrink-0 group-hover:block group-focus-visible:block group-active:block"
            />
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
      <SavedDesignDialog
        open={selectedAction?.id === 'saved'}
        onClose={() => {
          setSelectedAction(null);
        }}
      />
      <PresetLayoutDialog
        open={selectedAction?.id === 'layout'}
        onClose={() => {
          setSelectedAction(null);
        }}
      />
      <NewDesignDialog
        open={selectedAction?.id === 'new'}
        onClose={() => {
          setSelectedAction(null);
        }}
      />
    </section>
  );
}
