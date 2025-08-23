import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { AUTH_ENDPOINTS } from '../constants/api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetInfo, setResetInfo] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [resetAttempted, setResetAttempted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginAttempted(true);
    setLoginError('');
    if (!username || !password) {
      return;
    }
    try {
      setLoginLoading(true);
      await login(username, password);
      navigate('/');
    } catch {
      setLoginError(
        'Incorrect username or password, or the account has not been validated.',
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleReset = async () => {
    setResetAttempted(true);
    setResetInfo('');
    if (!username) return;
    try {
      setResetLoading(true);
      const response = await fetch(AUTH_ENDPOINTS.reset, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username }),
      });
      if (response.ok) {
        setResetInfo('Check your email for a password reset link.');
      } else {
        throw new Error('Reset failed');
      }
    } catch {
      setResetInfo('Unable to process password reset.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded bg-warning-subtle"
      >
        <div className="mb-3">
          <label className="form-label">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="username"
              autoComplete="username"
              className={`form-control ${(loginAttempted || resetAttempted) && !username ? 'is-invalid' : ''}`}
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            Password
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="password"
                autoComplete="current-password"
                className={`form-control ${loginAttempted && !password ? 'is-invalid' : ''}`}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide' : 'Show'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i
                  className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                ></i>
              </button>
            </div>
          </label>
        </div>
        {loginError && (
          <div className="alert alert-danger" role="alert">
            {loginError}
          </div>
        )}
        {resetInfo && (
          <div className="alert alert-info" role="alert">
            {resetInfo}
          </div>
        )}
        <div className="d-flex justify-content-between mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/create-user')}
            disabled={loginLoading || resetLoading}
          >
            Create account
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={resetLoading || loginLoading}
          >
            {resetLoading ? 'Sending…' : 'I lost my password'}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loginLoading || resetLoading}
          >
            {loginLoading ? 'Logging in…' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}
