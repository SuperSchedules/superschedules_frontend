import { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'light' | 'dark' | 'zombie-light' | 'zombie-dark';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    if (savedTheme && ['light', 'dark', 'zombie-light', 'zombie-dark'].includes(savedTheme)) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      // Toggle between light/dark for non-zombie themes, zombie-light/zombie-dark for zombie themes
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'light';
      if (prevTheme === 'zombie-light') return 'zombie-dark';
      return 'zombie-light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}