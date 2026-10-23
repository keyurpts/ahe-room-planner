import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { RouteError } from '@/components/feedback/RouteError';
import { LoadingState } from '@/components/feedback/LoadingState';
import { paths } from '@/constants/paths';

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: LoadingState,
    // pages inside main layout
    children: [
      { path: paths.home, lazy: () => import('@/pages/landing/route') },
      {
        path: paths.planner,
        lazy: () => import('@/pages/planner/route'),
        children: [
          // When the user opens /planner, automatically redirect them to the Room Setup page
          { index: true, element: <Navigate to={paths.roomSetup} replace /> },
          { path: 'room-setup', lazy: () => import('@/pages/room-setup/route') },
          { path: 'design', lazy: () => import('@/pages/design/route') },
        ],
      },
      { path: '*', lazy: () => import('@/pages/not-found/route') },
    ],
  },
]);
