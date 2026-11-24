import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

const LABELS = {
  light: 'Switch to Dark Mode',
  dark: 'Switch to Auto Mode',
  auto: 'Switch to Light Mode',
} as const;

export const ThemeToggle: React.FC = () => {
  const { preference, isDark, toggleTheme } = useTheme();

  return (
    <div className="relative group/theme">
      <button
        type="button"
        id="theme-toggle-btn"
        aria-label={LABELS[preference]}
        aria-pressed={isDark}
        onClick={toggleTheme}
        className="relative text-[var(--z-text)] hover:opacity-70 transition-opacity p-2 cursor-pointer active:scale-95 flex items-center justify-center"
      >
        <span className="zayro-theme-icon relative flex h-5 w-5 items-center justify-center">
          {preference === 'auto' ? (
            <Monitor className="w-5 h-5 stroke-[1.5]" />
          ) : preference === 'dark' ? (
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
        {LABELS[preference]}
      </div>
    </div>
  );
};
