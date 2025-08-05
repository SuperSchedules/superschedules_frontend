import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import './TopBar.css';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar">
      <h1 className="title">SuperSchedules</h1>
      {user ? (
        <div className="user-menu">
          <button aria-label="settings" onClick={() => setOpen((o) => !o)}>
            ⚙️
          </button>
          {open && (
            <ul className="menu">
              <li>Account</li>
              <li>
                <button onClick={logout}>Log out</button>
              </li>
            </ul>
          )}
        </div>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  );
}
