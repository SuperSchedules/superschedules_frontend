import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle btn btn-outline"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      type="button"
    >
      <span className="theme-icon" aria-hidden="true">
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
      <span className="theme-text">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
