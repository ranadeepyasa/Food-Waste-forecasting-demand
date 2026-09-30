import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Utensils,
  Store,
  Award,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardSummary, ChartsData, AnalysisData } from '../types';
import { KPICard } from '../components/KPICard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DashboardPageProps {
  onNavigateToForecast: () => void;
  onNavigateToPerformance: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToForecast,
  onNavigateToPerformance,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, chartsRes, anaRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getChartsData(),
          api.getAnalysis(),
        ]);
        setSummary(sumRes);
        setChartsData(chartsRes);
        setAnalysis(anaRes);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard summary:', err);
        setError(err.message || 'Failed to load dashboard data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading academic dataset and model telemetry..." />;

  if (error || !summary) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-3" />
          <h3 className="font-heading font-semibold text-lg text-dark">Data Unavailable</h3>
          <p className="text-sm text-muted mt-1">{error || 'Unable to connect to ML Backend.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-dark tracking-tight">
          Food Demand Forecasting
        </h1>
        <p className="text-sm text-muted mt-1">
          Forecast demand smarter. Prepare better. Reduce avoidable waste.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Historical Orders"
          value={summary.total_orders.toLocaleString()}
          subtitle={`Across ${summary.total_historical_records.toLocaleString()} weekly records`}
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <KPICard
          title="Average Weekly Demand"
          value={`${summary.average_orders} units`}
          subtitle="Mean orders per center-meal item"
          icon={<TrendingUp className="w-5 h-5 text-secondary" />}
        />
        <KPICard
          title="Food Items"
          value={summary.number_of_meals}
          subtitle="Catalog meals across 8 categories"
          icon={<Utensils className="w-5 h-5 text-warning" />}
        />
        <KPICard
          title="Fulfillment Centers"
          value={summary.number_of_fulfillment_centers}
          subtitle="Warehouses in 51 operational cities"
          icon={<Store className="w-5 h-5 text-primary" />}
        />
      </div>

      {/* Weekly Demand Trend Chart */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/70 mb-4 gap-2">
          <div>
            <h2 className="font-heading font-bold text-base text-dark">Aggregate Demand Trend</h2>
            <p className="text-xs text-muted">Weekly cumulative orders over 145 chronological observation weeks</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-primary"></span>
              <span className="text-muted">Total Orders</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-warning"></span>
              <span className="text-muted">Val Split (W101)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-danger"></span>
              <span className="text-muted">Test Split (W123)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartsData && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData.weekly_trend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#667085', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{ value: 'Week Number', position: 'insideBottom', offset: -4, fill: '#667085', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: '#667085', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} orders`, 'Weekly Total']}
                  labelFormatter={(lbl) => `Week ${lbl}`}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <ReferenceLine x={101} stroke="#D97706" strokeDasharray="3 3" label={{ value: 'Train/Val', position: 'insideTopLeft', fill: '#D97706', fontSize: 10 }} />
                <ReferenceLine x={123} stroke="#DC2626" strokeDasharray="3 3" label={{ value: 'Val/Test', position: 'insideTopLeft', fill: '#DC2626', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Secondary Cards: Model Performance & Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Performance Card */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-sm text-dark">Model Performance</h2>
                  <p className="text-[11px] text-muted">Validated on chronological out-of-time test set</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-success border border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Best Model
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-background border border-border/70 mb-4">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold">Active Algorithm</p>
              <p className="text-base font-heading font-bold text-dark mt-0.5">{summary.best_model}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card text-center">
                <p className="text-[11px] font-semibold text-muted uppercase">MAE</p>
                <p className="text-lg font-bold font-heading text-dark mt-1">{summary.MAE}</p>
                <p className="text-[10px] text-muted mt-0.5">Mean Absolute Error</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card text-center">
                <p className="text-[11px] font-semibold text-muted uppercase">RMSE</p>
                <p className="text-lg font-bold font-heading text-dark mt-1">{summary.RMSE}</p>
                <p className="text-[10px] text-muted mt-0.5">Root Mean Squared</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card text-center">
                <p className="text-[11px] font-semibold text-muted uppercase">MAPE</p>
                <p className="text-lg font-bold font-heading text-dark mt-1">{summary.MAPE}%</p>
                <p className="text-[10px] text-muted mt-0.5">Percentage Error</p>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToPerformance}
            className="mt-5 flex items-center justify-center space-x-1.5 text-xs font-semibold text-primary hover:text-primary-hover p-2 rounded-lg hover:bg-primary-light transition-colors"
          >
            <span>View Complete Model Comparison & Benchmarks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Operational Overview Card */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-secondary flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-sm text-dark">Operational Overview</h2>
                  <p className="text-[11px] text-muted">Preparation suggestion risk telemetry</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-muted bg-background px-2 py-0.5 rounded border border-border">
                Rule: ceil(pred)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-lg border border-border bg-background">
                <p className="text-[11px] font-semibold text-muted uppercase">Avg Over-Preparation</p>
                <p className="text-xl font-heading font-bold text-dark mt-1">
                  {summary.operational_overview?.average_over_preparation ?? 0}
                  <span className="text-xs font-normal text-muted ml-1">units/item</span>
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  Occurred in {summary.operational_overview?.percentage_over_preparation ?? 0}% of instances
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-background">
                <p className="text-[11px] font-semibold text-muted uppercase">Avg Shortage</p>
                <p className="text-xl font-heading font-bold text-dark mt-1">
                  {summary.operational_overview?.average_shortage ?? 0}
                  <span className="text-xs font-normal text-muted ml-1">units/item</span>
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  Occurred in {summary.operational_overview?.percentage_shortage ?? 0}% of instances
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-white text-xs space-y-1 text-muted">
              <p className="font-semibold text-dark flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></span>
                Demonstration Buffer Heuristic
              </p>
              <p className="text-[11px] leading-relaxed">
                The ceiling operator guarantees integral preparation units. This demo metric reflects physical unit variance and is not a financial waste calculation.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToForecast}
            className="mt-5 w-full flex items-center justify-center space-x-1.5 text-xs font-semibold bg-secondary text-white py-2.5 rounded-lg hover:bg-secondary-hover shadow-sm transition-colors"
          >
            <span>Launch Live Demand Predictor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
