import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../auth';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { AUTH_ENDPOINTS } from '../constants/api';

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });
  it('renders fields', () => {
    renderPage();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password');
  });

  it('logs in', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ access: 'test-access', refresh: 'test-refresh' }),
    });

    renderPage();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'b' } });
    fireEvent.click(screen.getByText(/login/i));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('test-access');
      expect(localStorage.getItem('refresh')).toBe('test-refresh');
    });

    globalThis.fetch.mockRestore();
  });

  it('shows error on failed login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false });

    renderPage();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'b' } });
    fireEvent.click(screen.getByText(/login/i));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Incorrect username or password, or the account has not been validated./i,
        ),
      ).toBeInTheDocument();
    });

    globalThis.fetch.mockRestore();
  });

  it('requests password reset', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true });

    renderPage();
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText(/i lost my password/i));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        AUTH_ENDPOINTS.reset,
        expect.objectContaining({ method: 'POST' }),
      );
      expect(
        screen.getByText(/check your email for a password reset link/i),
      ).toBeInTheDocument();
    });

    globalThis.fetch.mockRestore();
  });
});
