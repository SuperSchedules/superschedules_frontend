import React from 'react';
import { vi, describe, it, expect, afterEach } from 'vitest';
vi.mock('react-big-calendar', () => ({
  Calendar: () => <div>mock calendar</div>,
  dateFnsLocalizer: () => () => {},
}));

vi.mock('../auth', () => {
  const mockAuthFetch = { get: vi.fn().mockResolvedValue({ data: [] }) };
  const AuthContext = React.createContext(null);
  const useAuth = () => React.useContext(AuthContext);
  const AuthProvider = ({ children }) => (
    <AuthContext.Provider
      value={{
        user: { token: 'test-token' },
        authFetch: mockAuthFetch,
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
  return { AuthProvider, AuthContext, useAuth, mockAuthFetch };
});

import { mockAuthFetch } from '../auth';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import App from '../App';
import { EVENTS_ENDPOINTS } from '../constants/api';

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

  it('renders Chat page', async () => {
    window.localStorage.setItem('token', 'test-token');
    window.history.pushState({}, '', '/chat');
    render(<App />);
    expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
  });
});
