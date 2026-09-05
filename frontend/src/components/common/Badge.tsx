import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const variants = {
    gray: 'bg-metal-800 text-gray-300 border-metal-700',
    red: 'bg-brand-red/20 text-brand-red border-brand-red/30',
    green: 'bg-emerald-950 text-emerald-400 border-emerald-800/60',
    blue: 'bg-blue-950 text-blue-400 border-blue-800/60',
    yellow: 'bg-amber-950 text-amber-400 border-amber-800/60',
    purple: 'bg-purple-950 text-purple-400 border-purple-800/60',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs font-semibold',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
