import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
  };
}

function getScale() {
  // Grow gently beyond the reference viewport instead of matching its full scale.
  const viewportRatio = Math.min(window.innerWidth / 1440, window.innerHeight / 1024);
  return Math.max(1, Math.min(1.35, 1 + (viewportRatio - 1) * 0.3));
}

export function useViewportScale() {
  return useSyncExternalStore(subscribe, getScale, () => 1);
}
