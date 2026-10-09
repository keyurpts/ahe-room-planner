import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useViewportScale } from '@/hooks/useViewportScale';
import { PlannerViewers } from '@/features/planner/components/PlannerViewers';
import { ItemListDialog } from '@/features/planner/components/ItemListDialog';
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
import { discardProject, setActiveStep } from '@/features/planner/state/project-slice';
import { useAppDispatch, useAppSelector } from '@/app/store-hooks';
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

export function Component() {
  const viewer2DRef = useRef<HTMLDivElement>(null);
  const viewer3DRef = useRef<HTMLDivElement>(null);
  const scale = useViewportScale();
  const draft = useAppSelector((state) => state.project.draft);
  const regionId = useAppSelector((state) => state.ui.regionId);
  const dispatch = useAppDispatch();
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

  const location = useLocation();
  const navigate = useNavigate();
  const step: PlannerStep =
    location.pathname === paths.design
      ? new URLSearchParams(location.search).get('step') === 'items'
        ? 'Add items'
        : 'Walls & floors'
      : 'Room setup';
  const floorPlanManager = useAppSelector((state) => state.configurator.floorPlanManager);
  useEffect(() => {
    const next: PlannerStep =
      location.pathname === paths.design
        ? new URLSearchParams(location.search).get('step') === 'items'
          ? 'Add items'
          : 'Walls & floors'
        : 'Room setup';
    dispatch(setActiveStep(next));
  }, [location.pathname, location.search, dispatch]);
  const [snapping, setSnapping] = useState(true);
  const [tool, setTool] = useState<PlannerTool | null>(null);
  const [panel, setPanel] = useState<'save' | 'items' | null>(null);
  const [finishesOpen, setFinishesOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<string | null>('floor-1');
  const [transformTool, setTransformTool] = useState<'move' | 'rotate'>('move');
  const [replaceSelected, setReplaceSelected] = useState(false);
  const [hideWallsSelected, setHideWallsSelected] = useState(false);
  const [customising, setCustomising] = useState(false);
  const [itemFinishes, setItemFinishes] = useState<ItemFinishes>({ sink: null, benchtop: null });
  const [items, setItems] = useState<readonly { product: CatalogueProduct; quantity: number }[]>(
    [],
  );
  function addItem(product: CatalogueProduct) {
    setItems((current) =>
      current.some((item) => item.product.id === product.id)
        ? current.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...current, { product, quantity: 1 }],
    );
    setAnnouncement(`${product.name} added to the item list.`);
  }
  function removeItem() {
    if (items.length === 1 && items[0]?.product.id === selectedProduct && items[0].quantity === 1) {
      setCustomising(false);
    }
    setItems((current) =>
      current.flatMap((item) =>
        item.product.id !== selectedProduct
          ? [item]
          : item.quantity > 1
            ? [{ ...item, quantity: item.quantity - 1 }]
            : [],
      ),
    );
    setAnnouncement('Item removed from the item list.');
  }

  const isRoomDetected = (room: boolean) => {
    console.log(room);
  }

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

        if (next === 'Walls & floors') {
          const success = await floorPlanManager?.switchTo3D(isRoomDetected);
          console.log("success : ", success);
        }
        if (next === "Room setup") {
          floorPlanManager?.switchTo2D();
        }
      })
      .catch(() => {
        setAnnouncement('Unable to change the design step. Please try again.');
      });
  }
  async function nextStep() {
    if (step === 'Room setup') {
      try {
        const success = await floorPlanManager?.switchTo3D();
        if (!success) {
          setAnnouncement('Draw a room before continuing to the 3D design.');
          return;
        }
      } catch {
        setAnnouncement('Unable to open the 3D design. Please try again.');
        return;
      }
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
  const total = items.reduce<number | null>((sum, item) => {
    const region = item.product.regions.find((value) => value.regionId === regionId);
    return sum === null || !region ? null : sum + region.price * item.quantity;
  }, 0);

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
          setPanel('save');
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
            onSelect={setSelectedProduct}
            selected={selectedProduct}
            canCustomise={items.length > 0}
            hidden={customising && items.length > 0}
            onCustomise={() => {
              setCustomising(true);
            }}
          />
          {customising && items.length > 0 && (
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
                changeStep('Room setup');
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
              canRemove={items.some((item) => item.product.id === selectedProduct)}
            />
          )}
          <button
            type="button"
            className="planner-next"
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
        open={blocker.state === 'blocked'}
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset();
        }}
        onConfirm={() => {
          if (blocker.state === 'blocked') {
            blocker.proceed();
            dispatch(discardProject());
          }
        }}
      />
      <ItemListDialog
        open={panel === 'items'}
        onClose={() => {
          setPanel(null);
        }}
        draft={draft}
        rows={items.map(({ product, quantity }) => ({
          id: product.id,
          description: product.name,
          itemCode:
            product.regions.find((region) => region.regionId === regionId)?.itemNumber ??
            product.skuNumber,
          quantity,
          unitPrice: product.regions.find((region) => region.regionId === regionId)?.price ?? null,
        }))}
      />
    </div>
  );
}
