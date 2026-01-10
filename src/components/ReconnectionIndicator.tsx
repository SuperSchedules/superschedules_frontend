import { useEffect, useState } from 'react';
import type { ReconnectionState } from '../types/streaming';

interface ReconnectionIndicatorProps {
  reconnectionState: ReconnectionState;
  onCancel?: () => void;
}

/**
 * Displays a reconnection status indicator during SSE stream recovery.
 * Shows attempt count, countdown to next retry, and optional cancel button.
 */
export default function ReconnectionIndicator({
  reconnectionState,
  onCancel,
}: ReconnectionIndicatorProps) {
  const [countdown, setCountdown] = useState<number>(
    Math.ceil(reconnectionState.nextRetryMs / 1000)
  );

  // Update countdown timer
  useEffect(() => {
    setCountdown(Math.ceil(reconnectionState.nextRetryMs / 1000));

    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [reconnectionState.nextRetryMs, reconnectionState.attempt]);

  if (!reconnectionState.isReconnecting) {
    return null;
  }

  return (
    <div
      className="d-flex align-items-center gap-2 p-2 bg-warning bg-opacity-10 border border-warning rounded"
      role="alert"
      aria-live="polite"
    >
      {/* Spinner */}
      <div className="spinner-border spinner-border-sm text-warning" role="status">
        <span className="visually-hidden">Reconnecting...</span>
      </div>

      {/* Status text */}
      <span className="text-warning-emphasis small">
        Reconnecting... (attempt {reconnectionState.attempt}/{reconnectionState.maxAttempts})
        {countdown > 0 && (
          <span className="ms-1 text-muted">
            - retrying in {countdown}s
          </span>
        )}
      </span>

      {/* Cancel button */}
      {onCancel && (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary ms-auto py-0"
          onClick={onCancel}
          aria-label="Cancel reconnection"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
