'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // Default to dark mode
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply theme immediately before setting state
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (savedTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
    
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    
    setTheme((currentTheme) => {
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      // Update localStorage
      localStorage.setItem('theme', newTheme);
      
      // Directly manipulate the class to avoid race conditions
      const html = document.documentElement;
      if (newTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      
      return newTheme;
    });
  };

  // Always provide the context, even before mounting
  // This ensures toggleTheme is always available
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {!mounted ? <>{children}</> : children}
    </ThemeContext.Provider>
  );
}

