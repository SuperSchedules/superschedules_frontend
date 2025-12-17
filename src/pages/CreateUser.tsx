import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_ENDPOINTS } from '../constants/api';

// Turnstile site key - replace with your own from Cloudflare dashboard
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export default function CreateUser() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  // Load Turnstile script and render widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return;

    const scriptId = 'turnstile-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Render widget once script loads
    const renderWidget = () => {
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => setTurnstileToken(token),
          'error-callback': () => setTurnstileToken(null),
          'expired-callback': () => setTurnstileToken(null),
        });
      }
    };

    // Check if already loaded or wait for load
    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.getElementById(scriptId);
      script?.addEventListener('load', renderWidget);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot check - if filled, silently reject (bots fill hidden fields)
    if (honeypot) {
      // Pretend success to not tip off the bot
      navigate('/verify-account', { state: { email } });
      return;
    }

    // Turnstile check - only if configured
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the security check.');
      return;
    }

    const response = await fetch(AUTH_ENDPOINTS.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName || null,
        last_name: lastName || null,
        ...(turnstileToken && { turnstileToken }),
      }),
    });
    if (!response.ok) {
      setError('User creation failed');
      return;
    }
    navigate('/verify-account', { state: { email } });
  };

  return (
    <div className="container mt-4">
      <form
        onSubmit={handleSubmit}
        className="auth-form p-4 border rounded"
      >
        <h2>Create Account</h2>
        {/* Honeypot field - hidden from users, bots will fill it */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
          <label>
            Leave this empty
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">
            First name (optional)
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
            Last name (optional)
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
            Zip code (optional)
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
        <div className="alert alert-secondary" role="note">
          <small>
            <strong>Note:</strong> Name and zip code are optional. If provided, your zip code will be used to help narrow down event searches to your local area by default.
          </small>
        </div>
        <div className="alert alert-info" role="note">
          <small>
            <strong>Privacy:</strong> Your email address will be stored on our server and only used for account recovery and password reset purposes.
          </small>
        </div>
        {TURNSTILE_SITE_KEY && (
          <div className="mb-3">
            <div ref={turnstileRef}></div>
          </div>
        )}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
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
