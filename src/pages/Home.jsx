import { useState, useEffect } from 'react';
import { useAuth } from '../auth.jsx';
import { SOURCES_ENDPOINTS } from '../constants/api.js';
import './Home.css';

export default function Home() {
  const { user, authFetch } = useAuth();
  const [sources, setSources] = useState([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const truncateUrl = (str, length = 50) =>
    str && str.length > length ? `${str.slice(0, length)}…` : str;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '');

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

  const handleSubmit = async (e) => {
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
    <div>
      <h1>Submit a new site to scan</h1>
      <div className={`submit-interface${user ? '' : ' disabled'}`}>
        <div className="p-4 border rounded bg-warning-subtle mb-4">
          <form onSubmit={handleSubmit} className="submit-form">
            <label>
              URL
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </label>
            <label>
              Name (optional)
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
        <div className="sources-box">
          <h2>Submitted Sites</h2>
          <table className="sources-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.created_at)}</td>
                  <td title={s.base_url}>{truncateUrl(s.base_url)}</td>
                  <td>{s.status || 'unknown'}</td>
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
