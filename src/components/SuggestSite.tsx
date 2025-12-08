import { useState } from 'react';
import { useAuth } from '../auth';
import { useTheme } from '../contexts/ThemeContext';
import { SOURCES_ENDPOINTS } from '../constants/api';
import './SuggestSite.css';

interface SuggestSiteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestSite({ isOpen, onClose }: SuggestSiteProps) {
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isZombieTheme = theme === 'zombie-light' || theme === 'zombie-dark';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authFetch.post(SOURCES_ENDPOINTS.list, {
        base_url: url,
        name: name || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setUrl('');
        setName('');
        setSuccess(false);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Failed to submit source', err);
      setError(err.response?.data?.message || 'Failed to submit site. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setUrl('');
      setName('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="suggest-site-overlay" onClick={handleClose}>
      <div className="suggest-site-modal" onClick={(e) => e.stopPropagation()}>
        <div className="suggest-site-header">
          <div className="header-with-icon">
            {isZombieTheme && <span className="zombie-reader">🧟‍♂️📖</span>}
            <h2>Suggest an Event Site</h2>
          </div>
          <button className="close-btn" onClick={handleClose} aria-label="Close" disabled={isSubmitting}>
            ×
          </button>
        </div>
        <div className="suggest-site-content">
          <p>
            Found an event listing site you'd like us to track? Submit it here and we'll add it to our collection.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="site-url" className="form-label">
                Event Listing URL *
              </label>
              <input
                id="site-url"
                type="url"
                className="form-control"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/events"
                required
                disabled={isSubmitting || success}
              />
              <small className="form-text">
                Enter the direct link to the page where events are listed
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="site-name" className="form-label">
                Site Name (optional)
              </label>
              <input
                id="site-name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Friendly name for this source"
                disabled={isSubmitting || success}
              />
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="alert">
                Site submitted successfully! Thank you for your contribution.
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || success}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Site'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
