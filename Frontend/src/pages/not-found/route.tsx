import { Link } from 'react-router';
import { paths } from '@/constants/paths';

export function Component() {
  return (
    <section aria-labelledby="not-found-title" className="mx-auto max-w-page space-y-3 px-6 py-8">
      <h1 id="not-found-title" className="text-heading font-semibold">
        Page not found
      </h1>
      <p className="text-muted">The requested page does not exist.</p>
      <Link
        className="inline-block text-brand underline underline-offset-4 hover:text-brand-hover"
        to={paths.home}
      >
        Return home
      </Link>
    </section>
  );
}
