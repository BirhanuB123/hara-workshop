import React from 'react';
import { LucideIcon, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Layers,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="text-center py-12 px-4 bg-metal-900/50 rounded-xl border border-dashed border-metal-800 my-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-metal-800 text-brand-red mb-4 border border-metal-700">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-colors shadow-md"
          >
            <span>{actionText}</span>
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-colors shadow-md"
          >
            <span>{actionText}</span>
          </button>
        ) : null
      )}
    </div>
  );
};
