import React from 'react';
import { LOGO_URL } from '@/lib/branding';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Basic logging to console; can be replaced with remote logging later
    console.error('UI ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-12 text-center text-white">
          <div className="max-w-md">
            <img src={LOGO_URL} alt="Logo" className="mx-auto mb-6 h-auto w-44 md:w-52" />
            <h1 className="mb-2 text-xl font-semibold tracking-tight text-white">Something went wrong</h1>
            <p className="text-sm leading-relaxed text-neutral-400">
              Please refresh the page. If the problem persists, contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


