import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

interface LanguageSwitcherProps {
  variant?: 'inline' | 'compact' | 'pill' | 'header';
  theme?: 'light' | 'dark';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'inline',
  theme = 'light',
  className = '',
}) => {
  const { language, setLanguage } = useLanguageStore();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-lg border ${
          isDark ? 'bg-metal-900 border-metal-800' : 'bg-white border-stone-200 shadow-xs'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
            language === 'en'
              ? 'bg-brand-red text-white shadow-sm'
              : isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-stone-600 hover:text-stone-950'
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
              : isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-stone-600 hover:text-stone-950'
          }`}
          aria-label="ወደ አማርኛ ቀይር"
        >
          አማርኛ
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 text-xs font-semibold ${className}`}>
      <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-metal-400' : 'text-stone-500'}`} />
      <div
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${
          isDark
            ? 'bg-metal-900/90 border-metal-800'
            : 'bg-white border-stone-200 shadow-xs'
        }`}
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`transition-colors font-bold ${
            language === 'en'
              ? 'text-brand-red'
              : isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-stone-600 hover:text-stone-950'
          }`}
          aria-pressed={language === 'en'}
        >
          English
        </button>
        <span className={isDark ? 'text-metal-600 font-normal' : 'text-stone-300 font-normal'}>|</span>
        <button
          type="button"
          onClick={() => setLanguage('am')}
          className={`transition-colors font-bold font-amharic ${
            language === 'am'
              ? 'text-brand-red'
              : isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-stone-600 hover:text-stone-950'
          }`}
          aria-pressed={language === 'am'}
        >
          አማርኛ
        </button>
      </div>
    </div>
  );
};
