import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useViewportScale } from '@/hooks/useViewportScale';
import { PlannerViewers } from '@/features/planner/components/PlannerViewers';
import { ItemListDialog } from '@/features/planner/components/ItemListDialog';
import {
  formatModelsSummary,
  type RawModelSummaryItem,
} from '@/features/planner/item-summary';
import { ConfiguratorEventType, Events } from 'wrapper';
import {
  Navigate,
  Outlet,
  useBlocker,
  useBeforeUnload,
  useLocation,
  useNavigate,
} from 'react-router';
import { LeaveDesignDialog } from '@/features/planner/components/LeaveDesignDialog';
import { paths } from '@/constants/paths';
import { SaveDesignDialog } from '@/features/planner/components/SaveDesignDialog';
import {
  discardProject,
  setActiveStep,
  setDesignCode,
  setProjectID,
} from '@/features/planner/state/project-slice';
import { useAppDispatch, useAppSelector } from '@/app/store-hooks';
import {
  createProject,
  updateProject2DJson,
  updateProject3DJson,
} from '@/features/planner/services/project-api';
import {
  PlannerNavigation,
  type PlannerStep,
} from '@/features/planner/components/PlannerNavigation';
import { PlannerToolbar, type PlannerTool } from '@/features/planner/components/PlannerToolbar';
import '@/styles/planner.css';
import { PlannerFinishesControls } from '@/features/planner/components/PlannerFinishesControls';

import { ItemsSidebar } from '@/features/planner/components/ItemsSidebar';
import { ItemsToolbar } from '@/features/planner/components/ItemsToolbar';
import type { CatalogueProduct } from '@/features/planner/catalogue/catalogue';
import '@/styles/items.css';
import {
  ItemCustomisationSidebar,
  type ItemFinishes,
} from '@/features/planner/components/ItemCustomisationSidebar';
import { LeaveDesignDialog2 } from '@/features/planner/components/LeaveDesignDialog2';

