import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontOption = 'jakarta' | 'cinzel' | 'mono' | 'sans';
export type AccentOption = 'gold' | 'red' | 'green' | 'blue' | 'purple';

interface ThemeContextType {
  font: FontOption;
  accent: AccentOption;
  setFont: (font: FontOption) => void;
  setAccent: (accent: AccentOption) => void;
  getAccentClasses: () => {
    primaryText: string;
    primaryBg: string;
    border: string;
    gradient: string;
    badge: string;
    glow: string;
    ring: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [font, setFontState] = useState<FontOption>('jakarta');
  const [accent, setAccentState] = useState<AccentOption>('gold');

  useEffect(() => {
    const savedFont = localStorage.getItem('abada_font') as FontOption;
    const savedAccent = localStorage.getItem('abada_accent') as AccentOption;
    if (savedFont) setFontState(savedFont);
    if (savedAccent) setAccentState(savedAccent);
  }, []);

  const setFont = (newFont: FontOption) => {
    setFontState(newFont);
    localStorage.setItem('abada_font', newFont);
  };

  const setAccent = (newAccent: AccentOption) => {
    setAccentState(newAccent);
    localStorage.setItem('abada_accent', newAccent);
  };

  const getAccentClasses = () => {
    switch (accent) {
      case 'red':
        return {
          primaryText: 'text-red-500',
          primaryBg: 'bg-red-600',
          border: 'border-red-500/40',
          gradient: 'from-red-600 to-amber-700',
          badge: 'bg-red-500/10 text-red-400 border-red-500/30',
          glow: 'shadow-red-500/20',
          ring: 'ring-red-500'
        };
      case 'green':
        return {
          primaryText: 'text-emerald-400',
          primaryBg: 'bg-emerald-600',
          border: 'border-emerald-500/40',
          gradient: 'from-emerald-600 to-teal-700',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          glow: 'shadow-emerald-500/20',
          ring: 'ring-emerald-500'
        };
      case 'blue':
        return {
          primaryText: 'text-blue-400',
          primaryBg: 'bg-blue-600',
          border: 'border-blue-500/40',
          gradient: 'from-blue-600 to-indigo-700',
          badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
          glow: 'shadow-blue-500/20',
          ring: 'ring-blue-500'
        };
      case 'purple':
        return {
          primaryText: 'text-purple-400',
          primaryBg: 'bg-purple-600',
          border: 'border-purple-500/40',
          gradient: 'from-purple-600 to-pink-700',
          badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          glow: 'shadow-purple-500/20',
          ring: 'ring-purple-500'
        };
      case 'gold':
      default:
        return {
          primaryText: 'text-amber-400',
          primaryBg: 'bg-amber-500',
          border: 'border-amber-500/40',
          gradient: 'from-amber-500 to-yellow-600',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          glow: 'shadow-amber-500/20',
          ring: 'ring-amber-500'
        };
    }
  };

  const getFontFamilyClass = () => {
    switch (font) {
      case 'cinzel':
        return "font-['Cinzel',serif]";
      case 'mono':
        return "font-['JetBrains_Mono',monospace]";
      case 'sans':
        return 'font-sans';
      case 'jakarta':
      default:
        return "font-['Plus_Jakarta_Sans',sans-serif]";
    }
  };

  return (
    <ThemeContext.Provider value={{
      font,
      accent,
      setFont,
      setAccent,
      getAccentClasses
    }}>
      <div className={`min-h-screen bg-black text-zinc-100 ${getFontFamilyClass()} antialiased selection:bg-amber-500/30 selection:text-amber-200`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
