import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_ENDPOINTS } from '../constants/api.js';

export default function CreateUser() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const response = await fetch(AUTH_ENDPOINTS.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError('User creation failed');
      return;
    }
    navigate('/verify-account');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="email"
            autoComplete="email"
          />
        </label>
      </div>
      <div>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="password"
            autoComplete="new-password"
          />
        </label>
      </div>
      <p>An email will be sent to verify your account.</p>
      {error && <div role="alert">{error}</div>}
      <button type="submit">Create account</button>
    </form>
  );
}
