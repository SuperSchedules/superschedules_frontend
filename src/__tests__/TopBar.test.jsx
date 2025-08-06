import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { AuthProvider, AuthContext } from '../auth.jsx';
import { describe, it, expect, afterEach, vi } from 'vitest';

function renderWithAuth(ui, { user } = {}) {
  const value = user
    ? { user, login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn() }
    : undefined;
  return render(
    <MemoryRouter>
      {value ? (
        <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>
      ) : (
        <AuthProvider>{ui}</AuthProvider>
      )}
    </MemoryRouter>
  );
}

describe('TopBar', () => {
  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it('shows login when not authenticated', () => {
    renderWithAuth(<TopBar onToggleSidebar={() => {}} />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('shows menu when authenticated', async () => {
    renderWithAuth(<TopBar onToggleSidebar={() => {}} />, { user: { token: 'abc' } });
    const button = await screen.findByRole('button', { name: /settings/i });
    fireEvent.click(button);
    expect(screen.getByText(/log out/i)).toBeInTheDocument();
  });
});
