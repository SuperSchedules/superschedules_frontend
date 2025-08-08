import { useState, useEffect } from 'react';
import { useAuth } from '../auth.jsx';
import { SOURCES_ENDPOINTS } from '../constants/api.js';
import './Home.css';

export default function Home() {
  const { user, authFetch } = useAuth();
  const [sources, setSources] = useState([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!user) return;
    async function loadSources() {
      try {
        const res = await authFetch(SOURCES_ENDPOINTS.list);
        if (res.ok) {
          const data = await res.json();
          setSources(data);
        }
      } catch (err) {
        console.error('Failed to load sources', err);
      }
    }
    loadSources();
  }, [user, authFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(SOURCES_ENDPOINTS.list, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: url, name }),
      });
      if (res.ok) {
        const data = await res.json();
        setSources((prev) => [...prev, data]);
        setUrl('');
        setName('');
      }
    } catch (err) {
      console.error('Failed to submit source', err);
    }
  };

  return (
    <div>
      <h1>Welcome!</h1>
      <div className={`submit-interface${user ? '' : ' disabled'}`}>
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
        <h2>Submitted Sites</h2>
        <ul>
          {sources.map((s) => (
            <li key={s.id}>
              {s.name ? `${s.name} - ${s.base_url}` : s.base_url}
            </li>
          ))}
        </ul>
      </div>
      {!user && <p>Please log in to submit event links.</p>}
    </div>
  );
}
