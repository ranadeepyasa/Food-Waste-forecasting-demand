import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant: 'success' | 'primary' | 'warning' | 'neutral';
  };
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, badge }) => {
  const badgeClasses = {
    success: 'bg-green-50 text-success border-green-200',
    primary: 'bg-primary-light text-primary border-blue-200',
    warning: 'bg-amber-50 text-warning border-amber-200',
    neutral: 'bg-gray-50 text-muted border-border',
  };

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-heading font-bold text-dark mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-primary shadow-subtle">
            {icon}
          </div>
        )}
      </div>
      {badge && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full border ${badgeClasses[badge.variant]}`}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
};
