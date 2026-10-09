import drawIcon from '@/assets/icons/draw.svg';
import deleteIcon from '@/assets/icons/delete.svg';
import { useState } from 'react';
import { LengthUnit } from 'three-configurator';
import doorIcon from '@/assets/icons/door.svg';
import windowIcon from '@/assets/icons/window.svg';
import fitIcon from '@/assets/icons/zoom-fit.svg';
import eraseIcon from '@/assets/icons/clear.svg';
import { useAppSelector } from '@/app/store-hooks';
import { UnitSelector } from '@/features/planner/components/UnitSelector';

import drawHover from '@/assets/icons/draw-h.svg';
import deleteHover from '@/assets/icons/delete-h.svg';
import doorHover from '@/assets/icons/door-h.svg';
import windowHover from '@/assets/icons/window-h.svg';
import fitHover from '@/assets/icons/zoom-fit-h.svg';
import clearHover from '@/assets/icons/clear-h.svg';
import snapIcon from '@/assets/icons/snap.svg';
import snapHover from '@/assets/icons/snap-h.svg';

const tools = [
  { id: 'draw', label: 'Draw walls', icon: drawIcon, hoverIcon: drawHover },
  { id: 'snap', label: 'Snap drawing', icon: snapIcon, hoverIcon: snapHover },

  { id: 'door', label: 'Add door', icon: doorIcon, hoverIcon: doorHover },
  { id: 'window', label: 'Add window', icon: windowIcon, hoverIcon: windowHover },
  { id: 'fit', label: 'Zoom to fit', icon: fitIcon, hoverIcon: fitHover },
  { id: 'erase', label: 'Clear', icon: eraseIcon, hoverIcon: clearHover },
  { id: 'delete', label: 'Delete selected element', icon: deleteIcon, hoverIcon: deleteHover },
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
            <img src={tool.icon} width={52} height={52} alt="" className="room-tool-default" />
            <img src={tool.hoverIcon} width={52} height={52} alt="" className="room-tool-hover" />
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
