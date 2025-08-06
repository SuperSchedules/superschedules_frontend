import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar bg-warning p-3">
      <nav className="nav flex-column">
        <Link className="nav-link text-dark" to="/">
          Home
        </Link>
        <Link className="nav-link text-dark" to="/about">
          About
        </Link>
        <Link className="nav-link text-dark" to="/calendar">
          Calendar
        </Link>
      </nav>
    </aside>
  );
}
