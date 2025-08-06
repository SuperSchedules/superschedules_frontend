import React from 'react';
import { vi, describe, it, expect, afterEach } from 'vitest';
vi.mock('react-big-calendar', () => ({
  Calendar: () => <div>mock calendar</div>,
  dateFnsLocalizer: () => () => {},
}));
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import App from '../App';
import { EVENTS_ENDPOINTS } from '../constants/api.js';

describe('App routing', () => {
  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it('renders About page', () => {
    window.history.pushState({}, '', '/about');
    render(<App />);
    expect(screen.getByText(/about superschedules/i)).toBeInTheDocument();
  });

  it('renders Calendar page', async () => {
    window.localStorage.setItem('token', 'test-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    window.history.pushState({}, '', '/calendar');
    render(<App />);
    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
    const url = globalThis.fetch.mock.calls[0][0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe(new URL(EVENTS_ENDPOINTS.list).pathname);
    expect(parsed.searchParams.get('start')).toBeTruthy();
    expect(parsed.searchParams.get('end')).toBeTruthy();
    expect(globalThis.fetch.mock.calls[0][1]).toEqual({
      headers: { Authorization: 'Bearer test-token' },
    });
    globalThis.fetch.mockRestore();
  });
});
