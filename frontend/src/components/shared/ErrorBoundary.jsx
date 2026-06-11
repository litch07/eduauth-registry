import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger)]/20 text-[var(--danger)]">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">Something went wrong</h2>
          <p className="mb-6 max-w-md text-sm text-[var(--text-secondary)]">
            We encountered an unexpected error while trying to load this content. Please try reloading the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mb-6 w-full max-w-2xl overflow-auto rounded-lg bg-[var(--danger)]/10 p-4 text-left">
              <p className="font-mono text-xs text-[var(--danger)]">{this.state.error.toString()}</p>
            </div>
          )}
          <Button onClick={this.handleReload} className="inline-flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
