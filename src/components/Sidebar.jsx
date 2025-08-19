import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar p-3">
      <nav className="nav flex-column">
        <Link className="nav-link sidebar-link" to="/">
          Scanner Control
        </Link>
        <Link className="nav-link sidebar-link" to="/calendar">
          Calendar
        </Link>
        <Link className="nav-link sidebar-link" to="/about">
          About
        </Link>
      </nav>
    </aside>
  );
}
