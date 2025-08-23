import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import './TopBar.css';

export default function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close menu after 30 seconds
  useEffect(() => {
    if (open) {
      timeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 30000); // 30 seconds
    } else {
      // Clear timeout if menu is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

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
            <div ref={menuRef}>
              <ul className="menu list-unstyled bg-light border rounded p-2">
                <li>Account</li>
                <li>
                  <button 
                    className="btn btn-link p-0" 
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <Link className="btn btn-outline-dark ms-auto fs-5" to="/login">
          Login
        </Link>
      )}
    </header>
  );
}
