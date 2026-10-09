import move from '@/assets/icons/move.svg';
import rotate from '@/assets/icons/rotate.svg';
import flip from '@/assets/icons/swap.svg';
import images from '@/assets/icons/duplicate.svg';
import remove from '@/assets/icons/delete.svg';
import hide from '@/assets/icons/wall-hide.svg';
import view from '@/assets/icons/camera.svg';
import measure from '@/assets/icons/measure.svg';
import { Fragment, useState } from 'react';
import { LengthUnit, type ConfiguratorCore } from 'three-configurator';
import { useAppSelector } from '@/app/store-hooks';
import { ToolbarDropdown, type DropdownGroup } from '@/components/ui/ToolbarDropdown';
import { UnitSelector } from '@/features/planner/components/UnitSelector';

import moveHover from '@/assets/icons/move-h.svg';
import rotateHover from '@/assets/icons/rotate-h.svg';
import swapHover from '@/assets/icons/swap-h.svg';
import duplicateHover from '@/assets/icons/duplicate-h.svg';
import deleteHover from '@/assets/icons/delete-h.svg';
import wallhideHover from '@/assets/icons/wall-hide-h.svg';
import cameraHover from '@/assets/icons/camera-h.svg';
import measureHover from '@/assets/icons/measure-h.svg';

type MeasurementMode = 'nearby' | 'walls' | 'all' | 'selected';
type CameraMode = 'orthographic' | 'perspective';
const measurementGroups: readonly DropdownGroup<MeasurementMode>[] = [
  {
    label: 'Measurements',
    options: [
      { value: 'nearby', label: 'Item to Item/Wall' },
      { value: 'walls', label: 'Item to Wall' },
      { value: 'all', label: 'All Measurement' },
      { value: 'selected', label: 'Selected Items' },
    ],
  },
];
const cameraGroups: readonly DropdownGroup<CameraMode>[] = [
  {
    label: 'Projection',
    options: [
      { value: 'orthographic', label: 'Orthographic' },
      { value: 'perspective', label: 'Perspective' },
    ],
  },
];
const tools = [
  { id: 'move', label: 'Move item', icon: move, hoverIcon: moveHover },
  { id: 'rotate', label: 'Rotate item', icon: rotate, hoverIcon: rotateHover },
  { id: 'replace', label: 'Replace item', icon: flip, hoverIcon: swapHover },
  { id: 'copy', label: 'Copy item', icon: images, hoverIcon: duplicateHover },

  { id: 'hidewalls', label: 'Hide walls', icon: hide, hoverIcon: wallhideHover },
] as const;
export type ItemsTool = (typeof tools)[number]['id'];
type TransformTool = Extract<ItemsTool, 'move' | 'rotate'>;
interface Props {
  transformTool: TransformTool;
  onTransformToolChange: (tool: TransformTool) => void;
  replaceSelected: boolean;
  onReplaceSelectedChange: (selected: boolean) => void;
  hideWallsSelected: boolean;
  onHideWallsSelectedChange: (selected: boolean) => void;
  onCopy: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

function configureMeasurements(core: ConfiguratorCore, mode: MeasurementMode | null) {
  core.clearAllMeasurements();
  core.measurementState = {
    isActive: mode !== null,
    isWallsOnly: mode === 'walls',
    isObjectToObject: false,
  };
}

export function ItemsToolbar({
  transformTool,
  onTransformToolChange,
  replaceSelected,
  onReplaceSelectedChange,
  hideWallsSelected,
  onHideWallsSelectedChange,
  onCopy,
  onRemove,
  canRemove,
}: Props) {
  const core = useAppSelector((state) => state.configurator.configuratorCore);
  const manager = useAppSelector((state) => state.configurator.floorPlanManager);
  const [measurement, setMeasurement] = useState<MeasurementMode | null>(null);
  const [camera, setCamera] = useState<CameraMode>('perspective');
  const [unit, setUnit] = useState(() => manager?.getLengthUnit() ?? LengthUnit.MM);
  const [message, setMessage] = useState('');
  function changeMeasurement(mode: MeasurementMode | null) {
    setMeasurement(mode);
    if (!core) {
      setMessage('The viewer is not ready.');
      return;
    }
    configureMeasurements(core, mode);
    if (mode === null) {
      setMessage('Measurements disabled.');
      return;
    }
    if (mode === 'all') {
      core.showAllMeasurements();
      setMessage('All measurements enabled.');
    } else if (mode === 'selected' && !core.isModelSelected()) {
      setMessage('Select an item in the viewer to show its measurements.');
    } else {
      const applied = core.toggleMeasurement();
      setMessage(
        applied
          ? 'Measurement mode updated.'
          : 'Select or place an item in the viewer to show measurements.',
      );
    }
  }
  function changeCamera(mode: CameraMode) {
    if (!core) {
      setMessage('The viewer is not ready.');
      return;
    }
    // The SDK accepts these values but does not export its CameraTypes enum at runtime.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
    core.setCameraType(mode as Parameters<ConfiguratorCore['setCameraType']>[0]);
    setCamera(mode);
  }
  return (
    <div role="group" aria-label="Item editing tools" className="planner-toolbar items-toolbar">
      {tools.map((tool) => (
        <Fragment key={tool.id}>
          <button
            type="button"
            aria-label={tool.label}
            title={tool.label}
            aria-pressed={
              tool.id === 'move' || tool.id === 'rotate'
                ? transformTool === tool.id
                : tool.id === 'replace'
                  ? replaceSelected
                  : tool.id === 'hidewalls'
                    ? hideWallsSelected
                    : undefined
            }

            onClick={() => {
              if (tool.id === 'move' || tool.id === 'rotate') onTransformToolChange(tool.id);
              else if (tool.id === 'replace') onReplaceSelectedChange(!replaceSelected);
              else if (tool.id === 'copy') onCopy();
              else onHideWallsSelectedChange(!hideWallsSelected);
            }}
          >
            <img src={tool.icon} width={52} height={52} alt="" className="item-tool-default" />
            <img src={tool.hoverIcon} width={52} height={52} alt="" className="item-tool-hover" />
          </button>
          {tool.id === 'copy' && (
            <ToolbarDropdown
              value={measurement}
              onChange={changeMeasurement}
              onClear={() => {
                changeMeasurement(null);
              }}
              groups={measurementGroups}
              label="Measurement types"
              triggerContent={
                <>
                  <img src={measure} width={52} height={52} alt="" className="item-tool-default" />
                  <img
                    src={measureHover}
                    width={52}
                    height={52}
                    alt=""
                    className="item-tool-hover"
                  />
                </>
              }
            />
          )}
        </Fragment>
      ))}
      <ToolbarDropdown
        value={camera}
        onChange={changeCamera}
        groups={cameraGroups}
        label="Camera view"
        triggerContent={
          <>
            <img src={view} width={52} height={52} alt="" className="item-tool-default" />
            <img src={cameraHover} width={52} height={52} alt="" className="item-tool-hover" />
          </>
        }
      />
      <button
        type="button"
        aria-label="Delete item"
        title="Delete item"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <img src={remove} width={52} height={52} alt="" className="item-tool-default" />
        <img src={deleteHover} width={52} height={52} alt="" className="item-tool-hover" />
      </button>
      <UnitSelector
        unit={unit}
        onChange={(next) => {
          manager?.setLengthUnit(next);
          setUnit(next);
        }}
      />
      <p className="sr-only" role="status">
        {message}
      </p>
    </div>
  );
}
