import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AUTH_ENDPOINTS } from '../constants/api';

type VerificationState = 'loading' | 'success' | 'already_verified' | 'expired' | 'invalid' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      setMessage('No verification token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(AUTH_ENDPOINTS.verifyEmail(token), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (response.ok) {
          if (data.message?.includes('already verified')) {
            setState('already_verified');
          } else {
            setState('success');
          }
          setMessage(data.message);
        } else {
          if (data.message?.includes('expired')) {
            setState('expired');
          } else {
            setState('invalid');
          }
          setMessage(data.message || 'Verification failed.');
        }
      } catch {
        setState('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

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

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we verify your email address.</p>
          </>
        );

      case 'success':
      case 'already_verified':
        return (
          <>
            <div className="text-success mb-3">
              <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
            </div>
            <h2>{state === 'success' ? 'Email Verified!' : 'Already Verified'}</h2>
            <p>{message}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </>
        );

      case 'expired':
        return (
          <>
            <div className="text-warning mb-3">
              <i className="bi bi-clock-fill" style={{ fontSize: '3rem' }}></i>
            </div>
            <h2>Link Expired</h2>
            <p>{message}</p>
            <div className="mt-4">
              <p className="text-muted">Enter your email to receive a new verification link:</p>
              <div className="input-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleResend}
                  disabled={resendLoading || !resendEmail}
                >
                  {resendLoading ? 'Sending...' : 'Resend'}
                </button>
              </div>
              {resendMessage && (
                <div className="alert alert-info" role="alert">
                  {resendMessage}
                </div>
              )}
            </div>
          </>
        );

      case 'invalid':
      case 'error':
        return (
          <>
            <div className="text-danger mb-3">
              <i className="bi bi-x-circle-fill" style={{ fontSize: '3rem' }}></i>
            </div>
            <h2>{state === 'invalid' ? 'Invalid Link' : 'Verification Error'}</h2>
            <p>{message}</p>
            <div className="mt-4">
              <p className="text-muted">Enter your email to receive a new verification link:</p>
              <div className="input-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleResend}
                  disabled={resendLoading || !resendEmail}
                >
                  {resendLoading ? 'Sending...' : 'Resend'}
                </button>
              </div>
              {resendMessage && (
                <div className="alert alert-info" role="alert">
                  {resendMessage}
                </div>
              )}
            </div>
            <button
              className="btn btn-secondary mt-3"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </>
        );
    }
  };

  return (
    <div className="container mt-4">
      <div className="auth-form p-4 border rounded text-center">
        {renderContent()}
      </div>
    </div>
  );
}
