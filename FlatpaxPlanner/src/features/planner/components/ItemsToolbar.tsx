import move from '@/assets/icons/Group 76.svg';
import rotate from '@/assets/icons/FP-Rotate.svg';
import flip from '@/assets/icons/Group 77.svg';
import images from '@/assets/icons/Group 78.svg';
import remove from '@/assets/icons/Group 79.svg';
import resize from '@/assets/icons/Group 81.svg';
import dimensions from '@/assets/icons/Group 82.svg';
import hide from '@/assets/icons/Group 85.svg';
import view from '@/assets/icons/Group 86.svg';

const tools = [
  { id: 'move', label: 'Move item', icon: move },
  { id: 'rotate', label: 'Rotate item', icon: rotate },
  { id: 'flip', label: 'Flip item', icon: flip },
  { id: 'images', label: 'Item images', icon: images },
  { id: 'remove', label: 'Delete item', icon: remove },
  { id: 'resize', label: 'Resize item', icon: resize },
  { id: 'dimensions', label: 'Item dimensions', icon: dimensions },
  { id: 'hide', label: 'Hide items', icon: hide },
  { id: 'view', label: 'View items', icon: view },
] as const;
export type ItemsTool = (typeof tools)[number]['id'];
interface Props {
  selected: ItemsTool | null;
  onSelect: (tool: ItemsTool | null) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function ItemsToolbar({ selected, onSelect, onRemove, canRemove }: Props) {
  return (
    <div role="group" aria-label="Item editing tools" className="planner-toolbar items-toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          aria-label={tool.label}
          title={tool.label}
          aria-pressed={tool.id === 'remove' ? undefined : selected === tool.id}
          disabled={tool.id === 'remove' && !canRemove}
          onClick={() => {
            if (tool.id === 'remove') onRemove();
            else onSelect(selected === tool.id ? null : tool.id);
          }}
        >
          <img src={tool.icon} width={52} height={52} alt="" />
        </button>
      ))}
    </div>
  );
}
