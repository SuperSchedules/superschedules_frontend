import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { AUTH_ENDPOINTS } from '../constants/api';
import CreateUser from '../pages/CreateUser';

describe('CreateUser page', () => {
  afterEach(() => {
    cleanup();
  });

  function renderWithRouter() {
    return render(
      <MemoryRouter initialEntries={[ '/create-user' ]}>
        <Routes>
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/verify-account" element={<p>verify</p>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders form', () => {
    renderWithRouter();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(
      screen.getByText(/an email will be sent to verify your account/i)
    ).toBeInTheDocument();
  });

  it('submits and navigates to verify page', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    renderWithRouter();
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secret' },
    });
    fireEvent.change(screen.getByLabelText(/zip code/i), {
      target: { value: '12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/verify/i)).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      AUTH_ENDPOINTS.register,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'secret',
          first_name: 'John',
          last_name: 'Doe',
        }),
      }
    );

    globalThis.fetch.mockRestore();
  });
});
