import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './TopBar.css';

export default function TopBar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar navbar px-3 text-dark">
      <button
        className="btn btn-outline-dark me-2"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        ☰
      </button>
      <h1 className="navbar-brand mb-0">SuperSchedules</h1>
      <div className="ms-auto d-flex align-items-center gap-2">
        <ThemeToggle />
        {user ? (
          <div className="user-menu">
            <button
              className="btn btn-outline"
              aria-label="settings"
              onClick={() => setOpen((o) => !o)}
            >
              ⚙️
            </button>
            {open && (
              <ul className="menu list-unstyled rounded p-2">
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
          <Link className="btn btn-outline fs-5" to="/login">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
