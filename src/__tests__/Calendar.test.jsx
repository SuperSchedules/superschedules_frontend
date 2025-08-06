import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import CalendarPage from '../pages/Calendar.jsx';
import { AuthContext } from '../auth.jsx';
import { EVENTS_ENDPOINTS } from '../constants/api.js';

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
    render(
      <AuthContext.Provider value={{ user: { token: 'test-token' } }}>
        <CalendarPage />
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(EVENTS_ENDPOINTS.list, {
      headers: { Authorization: 'Bearer test-token' },
    });

    globalThis.fetch.mockRestore();
  });
});
