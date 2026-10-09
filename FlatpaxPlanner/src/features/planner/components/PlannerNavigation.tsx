import { Link } from 'react-router';
import { paths } from '@/constants/paths';
import homeIcon from '@/assets/icons/boxicons_home-alt.svg';

const plannerSteps = ['Room setup', 'Walls & floors', 'Add items'] as const;
import type { PlannerStep } from '@/features/planner/types';
export type { PlannerStep } from '@/features/planner/types';

interface Props {
  total: number | null;
  projectName: string;
  step: PlannerStep;
  onStepChange: (step: PlannerStep) => void;
  onSave: () => void;
  onItemList: () => void;
}

export function PlannerNavigation({
  projectName,
  step,
  onStepChange,
  onSave,
  onItemList,
  total,
}: Props) {
  const formattedTotal = total === null ? 'Unavailable' : `$${total.toFixed(2)}`;
  return (
    <header className="planner-navigation" data-step={step}>
      <div className="planner-project-heading">
        <Link to={paths.home} className="planner-back" aria-label="Back to planner home">
          <img src={homeIcon} width={24} height={24} alt="" />
        </Link>
        <h1 title={projectName}>{projectName}</h1>
      </div>
      <nav aria-label="Design steps" className="planner-step-navigation">
        <ol>
          {plannerSteps.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                aria-current={step === label ? 'step' : undefined}
                data-complete={index < plannerSteps.indexOf(step)}
                onClick={() => {
                  onStepChange(label);
                }}
              >
                <span className="planner-step-number" aria-hidden="true">
                  {index < plannerSteps.indexOf(step) ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="m3 10 4 4 10-10" stroke="currentColor" strokeWidth="4" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="planner-project-actions">
        <button type="button" className="planner-save" onClick={onSave}>
          Save
        </button>
        <button
          type="button"
          className="planner-item-list"
          aria-label={`Item list, total ${formattedTotal}`}
          onClick={onItemList}
        >
          Item list {formattedTotal}
        </button>
      </div>
    </header>
  );
}
