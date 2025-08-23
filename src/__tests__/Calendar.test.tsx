import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import CalendarPage from '../pages/Calendar';
import { AuthContext } from '../auth';
import { EVENTS_ENDPOINTS } from '../constants/api';

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
    const authFetch = { get: vi.fn().mockResolvedValue({ data: [] }) };
    render(
      <AuthContext.Provider value={{ user: { token: 'test-token' }, authFetch }}>
        <CalendarPage />
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(authFetch.get).toHaveBeenCalledTimes(1);
    });

    const firstUrl = authFetch.get.mock.calls[0][0];
    const parsed1 = new URL(firstUrl);
    expect(parsed1.pathname).toBe(new URL(EVENTS_ENDPOINTS.list).pathname);
    expect(parsed1.searchParams.get('start')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parsed1.searchParams.get('end')).toMatch(/^\d{4}-\d{2}-\d{2}$/);

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
      expect(authFetch.get).toHaveBeenCalledTimes(2);
    });

    const secondUrl = authFetch.get.mock.calls[1][0];
    const parsed2 = new URL(secondUrl);
    expect(parsed2.searchParams.get('start')).not.toBe(
      parsed1.searchParams.get('start'),
    );
  });
});
