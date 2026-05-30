import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('nn_theme') === 'dark';
  });

  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    return localStorage.getItem('nn_simple_mode') === 'true';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nn_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nn_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (isSimpleMode) {
      document.documentElement.classList.add('simple-mode');
      localStorage.setItem('nn_simple_mode', 'true');
    } else {
      document.documentElement.classList.remove('simple-mode');
      localStorage.setItem('nn_simple_mode', 'false');
    }
  }, [isSimpleMode]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const toggleSimpleMode = () => setIsSimpleMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isSimpleMode, toggleSimpleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

