import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ResetPassword from '../pages/ResetPassword';
import { AUTH_ENDPOINTS } from '../constants/api.js';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reset-password?token=abc']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<div>login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ResetPassword page', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('submits new password', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true });

    renderPage();
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'abc' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByText(/reset password/i));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        AUTH_ENDPOINTS.resetConfirm,
        expect.objectContaining({ method: 'POST' }),
      );
      expect(
        screen.getByText(/your password has been reset/i),
      ).toBeInTheDocument();
    });
  });
});
