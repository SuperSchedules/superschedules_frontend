import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
    navigate('/');
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
              className="form-control"
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
                className="form-control"
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
        <div className="d-flex justify-content-between mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/create-user')}
          >
            Create account
          </button>
          <button type="button" className="btn btn-secondary">
            I lost my password
          </button>
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
