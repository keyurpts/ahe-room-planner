import { RouterProvider } from 'react-router';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { router } from '@/app/routes/router';

// application staring point, it renders the router provider with the defined routes and error boundary
export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
