import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SavedDesignDialog } from '@/features/landing/components/SavedDesignDialog';
import layoutIcon from '@/assets/icons/Subtract.svg';
import layoutHoverIcon from '@/assets/icons/Subtract-h.svg';
import newDesignIcon from '@/assets/icons/bi_pencil-square.svg';
import newDesignHoverIcon from '@/assets/icons/bi_pencil-square-h.svg';
import savedDesignIcon from '@/assets/icons/fluent_folder-document-28-regular.svg';
import savedDesignHoverIcon from '@/assets/icons/fluent_folder-document-28-regular-h.svg';
import { PresetLayoutDialog } from '@/features/landing/components/PresetLayoutDialog';
import { NewDesignDialog } from '@/features/landing/components/NewDesignDialog';

const actions = [
  {
    id: 'layout',
    label: 'Use a pre-designed layout',
    icon: layoutIcon,
    hoverIcon: layoutHoverIcon,
    iconSize: 38,
  },
  {
    id: 'new',
    label: 'Start a new design',
    icon: newDesignIcon,
    hoverIcon: newDesignHoverIcon,
    iconSize: 34,
  },
  {
    id: 'saved',
    label: 'Open saved project',
    icon: savedDesignIcon,
    hoverIcon: savedDesignHoverIcon,
    iconSize: 39,
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
