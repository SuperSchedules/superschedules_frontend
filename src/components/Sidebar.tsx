import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar p-3 text-dark">
      <nav className="nav flex-column">
        <Link className="nav-link text-dark" to="/">
          Scanner Control
        </Link>
        <Link className="nav-link text-dark" to="/calendar">
          Calendar
        </Link>
        <Link className="nav-link text-dark" to="/about">
          About
        </Link>
      </nav>
    </aside>
  );
}
