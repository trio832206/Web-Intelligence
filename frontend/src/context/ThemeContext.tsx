import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';
export type AccentColor = 'teal' | 'red' | 'gold' | 'sapphire' | 'amethyst' | 'emerald';

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSavedPreference = <T extends string>(key: string, defaultValue: T): T => {
  const username = localStorage.getItem('username');
  if (!username) return defaultValue;
  const saved = localStorage.getItem(`theme_${key}_${username}`);
  return (saved as T) || defaultValue;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(getSavedPreference('mode', 'light'));
  const [accent, setAccent] = useState<AccentColor>(getSavedPreference('accent', 'teal'));

  useEffect(() => {
    const handleAuthChange = () => {
      setMode(getSavedPreference('mode', 'light'));
      setAccent(getSavedPreference('accent', 'teal'));
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  useEffect(() => {
    // Apply theme mode classes to the document body or root
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-accent', accent);
    
    const username = localStorage.getItem('username');
    if (username) {
      localStorage.setItem(`theme_mode_${username}`, mode);
      localStorage.setItem(`theme_accent_${username}`, accent);
    }
  }, [mode, accent]);

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
