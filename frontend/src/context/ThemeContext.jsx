import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('webintel_user') || 'null');
      if (savedUser?.id) {
        const userTheme = localStorage.getItem(`webintel_theme_${savedUser.id}`);
        if (userTheme) return userTheme;
        if (savedUser.theme) return savedUser.theme;
      }
    } catch {}
    return localStorage.getItem('webintel_theme') || 'dark';
  });

  const [accent, setAccent] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('webintel_user') || 'null');
      if (savedUser?.id) {
        const userAccent = localStorage.getItem(`webintel_accent_${savedUser.id}`);
        if (userAccent) return userAccent;
        if (savedUser.accent) return savedUser.accent;
      }
    } catch {}
    return localStorage.getItem('webintel_accent') || 'green';
  });

  // When theme changes, apply to DOM and persist for current user
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('webintel_theme', theme);
    try {
      const savedUser = JSON.parse(localStorage.getItem('webintel_user') || 'null');
      if (savedUser?.id) {
        localStorage.setItem(`webintel_theme_${savedUser.id}`, theme);
        // Sync with backend if token present
        if (localStorage.getItem('webintel_token')) {
          api.patch('/api/v1/auth/preferences', { theme }).catch(() => {});
        }
      }
    } catch {}
  }, [theme]);

  // When accent changes, apply to DOM and persist for current user
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('webintel_accent', accent);
    try {
      const savedUser = JSON.parse(localStorage.getItem('webintel_user') || 'null');
      if (savedUser?.id) {
        localStorage.setItem(`webintel_accent_${savedUser.id}`, accent);
        // Sync with backend if token present
        if (localStorage.getItem('webintel_token')) {
          api.patch('/api/v1/auth/preferences', { accent }).catch(() => {});
        }
      }
    } catch {}
  }, [accent]);

  // Called immediately upon user login or user session restore
  const applyUserTheme = (user) => {
    if (!user) return;
    const userId = user.id;

    // Check user-specific localStorage first, fallback to user.theme / user.accent, then defaults
    const preferredTheme = (userId && localStorage.getItem(`webintel_theme_${userId}`)) || user.theme || 'dark';
    const preferredAccent = (userId && localStorage.getItem(`webintel_accent_${userId}`)) || user.accent || 'green';

    setTheme(preferredTheme);
    setAccent(preferredAccent);
    document.documentElement.setAttribute('data-theme', preferredTheme);
    document.documentElement.setAttribute('data-accent', preferredAccent);
    if (userId) {
      localStorage.setItem(`webintel_theme_${userId}`, preferredTheme);
      localStorage.setItem(`webintel_accent_${userId}`, preferredAccent);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accent, setAccent, applyUserTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
