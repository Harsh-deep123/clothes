import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id?: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  buttonClassName: string;
  align?: 'left' | 'right';
  ariaLabel?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  id,
  value,
  options,
  onChange,
  buttonClassName,
  align = 'left',
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center justify-between gap-2 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-[#5d5f5f] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`absolute top-full mt-1 z-40 min-w-full w-max max-w-[18rem] max-h-72 overflow-y-auto bg-white border border-[#cfc4c5] shadow-xl py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option) => {
            const isSelected = option.value === selected?.value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs uppercase tracking-wider cursor-pointer hover:bg-[#eeeeee] ${
                    isSelected ? 'text-black font-semibold bg-[#f3f3f3]' : 'text-[#1a1c1c]'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
