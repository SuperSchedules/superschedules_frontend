import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import CalendarPage from '../pages/Calendar.jsx';

vi.mock('react-big-calendar', () => ({
  Calendar: () => <div data-testid="calendar" />,
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
