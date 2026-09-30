import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  BarChart2,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { ModelMetricItem, FeatureImportanceItem, DashboardSummary } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const ModelPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricItem[]>([]);
  const [features, setFeatures] = useState<FeatureImportanceItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mList, fList, sData] = await Promise.all([
          api.getModelMetrics(),
          api.getFeatureImportance(),
          api.getDashboardSummary()
        ]);
        setMetrics(mList);
        setFeatures(fList);
        setSummary(sData);
      } catch (err) {
        console.error("Failed to load model metrics", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Retrieving actual model validation and test benchmarks..." />;

  const bestModelName = summary?.best_model || 'Gradient Boosting Regressor';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-heading font-bold text-dark tracking-tight">
            Model Performance & Benchmarks
          </h1>
          <span className="text-[11px] font-semibold bg-green-50 text-success px-2.5 py-0.5 rounded-full border border-green-200">
            Empirical Results
          </span>
        </div>
        <p className="text-sm text-muted mt-1">
          Chronological out-of-time evaluation across candidate architectures on Weeks 124–145.
        </p>
      </div>

      {/* Model Comparison Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-heading font-bold text-dark">Model Comparison Leaderboard</h2>
            <p className="text-xs text-muted">Evaluated strictly on chronological unseen test partition (No random shuffling)</p>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary-light px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
            Selected: {bestModelName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAFAF8] text-xs font-semibold text-muted uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3.5 px-6">Model Architecture</th>
                <th className="py-3.5 px-6">MAE (Orders)</th>
                <th className="py-3.5 px-6">RMSE (Orders)</th>
                <th className="py-3.5 px-6">MAPE (%)</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {metrics.map((item) => {
                const isBest = item.model === bestModelName;
                const isBaseline = item.model.includes('Baseline');
                return (
                  <tr
                    key={item.model}
                    className={`transition-colors ${
                      isBest ? 'bg-blue-50/40 font-medium' : 'hover:bg-background/60'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2.5">
                        {isBest ? (
                          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                        ) : isBaseline ? (
                          <div className="w-6 h-6 rounded-full bg-gray-200 text-muted flex items-center justify-center flex-shrink-0">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-background border border-border text-muted flex items-center justify-center flex-shrink-0">
                            <BarChart2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <p className="text-dark font-semibold">{item.model}</p>
                          <p className="text-[11px] text-muted">
                            {isBaseline
                              ? 'Historical Center-Meal Average'
                              : isBest
                              ? 'Top-performing production candidate'
                              : 'Candidate regression architecture'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-dark font-mono font-semibold">{item.MAE}</td>
                    <td className="py-4 px-6 text-dark font-mono font-semibold">{item.RMSE}</td>
                    <td className="py-4 px-6 text-dark font-mono font-semibold">{item.MAPE}%</td>
                    <td className="py-4 px-6 text-right">
                      {isBest ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-success border border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Selected
                        </span>
                      ) : isBaseline ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-muted border border-border">
                          Benchmark
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-background text-muted border border-border">
                          Evaluated
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance Section */}
      {features.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-primary" />
              <h2 className="text-base font-heading font-bold text-dark">Top Engineered Feature Importances</h2>
            </div>
            <span className="text-xs text-muted">Gini / Split Gain Importance</span>
          </div>
          <p className="text-xs text-muted mb-4">
            Relative contribution of pricing, cyclic calendar components (sine/cosine of week), center attributes, and promotional signals.
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={features.slice(0, 15)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fill: '#667085', fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fill: '#172033', fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`, 'Weight']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="importance" fill="#2563EB" radius={[0, 4, 4, 0]}>
                  {features.slice(0, 15).map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={idx === 0 ? '#1D4ED8' : idx < 3 ? '#2563EB' : '#60A5FA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Static Visualizations Grid (Actual vs Predicted & Error Distribution) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="pb-3 border-b border-border/70 mb-4">
            <h3 className="text-sm font-heading font-bold text-dark">Actual vs. Predicted Demand Scatter</h3>
            <p className="text-xs text-muted">Test set correlation and 1:1 diagonal alignment</p>
          </div>
          <div className="rounded-lg overflow-hidden border border-border bg-background">
            <img
              src="http://localhost:8000/api/charts/actual_vs_predicted.png"
              alt="Actual vs Predicted Demand"
              className="w-full h-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="pb-3 border-b border-border/70 mb-4">
            <h3 className="text-sm font-heading font-bold text-dark">Forecast Residual Error Distribution</h3>
            <p className="text-xs text-muted">Histogram of (Actual Orders - Predicted Orders) centered around 0</p>
          </div>
          <div className="rounded-lg overflow-hidden border border-border bg-background">
            <img
              src="http://localhost:8000/api/charts/error_distribution.png"
              alt="Residual Error Distribution"
              className="w-full h-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
