import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen flex-col items-center justify-center p-4'>
          <h1 className='text-2xl font-bold text-red-600 mb-2'>
            Something went wrong.
          </h1>
          <pre className='text-sm bg-gray-100 p-4 rounded overflow-auto max-w-full'>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
