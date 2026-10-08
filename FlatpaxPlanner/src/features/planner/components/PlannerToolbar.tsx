import drawIcon from '@/assets/icons/FP-FLOATED-DRAW.svg';
import deleteIcon from '@/assets/icons/Group 79.svg';
import { useState } from 'react';
import { LengthUnit } from 'three-configurator';
import doorIcon from '@/assets/icons/FP-FLOATED-DOOR.svg';
import windowIcon from '@/assets/icons/FP-FLOATED-WINDOW.svg';
import fitIcon from '@/assets/icons/FP-FLOATED-ZOON TO FIT.svg';
import eraseIcon from '@/assets/icons/FP-FLOATED-RUBBER.svg';
import { useAppSelector } from '@/app/store-hooks';
import { UnitSelector } from '@/features/planner/components/UnitSelector';

const tools = [
  { id: 'draw', label: 'Draw walls', icon: drawIcon },
  { id: 'snap', label: 'Snap drawing', icon: null },
  { id: 'delete', label: 'Delete selected element', icon: deleteIcon },
  { id: 'door', label: 'Add door', icon: doorIcon },
  { id: 'window', label: 'Add window', icon: windowIcon },
  { id: 'fit', label: 'Zoom to fit', icon: fitIcon },
  { id: 'erase', label: 'Erase', icon: eraseIcon },
] as const;

export type PlannerTool = (typeof tools)[number]['id'];
interface Props {
  snapping: boolean;
  onSnapChange: (enabled: boolean) => void;
  selected: PlannerTool | null;
  onSelect: (tool: PlannerTool | null) => void;
  onFit: () => void;
}

export function PlannerToolbar({ selected, onSelect, onFit, snapping, onSnapChange }: Props) {
  const floorPlanManager = useAppSelector((state) => state.configurator.floorPlanManager);

  const [isMeasurementActive, setIsMeasurementActive] = useState<boolean>(true);
  const [isWindowModeActive, setisWindowModeActive] = useState<boolean>(false);
  const [isDoorModeActive, setisDoorModeActive] = useState<boolean>(false);


  const [unit, setUnit] = useState(() => floorPlanManager?.getLengthUnit() ?? LengthUnit.MM);
  return (
    <div role="group" aria-label="Room setup tools" className="planner-toolbar room-setup-toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          aria-label={tool.label}
          title={tool.label}
          aria-pressed={
            tool.id === 'snap'
              ? snapping
              : tool.id === 'fit' || tool.id === 'delete' || tool.id === 'erase'
                ? undefined
                : selected === tool.id
          }
          onClick={() => {
            if (tool.id === 'snap') {
              floorPlanManager?.enableSnapping(!snapping);
              onSnapChange(!snapping);
              return;
            }
            if (tool.id === 'delete') {
              floorPlanManager?.deleteSelectedEntity();
              return;
            }
            if (tool.id === 'fit') {
              if (floorPlanManager) floorPlanManager.fitToView();
              else onFit();
              return;
            }
            if (tool.id === 'draw') floorPlanManager?.set2DMode('Draw', true);
            else if (tool.id === 'door') floorPlanManager?.set2DMode('Door', true);
            else if (tool.id === 'window') floorPlanManager?.set2DMode('Window', true);
            else floorPlanManager?.clear2DLayout();
            onSelect(selected === tool.id ? null : tool.id);
          }}
        >
          <span className="planner-tool-icon">
            {tool.icon ? (
              <img src={tool.icon} width={52} height={52} alt="" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 4v8a7 7 0 0 0 14 0V4h-4v8a3 3 0 0 1-6 0V4H5Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path d="M5 8h4m6 0h4" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            )}
          </span>
        </button>
      ))}
      <UnitSelector
        unit={unit}
        onChange={(next) => {
          floorPlanManager?.setLengthUnit(next);
          setUnit(next);
        }}
      />
    </div>
  );
}
