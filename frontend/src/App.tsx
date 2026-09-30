import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastPage } from './pages/ForecastPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { AboutPage } from './pages/AboutPage';
import { api } from './services/api';
import { Activity, ShieldCheck, HelpCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.getHealth();
        setBackendOnline(res.status === 'ok');
      } catch (e) {
        setBackendOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-dark flex">
      {/* Fixed Left Sidebar */}
      <Sidebar activePage={activePage} onSelectPage={setActivePage} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between sticky top-0 z-10 shadow-subtle">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-heading font-semibold text-muted uppercase tracking-wider">
              Academic ML Framework
            </span>
            <span className="text-border">/</span>
            <span className="text-xs font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-blue-200">
              ML-T2-003
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            {/* Backend Health Status Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-background border border-border">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-success animate-pulse' : 'bg-danger'
                }`}
              ></span>
              <span className="text-muted">
                {backendOnline ? 'API Connected (:8000)' : 'Connecting to API...'}
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 text-muted">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>Learn Depth Academy LLP</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigateToForecast={() => setActivePage('forecast')}
              onNavigateToPerformance={() => setActivePage('performance')}
            />
          )}
          {activePage === 'forecast' && <ForecastPage />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'performance' && <ModelPerformancePage />}
          {activePage === 'explorer' && <DataExplorerPage />}
          {activePage === 'about' && <AboutPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
