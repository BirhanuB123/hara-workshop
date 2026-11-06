import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, LogIn, UserPlus, X } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  returnUrl?: string;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  returnUrl,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguageStore();

  if (!isOpen) return null;

  const displayTitle = title || t('authModal.signInTitle');
  const displayDescription = description || t('authModal.signInDesc');
  const targetUrl = returnUrl || (location.pathname + location.search);

  const handleSignIn = () => {
    onClose();
    navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
  };

  const handleCreateAccount = () => {
    onClose();
    navigate(`/register?redirect=${encodeURIComponent(targetUrl)}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-metal-900 border border-metal-700 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-metal-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red flex items-center justify-center mx-auto shadow-lg shadow-brand-red/10">
          <Lock className="w-7 h-7" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {displayTitle}
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xs mx-auto">
            {displayDescription}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleSignIn}
            className="w-full inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-900/20"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('navigation.signIn')}</span>
          </button>

          <button
            onClick={handleCreateAccount}
            className="w-full inline-flex items-center justify-center space-x-2 bg-metal-800 hover:bg-metal-700 text-white font-semibold py-3 px-4 rounded-xl text-xs uppercase tracking-wider border border-metal-700 hover:border-metal-600 transition"
          >
            <UserPlus className="w-4 h-4 text-brand-red" />
            <span>{t('navigation.createAccount')}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full text-xs font-semibold text-gray-400 hover:text-gray-200 py-2 transition"
          >
            {t('authModal.continueBrowsing')}
          </button>
        </div>

        <div className="pt-3 border-t border-metal-800/80 text-[11px] text-gray-400">
          {t('authModal.preservedNotice')}
        </div>
      </div>
    </div>
  );
};
