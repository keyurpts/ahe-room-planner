import { isRouteErrorResponse, useRouteError } from 'react-router';
import { paths } from '@/constants/paths';

export function RouteError() {
  const error: unknown = useRouteError();
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
      <a href={paths.home} className="mt-4 inline-block text-brand underline">
        Return home
      </a>
    </main>
  );
}
