import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AUTH_ENDPOINTS } from '../constants/api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setMessage('');
    if (!password || password !== confirm) {
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(AUTH_ENDPOINTS.resetConfirm, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (response.ok) {
        setMessage('Your password has been reset. You can now log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        throw new Error('Reset failed');
      }
    } catch {
      setMessage('Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <form
        onSubmit={handleSubmit}
        className="auth-form p-4 border rounded"
      >
        <h2>Reset Password</h2>
        <div className="mb-3">
          <label className="form-label">
            New Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`form-control ${attempted && !password ? 'is-invalid' : ''}`}
              aria-label="new-password"
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            Confirm Password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`form-control ${attempted && (confirm !== password || !confirm) ? 'is-invalid' : ''}`}
              aria-label="confirm-password"
            />
          </label>
        </div>
        {message && (
          <div className="alert alert-info" role="alert">
            {message}
          </div>
        )}
        <div className="mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
