import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerActions?: ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, title, className = '', headerActions, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ${className}`}
    >
      {(title || headerActions) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
