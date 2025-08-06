import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import CalendarPage from '../pages/Calendar.jsx';
import { AuthContext } from '../auth.jsx';
import { EVENTS_ENDPOINTS } from '../constants/api.js';

const handlers = {};

vi.mock('react-big-calendar', () => ({
  Calendar: (props) => {
    Object.assign(handlers, props);
    return <div data-testid="calendar" />;
  },
  dateFnsLocalizer: () => () => {},
}));

describe('Calendar page', () => {
  afterEach(() => {
    cleanup();
  });

  it('fetches events and renders heading', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    const authFetch = (url, options) =>
      globalThis.fetch(url, {
        ...options,
        headers: { Authorization: 'Bearer test-token', ...(options?.headers || {}) },
      });
    render(
      <AuthContext.Provider value={{ user: { token: 'test-token' }, authFetch }}>
        <CalendarPage />
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const firstUrl = globalThis.fetch.mock.calls[0][0];
    const parsed1 = new URL(firstUrl);
    expect(parsed1.pathname).toBe(new URL(EVENTS_ENDPOINTS.list).pathname);
    expect(parsed1.searchParams.get('start')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parsed1.searchParams.get('end')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(globalThis.fetch.mock.calls[0][1]).toEqual({
      headers: { Authorization: 'Bearer test-token' },
    });

    expect(typeof handlers.tooltipAccessor).toBe('function');
    const tooltip = handlers.tooltipAccessor({
      title: 'title',
      description: 'desc',
      location: 'room',
      start: new Date('2024-01-01T10:00:00'),
      end: new Date('2024-01-01T11:00:00'),
    });
    expect(tooltip).toContain('title');
    expect(tooltip).toContain('desc');
    expect(tooltip).toContain('room');

    handlers.onNavigate(new Date('2025-02-01'));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    const secondUrl = globalThis.fetch.mock.calls[1][0];
    const parsed2 = new URL(secondUrl);
    expect(parsed2.searchParams.get('start')).not.toBe(
      parsed1.searchParams.get('start'),
    );

    globalThis.fetch.mockRestore();
  });
});
