import { useAppDispatch } from '@/app/store-hooks';
import { useEffect, type RefObject } from 'react';
import { ConfiguratorCore, FloorplanManager } from 'three-configurator';
import { setConfiguratorCore, setFloorPlanManager } from '../state/configurator-slice';


interface Props {
  viewer2DRef: RefObject<HTMLDivElement | null>;
  viewer3DRef: RefObject<HTMLDivElement | null>;
  mode: '2d' | '3d';
}

export function PlannerViewers({ viewer2DRef, viewer3DRef, mode }: Props) {

  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log('2D viewer ref.current:', viewer2DRef.current);
    console.log('3D viewer ref.current:', viewer3DRef.current);
  }, [viewer2DRef, viewer3DRef, mode]);

  useEffect(() => {
    if (!viewer2DRef.current || !viewer3DRef.current) return;

    const floorPlanManagerInstance = new FloorplanManager();
    floorPlanManagerInstance.init(viewer2DRef.current, viewer3DRef.current);
    const configuratorCoreInstance = floorPlanManagerInstance.getConfiguratorCore() as ConfiguratorCore;
    dispatch(setFloorPlanManager(floorPlanManagerInstance));
    dispatch(setConfiguratorCore(configuratorCoreInstance));
    configuratorCoreInstance!.setBackgroundColor(0xffffff);

    let loadEnvMap = async () => {

      if (configuratorCoreInstance) {
        await configuratorCoreInstance.loadEnvironmentMap(
          "/lebombo_4k.hdr"
          , 0.5
        );
      }
    }
    loadEnvMap();

    return () => {
      // Cleanup on unmount / re-mount
      floorPlanManagerInstance.dispose();
    };
  }, []);

  return (
    <>
      <div
        ref={viewer2DRef}
        className="planner-viewer planner-viewer-2d"
        role="region"
        aria-label="2D room viewer"
        hidden={mode !== '2d'}
      >
      </div>
      <div
        ref={viewer3DRef}
        className="planner-viewer planner-viewer-3d"
        role="region"
        aria-label="3D room viewer"
        hidden={mode !== '3d'}
      >
      </div>
    </>
  );
}
