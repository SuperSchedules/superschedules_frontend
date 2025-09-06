import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import CalendarPage from '../pages/Calendar';
import { AuthContext } from '../auth';

describe('Chat page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders chat input', async () => {
    const authFetch: any = { get: () => Promise.resolve({ data: [] }) };
    render(
      <AuthContext.Provider value={{ user: { token: 'test-token' }, authFetch }}>
        <CalendarPage />
      </AuthContext.Provider>,
    );

    expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
  });
});
