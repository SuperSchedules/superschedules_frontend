import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import './TopBar.css';

export default function TopBar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar navbar bg-warning px-3">
      <button
        className="btn btn-outline-dark me-2"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        ☰
      </button>
      <h1 className="navbar-brand mb-0">SuperSchedules</h1>
      {user ? (
        <div className="user-menu ms-auto">
          <button
            className="btn btn-outline-dark"
            aria-label="settings"
            onClick={() => setOpen((o) => !o)}
          >
            ⚙️
          </button>
          {open && (
            <ul className="menu list-unstyled bg-light border rounded p-2">
              <li>Account</li>
              <li>
                <button className="btn btn-link p-0" onClick={logout}>
                  Log out
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : (
        <Link className="ms-auto" to="/login">
          Login
        </Link>
      )}
    </header>
  );
}
