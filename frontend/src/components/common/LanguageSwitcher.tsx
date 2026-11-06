import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

interface LanguageSwitcherProps {
  variant?: 'inline' | 'compact' | 'pill' | 'header';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'inline',
  className = '',
}) => {
  const { language, setLanguage } = useLanguageStore();

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-0.5 rounded-lg bg-metal-900 border border-metal-800 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
            language === 'en'
              ? 'bg-brand-red text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-label="Switch to English"
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('am')}
          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all font-amharic ${
            language === 'am'
              ? 'bg-brand-red text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-label="ወደ አማርኛ ቀይር"
        >
          አማርኛ
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 text-xs font-semibold select-none ${className}`}>
      <Globe className="w-3.5 h-3.5 text-metal-400" />
      <div className="flex items-center space-x-1.5 bg-metal-900/90 px-2.5 py-1 rounded-lg border border-metal-800">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`transition-colors font-bold ${
            language === 'en'
              ? 'text-brand-red drop-shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-pressed={language === 'en'}
        >
          English
        </button>
        <span className="text-metal-600 font-normal">|</span>
        <button
          type="button"
          onClick={() => setLanguage('am')}
          className={`transition-colors font-bold font-amharic ${
            language === 'am'
              ? 'text-brand-red drop-shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-pressed={language === 'am'}
        >
          አማርኛ
        </button>
      </div>
    </div>
  );
};
