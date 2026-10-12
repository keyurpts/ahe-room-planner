import { useAppDispatch, useAppSelector } from '@/app/store-hooks';
import { useEffect, type RefObject } from 'react';
import { FloorplanManager, Predefined2DShapes } from 'three-configurator';
import { setConfiguratorCore, setFloorPlanManager } from '../state/configurator-slice';

interface Props {
  viewer2DRef: RefObject<HTMLDivElement | null>;
  viewer3DRef: RefObject<HTMLDivElement | null>;
  mode: '2d' | '3d';
}

export function PlannerViewers({ viewer2DRef, viewer3DRef, mode }: Props) {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.project.draft);
  const floorplanManager = useAppSelector((state) => state.configurator.floorPlanManager);


  useEffect(() => {
    console.log('2D viewer ref.current:', viewer2DRef.current);
    console.log('3D viewer ref.current:', viewer3DRef.current);
  }, [viewer2DRef, viewer3DRef, mode]);

  useEffect(() => {
    if (!viewer2DRef.current || !viewer3DRef.current) return;

    const floorPlanManagerInstance = new FloorplanManager();
    floorPlanManagerInstance.init(viewer2DRef.current, viewer3DRef.current);
    const configuratorCoreInstance = floorPlanManagerInstance.getConfiguratorCore();
    if (!configuratorCoreInstance) {
      floorPlanManagerInstance.dispose();
      return;
    }
    dispatch(setFloorPlanManager(floorPlanManagerInstance));
    dispatch(setConfiguratorCore(configuratorCoreInstance));
    configuratorCoreInstance.setBackgroundColor(0xffffff);

    void configuratorCoreInstance
      .loadEnvironmentMap('/lebombo_4k.hdr', 0.5)
      .catch((error: unknown) => {
        console.error('Unable to load the viewer environment map.', error);
      });

    return () => {
      // Cleanup on unmount / re-mount
      floorPlanManagerInstance.dispose();
      dispatch(setFloorPlanManager(null));
      dispatch(setConfiguratorCore(null));
    };
  }, [dispatch, viewer2DRef, viewer3DRef]);

  useEffect(() => {

    if (floorplanManager && draft && draft.shape !== "custom") {
      if (draft.shape === "rectangle") {
        floorplanManager.addPredefinedShape(Predefined2DShapes.RECTANGLE);
      }
      else if (draft.shape === "square") {
        floorplanManager.addPredefinedShape(Predefined2DShapes.SQUARE);
      }
      else {
        floorplanManager.addPredefinedShape(Predefined2DShapes.L_SHAPE);
      }
    }

  }, [draft?.shape, floorplanManager])

  return (
    <>
      <div
        ref={viewer2DRef}
        className="planner-viewer planner-viewer-2d"
        role="region"
        aria-label="2D room viewer"
        data-active={mode === '2d'}
        aria-hidden={mode !== '2d'}
        inert={mode !== '2d'}
      ></div>
      <div
        ref={viewer3DRef}
        className="planner-viewer planner-viewer-3d"
        role="region"
        aria-label="3D room viewer"
        data-active={mode === '3d'}
        aria-hidden={mode !== '3d'}
        inert={mode !== '3d'}
      ></div>
    </>
  );
}
