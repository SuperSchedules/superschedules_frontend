import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './TopBar.css';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          <div className="user-menu" ref={menuRef}>
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
