import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendColor?: 'green' | 'red' | 'blue' | 'slate';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  trendColor = 'slate',
}) => {
  const trendColors = {
    green: 'text-emerald-600 bg-emerald-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-sky-600 bg-sky-50',
    slate: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start justify-between">
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h4>
        {(description || trend) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${trendColors[trendColor]}`}>
                {trend}
              </span>
            )}
            {description && <span className="text-xs text-slate-400">{description}</span>}
          </div>
        )}
      </div>
      <div className="p-3 bg-primary-50 rounded-lg text-primary-600 border border-primary-100">
        {icon}
      </div>
    </div>
  );
};
