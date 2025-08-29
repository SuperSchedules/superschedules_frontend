import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { SOURCES_ENDPOINTS } from '../constants/api';
import './Home.css';

interface Source {
  id: number;
  base_url: string;
  name?: string;
  date_added: string;
  last_run_at: string | null;
  status: string;
}

export default function Home() {
  const { user, authFetch } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const truncateUrl = (str: string, length = 50): string =>
    str && str.length > length ? `${str.slice(0, length)}…` : str;

  const formatDate = (d: string | null): string => (d ? new Date(d).toLocaleDateString() : '');

  useEffect(() => {
    if (!user) return;
    async function loadSources() {
      try {
        const res = await authFetch.get(SOURCES_ENDPOINTS.list);
        setSources(res.data);
      } catch (err) {
        console.error('Failed to load sources', err);
      }
    }
    loadSources();
  }, [user, authFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch.post(SOURCES_ENDPOINTS.list, {
        base_url: url,
        name,
      });
      setSources((prev) => [...prev, res.data]);
      setUrl('');
      setName('');
    } catch (err) {
      console.error('Failed to submit source', err);
    }
  };

  return (
    <div className="home-page">
      <h1>Submit a new site to scan</h1>
      <div className={`submit-interface${user ? '' : ' disabled'}`}>
        <div className="scan-form p-4 border rounded mb-4">
          <form onSubmit={handleSubmit} className="submit-form">
            <label className="form-label">
              URL
              <input
                type="url"
                className="form-control"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </label>
            <label className="form-label">
              Name (optional)
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Friendly name for this source"
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Submit Site
            </button>
          </form>
        </div>
        <div className="sources-box">
          <h2>Submitted Sites</h2>
          <table className="sources-table">
            <thead>
              <tr>
                <th>Date Added</th>
                <th>Last Run</th>
                <th>URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.date_added)}</td>
                  <td>{formatDate(s.last_run_at)}</td>
                  <td title={s.base_url}>{truncateUrl(s.base_url)}</td>
                  <td>{s.status || 'not run'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!user && <p>Please log in to submit event links.</p>}
    </div>
  );
}
