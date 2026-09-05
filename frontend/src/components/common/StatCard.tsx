import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
}) => {
  return (
    <div className={`bg-metal-900 border border-metal-800 rounded-xl p-5 shadow-lg flex items-center justify-between ${className}`}>
      <div>
        <p className="text-xs font-semibold text-metal-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1 font-mono tracking-tight">{value}</h3>
        {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}
        {trend && <p className="text-[11px] text-brand-red font-semibold mt-1">{trend}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl bg-metal-800/80 border border-metal-700/60 flex items-center justify-center text-brand-red flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
