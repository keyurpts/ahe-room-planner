import { useEffect, type RefObject } from 'react';

interface Props {
  viewer2DRef: RefObject<HTMLDivElement | null>;
  viewer3DRef: RefObject<HTMLDivElement | null>;
  mode: '2d' | '3d';
}

export function PlannerViewers({ viewer2DRef, viewer3DRef, mode }: Props) {
  useEffect(() => {
    console.log('2D viewer ref.current:', viewer2DRef.current);
    console.log('3D viewer ref.current:', viewer3DRef.current);
  }, [viewer2DRef, viewer3DRef, mode]);

  return (
    <>
      <div
        ref={viewer2DRef}
        className="planner-viewer planner-viewer-2d"
        role="region"
        aria-label="2D room viewer"
        hidden={mode !== '2d'}
      >
        <p className="planner-viewer-label">2D room setup viewer</p>
      </div>
      <div
        ref={viewer3DRef}
        className="planner-viewer planner-viewer-3d"
        role="region"
        aria-label="3D room viewer"
        hidden={mode !== '3d'}
      >
        <p className="planner-viewer-label">3D design viewer</p>
      </div>
    </>
  );
}
