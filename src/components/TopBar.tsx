import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import ThemeToggle from './ThemeToggle';
import About from '../pages/About';
import SuggestSite from './SuggestSite';
import './TopBar.css';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSuggestSite, setShowSuggestSite] = useState(false);
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

  const handleAboutClick = () => {
    setShowAbout(true);
    setOpen(false);
  };

  return (
    <>
      <header className="topbar navbar px-3 text-dark">
        <Link to="/" className="navbar-brand mb-0 text-decoration-none">
          <h1 className="mb-0">EventZombie</h1>
        </Link>
        <div className="ms-auto d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowSuggestSite(true)}
          >
            📍 Suggest a Site
          </button>
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button
                className="btn-login-large"
                aria-label="settings"
                onClick={() => setOpen((o) => !o)}
              >
                ⚙️
              </button>
              {open && (
                <ul className="menu list-unstyled rounded p-2">
                  <li>Account: {user.username}</li>
                  <li>
                    <button className="btn btn-link p-0" onClick={handleAboutClick}>
                      About
                    </button>
                  </li>
                  <li>
                    <ThemeToggle />
                  </li>
                  <li>
                    <button className="btn btn-link p-0" onClick={logout}>
                      Log out
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <div className="user-menu" ref={menuRef}>
              <button
                className="btn-login-large"
                aria-label="login"
                onClick={() => setOpen((o) => !o)}
              >
                ⚙️
              </button>
              {open && (
                <ul className="menu list-unstyled rounded p-2">
                  <li>
                    <button className="btn btn-link p-0" onClick={handleAboutClick}>
                      About
                    </button>
                  </li>
                  <li>
                    <ThemeToggle />
                  </li>
                  <li>
                    <Link className="btn btn-link p-0" to="/login">
                      Login
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </header>
      <About isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <SuggestSite isOpen={showSuggestSite} onClose={() => setShowSuggestSite(false)} />
    </>
  );
}
