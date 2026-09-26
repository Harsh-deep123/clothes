import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="relative group/theme">
      <button
        type="button"
        id="theme-toggle-btn"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={isDark}
        onClick={toggleTheme}
        className="relative text-[var(--z-text)] hover:opacity-70 transition-opacity p-2 cursor-pointer active:scale-95 flex items-center justify-center"
      >
        <span className="zayro-theme-icon relative flex h-5 w-5 items-center justify-center">
          {isDark ? (
            <Sun className="w-5 h-5 stroke-[1.5]" />
          ) : (
            <Moon className="w-5 h-5 stroke-[1.5]" />
          )}
        </span>
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-[80] hidden group-hover/theme:block whitespace-nowrap bg-[var(--z-tooltip-bg)] text-[var(--z-tooltip-text)] text-[11px] tracking-wide px-3 py-2"
      >
        {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </div>
    </div>
  );
};
