import React from 'react';
import { ViewScreen } from '../../types';

interface InfoPageShellProps {
  eyebrow: string;
  title: string;
  intro?: string;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  children: React.ReactNode;
}

export const InfoPageShell: React.FC<InfoPageShellProps> = ({
  eyebrow,
  title,
  intro,
  onNavigate,
  children,
}) => {
  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20 md:pb-28">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="text-xs uppercase tracking-[0.15em] font-medium text-[#5d5f5f] hover:text-black hover:underline transition-all cursor-pointer mb-8 md:mb-10"
      >
        Back to Home
      </button>

      <div className="mb-10 md:mb-14 max-w-3xl">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-3">
          {eyebrow}
        </span>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase text-black font-normal">
          {title}
        </h1>
        {intro && (
          <p className="text-base sm:text-lg text-[#5d5f5f] mt-4 md:mt-5 max-w-2xl font-light leading-relaxed">
            {intro}
          </p>
        )}
      </div>

      {children}
    </main>
  );
};

interface SectionHeadingProps {
  children: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ children }) => (
  <h2 className="font-serif-luxury text-2xl sm:text-3xl text-black font-normal tracking-tight mb-4">
    {children}
  </h2>
);

export const BodyText: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <p className={`text-sm sm:text-base text-[#5d5f5f] font-light leading-relaxed ${className}`}>
    {children}
  </p>
);
