import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AUTH_ENDPOINTS } from '../constants/api';

interface LocationState {
  email?: string;
}

export default function VerifyAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const email = state?.email;

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(email || '');

  const handleResend = async () => {
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch(AUTH_ENDPOINTS.resendVerification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();
      setResendMessage(data.message || 'Verification email sent if account exists.');
    } catch {
      setResendMessage('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="auth-form p-4 border rounded text-center">
        <div className="text-primary mb-3">
          <i className="bi bi-envelope-check" style={{ fontSize: '3rem' }}></i>
        </div>
        <h2>Check Your Email</h2>
        {email ? (
          <p>
            We've sent a verification email to <strong>{email}</strong>.
            <br />
            Click the link in the email to verify your account.
          </p>
        ) : (
          <p>
            We've sent a verification email to your inbox.
            <br />
            Click the link in the email to verify your account.
          </p>
        )}

        <div className="alert alert-info mt-4" role="note">
          <small>
            <i className="bi bi-info-circle me-1"></i>
            The verification link will expire in 24 hours.
            <br />
            Check your spam folder if you don't see the email.
          </small>
        </div>

        <hr className="my-4" />

        <p className="text-muted mb-3">Didn't receive the email?</p>

        {!email && (
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
          </div>
        )}

        <button
          className="btn btn-outline-primary"
          onClick={handleResend}
          disabled={resendLoading || !resendEmail}
        >
          {resendLoading ? 'Sending...' : 'Resend verification email'}
        </button>

        {resendMessage && (
          <div className="alert alert-info mt-3" role="alert">
            {resendMessage}
          </div>
        )}

        <div className="mt-4">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
