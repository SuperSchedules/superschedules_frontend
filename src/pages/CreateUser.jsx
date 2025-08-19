import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_ENDPOINTS } from '../constants/api.js';

export default function CreateUser() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const response = await fetch(AUTH_ENDPOINTS.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        zipCode,
      }),
    });
    if (!response.ok) {
      setError('User creation failed');
      return;
    }
    navigate('/verify-account');
  };

  return (
    <div className="container mt-4">
      <form
        onSubmit={handleSubmit}
        className="auth-form p-4 border rounded"
      >
        <h2>Create Account</h2>
        <div className="mb-3">
          <label className="form-label">
            First name
            <input
              type="text"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-label="first name"
              autoComplete="given-name"
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            Last name
            <input
              type="text"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-label="last name"
              autoComplete="family-name"
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            Email
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="email"
              autoComplete="email"
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            Password
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="password"
              autoComplete="new-password"
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            Zip code
            <input
              type="text"
              className="form-control"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              aria-label="zip code"
              autoComplete="postal-code"
            />
          </label>
        </div>
        <p>An email will be sent to verify your account.</p>
        {error && <div role="alert">{error}</div>}
        <div className="d-flex justify-content-between mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/login')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
