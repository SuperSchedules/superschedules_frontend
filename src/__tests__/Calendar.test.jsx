import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import CalendarPage from '../pages/Calendar.jsx';

vi.mock('react-big-calendar', () => ({
  Calendar: ({ onRangeChange }) => {
    React.useEffect(() => {
      onRangeChange?.([ new Date('2025-01-01'), new Date('2025-01-31') ]);
    }, [ onRangeChange ]);
    return <div data-testid="calendar">mock calendar</div>;
  },
  dateFnsLocalizer: () => () => {},
}));

describe('Calendar page', () => {
  afterEach(() => {
    cleanup();
  });

  it('fetches events and renders heading', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<CalendarPage />);
    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    globalThis.fetch.mockRestore();
  });
});
