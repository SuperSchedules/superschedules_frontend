import React from 'react';
import { vi, describe, it, expect, afterEach } from 'vitest';
vi.mock('react-big-calendar', () => ({
  Calendar: () => <div>mock calendar</div>,
  dateFnsLocalizer: () => () => {},
}));
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import App from '../App';

describe('App routing', () => {
  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it('renders About page', () => {
    window.history.pushState({}, '', '/about');
    render(<App />);
    expect(screen.getByText(/about super schedules/i)).toBeInTheDocument();
  });

  it('renders Calendar page', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    window.history.pushState({}, '', '/calendar');
    render(<App />);
    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    globalThis.fetch.mockRestore();
  });
});
