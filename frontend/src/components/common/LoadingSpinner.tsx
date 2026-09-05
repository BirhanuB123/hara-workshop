import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = 'Loading workshop data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <div className="w-10 h-10 border-3 border-metal-700 border-t-brand-red rounded-full animate-spin" />
      <span className="text-xs font-semibold text-metal-400 uppercase tracking-wider">{text}</span>
    </div>
  );
};
