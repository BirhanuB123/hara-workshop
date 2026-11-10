import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  tone?: 'light' | 'dark';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading workshop data...',
  tone = 'light',
}) => {
  const isDark = tone === 'dark';
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-16 text-center space-y-3"
    >
      <div
        className={`w-10 h-10 border-3 border-t-brand-red rounded-full animate-spin ${
          isDark ? 'border-metal-700' : 'border-stone-200'
        }`}
      />
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${
          isDark ? 'text-metal-400' : 'text-stone-500'
        }`}
      >
        {text}
      </span>
    </div>
  );
};
