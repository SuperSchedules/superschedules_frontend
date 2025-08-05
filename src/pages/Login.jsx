import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="username"
            autoComplete="username"
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
            autoComplete="current-password"
          />
        </label>
      </div>
      <button type="submit">Login</button>
      <div>
        <button type="button">Create account</button>
        <button type="button">I lost my password</button>
      </div>
    </form>
  );
}
