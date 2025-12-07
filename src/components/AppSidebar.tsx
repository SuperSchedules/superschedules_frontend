import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import ThemeToggle from './ThemeToggle';
import UserPreferences from './UserPreferences';
import About from '../pages/About';
import SuggestSite from './SuggestSite';
import './AppSidebar.css';

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSuggestSite, setShowSuggestSite] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Toggle button */}
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>

        {/* Logo/Brand */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="zombie-icon">🧟</span>
            {!isCollapsed && (
              <>
                <h1 className="brand-title">EventZombie</h1>
              </>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            title="Chat"
          >
            <span className="nav-icon">💬</span>
            {!isCollapsed && <span className="nav-label">Chat</span>}
          </Link>

          <button
            onClick={() => setShowSuggestSite(true)}
            className="nav-item nav-button"
            title="Suggest a Site"
          >
            <span className="nav-icon zombie-reading-icon">
              <img src="/zombie-reading.svg" alt="Zombie reading" />
            </span>
            {!isCollapsed && <span className="nav-label">Suggest a Site</span>}
          </button>
        </nav>

        {/* User Section (bottom) */}
        <div className="sidebar-footer">
          <button
            onClick={() => setShowAbout(true)}
            className="footer-item footer-button"
            title="About"
          >
            <span className="footer-icon">ℹ️</span>
            {!isCollapsed && <span className="footer-label">About</span>}
          </button>

          {user ? (
            <>
              <button
                onClick={() => setShowPreferences(true)}
                className="footer-item footer-button"
                title="Preferences"
              >
                <span className="footer-icon">⚙️</span>
                {!isCollapsed && <span className="footer-label">Preferences</span>}
              </button>

              <button
                onClick={logout}
                className={`user-info ${isCollapsed ? 'collapsed' : ''}`}
                title={isCollapsed ? `Log out ${user.username}` : 'Log out'}
              >
                <div className="user-avatar">
                  <span className="avatar-icon">🧟‍♂️</span>
                </div>
                {!isCollapsed && (
                  <div className="user-details">
                    <div className="user-name">{user.username}</div>
                    <div className="logout-hint">Click to log out</div>
                  </div>
                )}
              </button>
            </>
          ) : (
            <Link to="/login" className="footer-item login-link" title="Login">
              <span className="footer-icon">🔑</span>
              {!isCollapsed && <span className="footer-label">Login</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Modals */}
      <UserPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
      <About isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <SuggestSite isOpen={showSuggestSite} onClose={() => setShowSuggestSite(false)} />
    </>
  );
}
