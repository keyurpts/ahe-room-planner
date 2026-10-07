import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with an approved telemetry adapter when monitoring is configured.
    console.error('Unexpected application error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="p-6" aria-labelledby="app-error-title">
          <h1 id="app-error-title" className="text-heading font-semibold">
            Something went wrong
          </h1>
          <p className="mt-3 text-muted">Reload the application to try again.</p>
          <button
            type="button"
            className="mt-4 rounded-control border border-border px-4 py-2 hover:bg-canvas active:bg-border"
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
