import { Outlet } from 'react-router';

export function AppLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-skip-link focus:rounded-control focus:bg-surface focus:p-3"
      >
        Skip to content
      </a>
      {/* Main defines primary content area of the application */}
      <main id="main-content" tabIndex={-1} className="min-h-svh w-full">
        {/* Outlet is a placeholder component from React Router that renders the matched child route component. In this case, it will render the content of the currently active route defined in the router configuration. */}
        <Outlet />
      </main>
    </>
  );
}
