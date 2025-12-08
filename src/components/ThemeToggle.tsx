import { useTheme } from '../contexts/ThemeContext';
import type { ThemeType } from '../contexts/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const getThemeLabel = (t: ThemeType) => {
    if (t === 'dark') return 'Dark';
    if (t === 'zombie-dark') return 'Zombie Dark';
    if (t === 'zombie-light') return 'Zombie Light';
    return 'Light';
  };

  const getNextTheme = (t: ThemeType) => {
    if (t === 'light') return 'dark';
    if (t === 'dark') return 'light';
    if (t === 'zombie-light') return 'zombie-dark';
    return 'zombie-light';
  };

  const getThemeIcon = (t: ThemeType) => {
    if (t === 'dark' || t === 'zombie-dark') return '🌙';
    return '☀️';
  };

  return (
    <button
      className="theme-toggle btn btn-outline"
      onClick={toggleTheme}
      aria-label={`Switch to ${getThemeLabel(getNextTheme(theme))} mode`}
      title={`Switch to ${getThemeLabel(getNextTheme(theme))} mode`}
      type="button"
    >
      <span className="theme-icon" aria-hidden="true">
        {getThemeIcon(theme)}
      </span>
      <span className="theme-text">
        {getThemeLabel(theme)}
      </span>
    </button>
  );
}