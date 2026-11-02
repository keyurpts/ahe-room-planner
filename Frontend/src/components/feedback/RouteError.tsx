import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { paths } from '@/constants/paths';

export function RouteError() {

  // retrieves the error thrown during route loading or rendering
  const error: unknown = useRouteError();


  useEffect(() => {
    console.error('Unable to open page.', error);
  }, [error]);


  // For a React Router 404 response, it displays a not-found message.
  // For other errors, it displays a general page-loading error.
  const message =
    isRouteErrorResponse(error) && error.status === 404
      ? 'The requested page does not exist.'
      : 'The page could not be loaded. Please try again.';

  return (
    <main className="p-6" aria-labelledby="route-error-title">
      <h1 id="route-error-title" className="text-heading font-semibold">
        Unable to open page
      </h1>
      <p role="alert" className="mt-3 text-muted">
        {message}
      </p>
      {/* detailed error message appears only in development mode */}
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="mt-3 whitespace-pre-wrap">{error.message}</pre>
      )}
      <a href={paths.home} className="mt-4 inline-block text-brand underline">
        Return home
      </a>
    </main>
  );
}