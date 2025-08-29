import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
      <aside className="sidebar p-3">
        <nav className="nav flex-column" aria-label="Primary">
          <NavLink className="nav-link sidebar-link" to="/">
            Scanner Control
          </NavLink>
          <NavLink className="nav-link sidebar-link" to="/calendar">
            Calendar
          </NavLink>
          <NavLink className="nav-link sidebar-link" to="/about">
            About
          </NavLink>
        </nav>
      </aside>
    );
  }
