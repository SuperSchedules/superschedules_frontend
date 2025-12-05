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

import { render, screen, cleanup } from '@testing-library/react';
import App from '../App';

describe('App routing', () => {
  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it('renders Home chat experience on root', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByLabelText(/message input/i)).toBeInTheDocument();
  });

  it('renders Login page route', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
