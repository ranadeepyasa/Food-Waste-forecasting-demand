import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Award,
  Database,
  Info,
  UtensilsCrossed,
  Layers
} from 'lucide-react';

export type PageId = 'dashboard' | 'forecast' | 'analytics' | 'performance' | 'explorer' | 'about';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage }) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'forecast', label: 'Demand Forecast', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'performance', label: 'Model Performance', icon: <Award className="w-5 h-5" /> },
    { id: 'explorer', label: 'Data Explorer', icon: <Database className="w-5 h-5" /> },
    { id: 'about', label: 'About Project', icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col justify-between fixed left-0 top-0 z-20 select-none shadow-subtle">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-border flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-base text-dark tracking-tight">Food Demand AI</h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success"></span>
              <p className="text-[11px] font-medium text-muted">ML-T2-003 • v1.0</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-light text-primary font-semibold border-l-4 border-primary pl-2.5 shadow-sm'
                    : 'text-muted hover:text-dark hover:bg-background'
                }`}
              >
                <span className={isActive ? 'text-primary' : 'text-muted'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Accreditation */}
      <div className="p-4 border-t border-border bg-[#FAFAF8]">
        <div className="flex items-center space-x-2 text-xs text-muted font-medium mb-1">
          <Layers className="w-3.5 h-3.5 text-secondary" />
          <span>Academic Internship</span>
        </div>
        <p className="text-xs font-semibold text-dark">Learn Depth Academy LLP</p>
        <p className="text-[11px] text-muted">Track 2 – Advanced ML</p>
      </div>
    </aside>
  );
};
