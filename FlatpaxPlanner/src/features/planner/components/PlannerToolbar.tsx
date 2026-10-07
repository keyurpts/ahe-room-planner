import drawIcon from '@/assets/icons/FP-FLOATED-DRAW.svg';
import measureIcon from '@/assets/icons/FP-FLOATED-MEASURES.svg';
import doorIcon from '@/assets/icons/FP-FLOATED-DOOR.svg';
import windowIcon from '@/assets/icons/FP-FLOATED-WINDOW.svg';
import fitIcon from '@/assets/icons/FP-FLOATED-ZOON TO FIT.svg';
import eraseIcon from '@/assets/icons/FP-FLOATED-RUBBER.svg';

const tools = [
  { id: 'draw', label: 'Draw walls', icon: drawIcon },
  { id: 'measure', label: 'Measure room', icon: measureIcon },
  { id: 'door', label: 'Add door', icon: doorIcon },
  { id: 'window', label: 'Add window', icon: windowIcon },
  { id: 'fit', label: 'Zoom to fit', icon: fitIcon },
  { id: 'erase', label: 'Erase', icon: eraseIcon },
] as const;

export type PlannerTool = (typeof tools)[number]['id'];
interface Props {
  selected: PlannerTool | null;
  onSelect: (tool: PlannerTool | null) => void;
  onFit: () => void;
}

export function PlannerToolbar({ selected, onSelect, onFit }: Props) {
  return (
    <div role="group" aria-label="Room setup tools" className="planner-toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          aria-label={tool.label}
          title={tool.label}
          aria-pressed={tool.id === 'fit' ? undefined : selected === tool.id}
          onClick={() => {
            if (tool.id === 'fit') onFit();
            else onSelect(selected === tool.id ? null : tool.id);
          }}
        >
          <img src={tool.icon} width={52} height={52} alt="" />
        </button>
      ))}
    </div>
  );
}
