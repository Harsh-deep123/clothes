import React from 'react';
import { X } from 'lucide-react';
import { ViewScreen } from '../types';
import { LoginPage } from './pages/AuthPages';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => string | null | Promise<string | null>;
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-10 my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-black hover:opacity-60 transition-opacity"
          aria-label="Close login"
        >
          <X className="w-5 h-5" />
        </button>
        <LoginPage
          embedded
          onLogin={onLogin}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};
