// FILE: src/components/ErrorBoundary.tsx
/// ANCHOR: ErrorBoundary
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onRecover?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary - Catches all render-time exceptions
 * Prevents app from freezing and provides recovery mechanism
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to backend if available
    try {
      // Could send to IPC logger here if needed
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  handleRecover = () => {
    // FIX: Force enable ALL inputs before resetting state
    document.querySelectorAll('input, textarea, select, button').forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.removeAttribute('disabled');
      htmlEl.style.pointerEvents = '';
      htmlEl.style.opacity = '';
      htmlEl.style.cursor = '';
    });
    
    // Remove any blocking overlays immediately
    document.querySelectorAll('.backdrop, [class*="backdrop"], [class*="overlay"]').forEach((el) => {
      (el as HTMLElement).remove();
    });
    
    // Restore body styles
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    
    // Reset error state without reloading Electron
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call custom recovery handler if provided
    if (this.props.onRecover) {
      this.props.onRecover();
    }

    // Restore focus to first available input
    setTimeout(() => {
      const firstInput = document.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      } else {
        document.body.focus();
      }
    }, 100);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
            className="error-boundary-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h2 style={{ marginTop: 0, color: '#dc2626' }}>Something went wrong</h2>
            <p style={{ marginBottom: '16px' }}>
              An error occurred, but the app can recover. Click "Recover UI" to continue.
            </p>
            {this.state.error && (
              <details style={{ marginBottom: '16px', fontSize: '12px' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Error details
                </summary>
                <pre
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={this.handleRecover}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Recover UI
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