export function Component() {

  // states for 2d and 3d canvas div
  const viewer2DRef = useRef<HTMLDivElement>(null);
  const viewer3DRef = useRef<HTMLDivElement>(null);

  // floorplan manager instance
  const floorPlanManager = useAppSelector((state) => state.configurator.floorPlanManager);
  const configuratorCore = useAppSelector((state) => state.configurator.configuratorCore);

  const scale = useViewportScale();

  // project draft state
  const draft = useAppSelector((state) => state.project.draft);
  const projectID = useAppSelector((state) => state.project.projectID);

  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();


  // Drafts are unsaved until a backend confirms a successful save.
  const blocker = useBlocker(
    ({ nextLocation }) =>
      Boolean(draft) &&
      ![paths.planner, paths.roomSetup, paths.design].some(
        (path) => path === nextLocation.pathname,
      ),
  );
  useBeforeUnload((event) => {
    if (draft) {
      event.preventDefault();
    }
  });


  // set the planner step based on the route location
  const step: PlannerStep =
    location.pathname === paths.design
      ? new URLSearchParams(location.search).get('step') === 'items'
        ? 'Add items'
        : 'Walls & floors'
      : 'Room setup';

  // useEffect(() => {
  //   const next: PlannerStep =
  //     location.pathname === paths.design
  //       ? new URLSearchParams(location.search).get('step') === 'items'
  //         ? 'Add items'
  //         : 'Walls & floors'
  //       : 'Room setup';
  //   dispatch(setActiveStep(next));
  // }, [location.pathname, location.search, dispatch]);


  
  const [snapping, setSnapping] = useState(true);                                    // 2D snapping state
  const [tool, setTool] = useState<PlannerTool | null>(null);                        // 2D tools state
  const [transformTool, setTransformTool] = useState<'move' | 'rotate'>('move');      // transform tool state
  const [replaceSelected, setReplaceSelected] = useState(false);                     // replace button state
  
  
  const [customising, setCustomising] = useState(false);                             // customize button in Items Sidebar
  const [itemFinishes, setItemFinishes] = useState<ItemFinishes>({ sink: null, benchtop: null });     // for customize tab
  const [hideWallsSelected, setHideWallsSelected] = useState(false);                 // hide walls button state
  const [finishesOpen, setFinishesOpen] = useState(false);                           // finishes panel state
  // const [selectedProduct, setSelectedProduct] = useState<string | null>('floor-1');

  
  const [panel, setPanel] = useState<'save' | 'items' | null>(null);                 // save or items button state
  const [announcement, setAnnouncement] = useState('');                              // announcement for toast
  const isSavingProject = useRef(false);

  // taking loaded project state from open saved design flow
  const savedProject = location.state?.savedProject;
  
  let p2dJSON, p3dJSON;
  if (savedProject) {
    p2dJSON = savedProject.project2DJson;
    p3dJSON = savedProject.project3DJson;
  }

  // likely for items summary
  const itemCodeLookup = useAppSelector((state) => state.configurator.itemCodeLookup);
  const [rawModels, setRawModels] = useState<readonly RawModelSummaryItem[]>(
    () => configuratorCore?.getModelsSummary().models ?? [],
  );
  useEffect(() => {
    if (!configuratorCore) return;

    const handleSummaryUpdate = (summaryData: { models?: RawModelSummaryItem[] } | null | undefined) => {
      setRawModels(summaryData?.models ?? []);
    };

    Events.on(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, handleSummaryUpdate);

    return () => {
      Events.off(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, handleSummaryUpdate);
    };
  }, [configuratorCore]);
  const summaryRows = useMemo(
    () => formatModelsSummary(rawModels, itemCodeLookup),
    [rawModels, itemCodeLookup],
  );
  //

  function addItem(product: CatalogueProduct) {
    setAnnouncement(`${product.name} selected. Click on the floor to place it.`);
  }
  function removeItem() {
    if (summaryRows.length <= 1) {
      setCustomising(false);
    }
    setAnnouncement('Item removed from the room.');
  }
  function serializeProjectJson(value: unknown): string {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }
  function getExported3DConfig(): Record<string, unknown> {
    const rawConfig = configuratorCore?.export3DConfig() ?? {};
    const result: Record<string, unknown> = { ...rawConfig };
    for (const [key, value] of Object.entries(result)) {
      if (!value || typeof value !== 'object' || key === 'walls' || key === 'floor') continue;
      const baseId = key.replace(/_node\d+$/iu, '');
      const record = value as Record<string, unknown>;
      record.modelData ??= {
        id: baseId,
        name: typeof record.name === 'string' ? record.name : baseId,
        itemCode: itemCodeLookup[baseId] ?? '—',
        format: 'glb',
      };
    }
    return result;
  }

  async function saveProject() {
    if (isSavingProject.current || !draft) return;
    isSavingProject.current = true;

    try {
      if (projectID) {
        const mode = location.pathname === paths.design ? '3d' : '2d';
        if (mode === "2d") {
          const project2DJson = serializeProjectJson(floorPlanManager?.exportJson() ?? {});
          await updateProject2DJson(projectID, project2DJson);
          const project3DJson = serializeProjectJson({});
          await updateProject3DJson(projectID, project3DJson);
        }
        else if (mode === "3d") {
          const project2DJson = serializeProjectJson(floorPlanManager?.exportJson() ?? {});
          await updateProject2DJson(projectID, project2DJson);
          const project3DJson = getExported3DConfig();
          await updateProject3DJson(projectID, project3DJson);
        }
      } else {
        const { id, designCode } = await createProject(draft.projectName);

        const mode = location.pathname === paths.design ? '3d' : '2d';
        if (mode === "2d") {
          const project2DJson = serializeProjectJson(floorPlanManager?.exportJson() ?? {});
          await updateProject2DJson(id, project2DJson);
          const project3DJson = serializeProjectJson({});
          await updateProject3DJson(id, project3DJson);
        }
        else if (mode === "3d") {
          const project2DJson = serializeProjectJson(floorPlanManager?.exportJson() ?? {});
          await updateProject2DJson(id, project2DJson);
          const project3DJson = getExported3DConfig();
          await updateProject3DJson(id, project3DJson);
        }

        dispatch(setProjectID(id));
        dispatch(setDesignCode(designCode));
      }
      setPanel('save');
    } catch (error) {
      console.error(
        'Project save failed:',
        error instanceof Error ? error.message : 'Unknown project save error.',
      );
      setAnnouncement('Unable to save the project. Please try again.');
    } finally {
      isSavingProject.current = false;
    }
  }

  const isRoomDetected = (room: boolean) => {
    console.log(room);
  };

  function changeStep(next: PlannerStep) {
    void Promise.resolve(
      navigate(
        next === 'Room setup'
          ? paths.roomSetup
          : next === 'Add items'
            ? `${paths.design}?step=items`
            : paths.design,
      ),
    )
      .then(async () => {
        // Reset panels after the destination commits so the launcher cannot flash on the old page.
        setCustomising(false);
      })
      .catch(() => {
        setAnnouncement('Unable to change the design step. Please try again.');
      });
  }
  async function nextStep() {
    if (step === 'Room setup') {
      try {
        const success = await floorPlanManager?.switchTo3D(isRoomDetected);
        if (!success) {
          setAnnouncement('Draw a room before continuing to the 3D design.');
          return;
        }
      } catch {
        setAnnouncement('Unable to open the 3D design. Please try again.');
        return;
      }
    } else if (step === 'Walls & floors') {
      configuratorCore?.enableWallColoringMode?.(false);
      configuratorCore?.enableWallTextureMode?.(false);
      configuratorCore?.enableWallMaterialResetMode?.(false);
    }
    changeStep(
      step === 'Room setup'
        ? 'Walls & floors'
        : step === 'Walls & floors'
          ? 'Add items'
          : 'Walls & floors',
    );
  }
  if (!draft) return <Navigate to={paths.home} replace />;
  const total = summaryRows.reduce<number | null>((sum, row) => {
    return sum === null || row.unitPrice === null ? null : sum + row.unitPrice * row.quantity;
  }, 0);

  const [displayLeaveDialog, setDisplayLeaveDialog] = useState(false);

  return (
    <div
      className={`planner-page ${step === 'Add items' ? 'planner-items-page' : ''}`}
      style={{ '--planner-scale': scale } as CSSProperties}
    >
      <PlannerNavigation
        total={total}
        projectName={draft.projectName}
        step={step}
        onStepChange={changeStep}
        onSave={() => {
          void saveProject();
        }}
        onItemList={() => {
          setPanel('items');
        }}
      />
      <div
        className={`planner-workspace ${step === 'Walls & floors' ? 'planner-finishes-workspace' : ''}`}
      >
        <div
          className="planner-sidebar-overlay"
          data-open={step === 'Add items'}
          aria-hidden={step !== 'Add items'}
          inert={step !== 'Add items'}
        >
          <ItemsSidebar
            active={step === 'Add items'}
            onAdd={addItem}
            onSelect={()=> {}}
            selected={null}
            canCustomise={summaryRows.length > 0}
            hidden={customising && summaryRows.length > 0}
            onCustomise={() => {
              setCustomising(true);
            }}
          />
          {customising && summaryRows.length > 0 && (
            <ItemCustomisationSidebar
              finishes={itemFinishes}
              onChange={setItemFinishes}
              onBack={() => {
                setCustomising(false);
                requestAnimationFrame(() => {
                  document.getElementById('catalogue-customise')?.focus();
                });
              }}
            />
          )}
        </div>

        <PlannerViewers
          viewer2DRef={viewer2DRef}
          viewer3DRef={viewer3DRef}
          mode={location.pathname === paths.design ? '3d' : '2d'}
          p2dJSON={p2dJSON}
          p3dJSON={p3dJSON}
        />
        <Outlet />
        {step === 'Walls & floors' && (
          <PlannerFinishesControls
            open={finishesOpen}
            onOpen={() => {
              setFinishesOpen(true);
            }}
            onClose={() => {
              setFinishesOpen(false);
            }}
          />
        )}
        <div
          className={`planner-bottom-controls ${step === 'Walls & floors' ? 'planner-finishes-controls' : step === 'Add items' ? 'planner-items-controls' : ''}`}
        >
          {step === 'Walls & floors' && (
            <button
              type="button"
              className="planner-next planner-stage-back"
              onClick={() => {
                setDisplayLeaveDialog(true);
              }}
            >
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                <path
                  d="M26 10H2m0 0 7-7m-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back - room setup
            </button>
          )}
          {step === 'Room setup' && (
            <PlannerToolbar
              snapping={snapping}
              onSnapChange={setSnapping}
              selected={tool}
              onSelect={setTool}
              onFit={() => {
                setAnnouncement('Zoom to fit will be available when the 2D viewer is connected.');
              }}
            />
          )}
          {step === 'Add items' && (
            <ItemsToolbar
              transformTool={transformTool}
              onTransformToolChange={setTransformTool}
              replaceSelected={replaceSelected}
              onReplaceSelectedChange={setReplaceSelected}
              hideWallsSelected={hideWallsSelected}
              onHideWallsSelectedChange={setHideWallsSelected}
              onCopy={() => {
                console.log('Copy item requested.');
              }}
              onRemove={removeItem}
            />
          )}
          <button
            type="button"
            className={`planner-next ${step === 'Room setup' ? 'room-setup-next' : ''}`}
            onClick={() => {
              void nextStep();
            }}
          >
            {step === 'Room setup'
              ? 'Next - walls & floors'
              : step === 'Walls & floors'
                ? 'Next - add items'
                : 'Back - walls & floors'}
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
              <path
                d={step === 'Add items' ? 'M26 10H2m0 0 7-7m-7 7 7 7' : 'M2 10h24m0 0-7-7m7 7-7 7'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <SaveDesignDialog
        open={panel === 'save'}
        onClose={() => {
          setPanel(null);
        }}
      />
      <LeaveDesignDialog
        open={(blocker.state === 'blocked') || (displayLeaveDialog)}
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset();
          setDisplayLeaveDialog(false);
        }}
        onConfirm={() => {
          if (blocker.state === 'blocked') {
            blocker.proceed();
            dispatch(discardProject());
          }
        }}
      />
      <LeaveDesignDialog2
        open={displayLeaveDialog}
        onCancel={() => {
          setDisplayLeaveDialog(false);
        }}
        onConfirm={() => {
          changeStep('Room setup');
          floorPlanManager?.switchTo2D();
          configuratorCore?.enableWallColoringMode?.(false);
          configuratorCore?.enableWallTextureMode?.(false);
          configuratorCore?.enableWallMaterialResetMode?.(false);
          setDisplayLeaveDialog(false);
        }}
      />
      <ItemListDialog
        open={panel === 'items'}
        onClose={() => {
          setPanel(null);
        }}
        draft={draft}
        rows={summaryRows}
      />
    </div>
  );
}
