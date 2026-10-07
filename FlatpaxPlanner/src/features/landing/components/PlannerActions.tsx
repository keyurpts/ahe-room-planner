import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SavedDesignDialog } from '@/features/landing/components/SavedDesignDialog';
import layoutIcon from '@/assets/icons/pre-designed-layout.svg';
import newDesignIcon from '@/assets/icons/new-design.svg';
import savedDesignIcon from '@/assets/icons/saved-design.svg';
import { PresetLayoutDialog } from '@/features/landing/components/PresetLayoutDialog';
import { NewDesignDialog } from '@/features/landing/components/NewDesignDialog';

const actions = [
  {
    id: 'layout',
    label: 'Use a pre-designed layout',
    icon: layoutIcon,
    iconSize: 38,
    variant: 'outline',
  },
  {
    id: 'new',
    label: 'Start a new design',
    icon: newDesignIcon,
    iconSize: 34,
    variant: 'outline',
  },
  {
    id: 'saved',
    label: 'Open a saved design',
    icon: savedDesignIcon,
    iconSize: 39,
    variant: 'primary',
  },
] as const;

export function PlannerActions() {
  const [selectedAction, setSelectedAction] = useState<(typeof actions)[number] | null>(null);

  return (
    <section aria-label="Choose how to begin your design" className="bg-surface">
      <div className="planner-actions mx-auto grid w-full max-w-actions gap-3 px-4 py-3 sm:px-6 xl:px-0">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
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
              className="shrink-0 group-active:brightness-0 group-active:invert group-aria-expanded:brightness-0 group-aria-expanded:invert"
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
