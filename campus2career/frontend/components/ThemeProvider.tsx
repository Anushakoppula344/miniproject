'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark'; // The actual theme being applied
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Function to get the actual theme based on system preference
  const getActualTheme = (themePreference: Theme): 'light' | 'dark' => {
    if (themePreference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themePreference as 'light' | 'dark';
  };

  // Load theme from database on mount
  useEffect(() => {
    const loadThemeFromDatabase = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:5000/api/theme-preferences', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const dbTheme = data.data.theme || 'system';
            setTheme(dbTheme);
            setActualTheme(getActualTheme(dbTheme));
          } else {
            // Fallback to localStorage or system preference
            const savedTheme = localStorage.getItem('theme') as Theme;
            const themeToUse = savedTheme || 'system';
            setTheme(themeToUse);
            setActualTheme(getActualTheme(themeToUse));
          }
        } else {
          // No token, use localStorage or system preference
          const savedTheme = localStorage.getItem('theme') as Theme;
          const themeToUse = savedTheme || 'system';
          setTheme(themeToUse);
          setActualTheme(getActualTheme(themeToUse));
        }
      } catch (error) {
        console.error('Error loading theme from database:', error);
        // Fallback to localStorage or system preference
        const savedTheme = localStorage.getItem('theme') as Theme;
        const themeToUse = savedTheme || 'system';
        setTheme(themeToUse);
        setActualTheme(getActualTheme(themeToUse));
      }
    };

    loadThemeFromDatabase();
  }, []);

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setActualTheme(getActualTheme('system'));
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setActualTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actualTheme);
  }, [actualTheme]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
