import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Tag,
  Flame,
  Globe,
  Store,
  Layers,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { ChartsData, AnalysisData } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [cData, aData] = await Promise.all([
          api.getChartsData(),
          api.getAnalysis()
        ]);
        setChartsData(cData);
        setAnalysis(aData);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating authentic dataset dimensions for analytics..." />;
  if (!chartsData) return <div className="p-8 text-center text-muted">Analytics data currently unavailable.</div>;

  const promoUplift = analysis?.promotion_comparison
    ? (
        ((analysis.promotion_comparison.emailer_active_mean - analysis.promotion_comparison.emailer_inactive_mean) /
          (analysis.promotion_comparison.emailer_inactive_mean || 1)) *
        100
      ).toFixed(1)
    : '0';

  const homeUplift = analysis?.promotion_comparison
    ? (
        ((analysis.promotion_comparison.homepage_active_mean - analysis.promotion_comparison.homepage_inactive_mean) /
          (analysis.promotion_comparison.homepage_inactive_mean || 1)) *
        100
      ).toFixed(1)
    : '0';

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-heading font-bold text-dark tracking-tight">
            Demand Analytics
          </h1>
          <span className="text-[11px] font-semibold bg-teal-50 text-secondary px-2.5 py-0.5 rounded-full border border-teal-200">
            Dataset EDA
          </span>
        </div>
        <p className="text-sm text-muted mt-1">
          Empirical patterns across weekly volume, category distributions, cuisines, centers, and promotional levers.
        </p>
      </div>

      {/* Limitation Notice Callout */}
      <div className="p-4 rounded-xl bg-[#FAFAF8] border border-border flex items-start space-x-3 text-xs text-muted shadow-subtle">
        <Info className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-dark">Data Context Acknowledgment: </span>
          {analysis?.notice || "The selected dataset does not include weather, holidays or event variables. Therefore the current implementation evaluates the contextual variables actually available in the dataset."}
        </div>
      </div>

      {/* 1. Weekly Demand Trend */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-heading font-bold text-dark">Weekly Aggregate Demand Evolution</h2>
          </div>
          <span className="text-xs text-muted">145 Consecutive Weeks</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartsData.weekly_trend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#667085', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
              <YAxis tick={{ fill: '#667085', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} orders`, 'Total Demand']} labelFormatter={(lbl) => `Week ${lbl}`} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="orders" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2 & 3: Category & Cuisine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-heading font-bold text-dark">Demand by Meal Category</h2>
            </div>
            <span className="text-xs text-muted font-medium">{chartsData.by_category.length} Categories</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.by_category} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fill: '#667085', fontSize: 10 }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <YAxis dataKey="category" type="category" tick={{ fill: '#172033', fontSize: 11 }} width={80} />
                <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} orders`, 'Total Volume']} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cuisine */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-secondary" />
              <h2 className="text-sm font-heading font-bold text-dark">Demand by Cuisine Type</h2>
            </div>
            <span className="text-xs text-muted font-medium">{chartsData.by_cuisine.length} Cuisines</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.by_cuisine} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="cuisine" tick={{ fill: '#172033', fontSize: 11 }} />
                <YAxis tick={{ fill: '#667085', fontSize: 10 }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} orders`, 'Total Volume']} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Demand by Fulfillment Center (Top 15) */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-heading font-bold text-dark">Top 15 Fulfillment Centers by Total Orders</h2>
          </div>
          <span className="text-xs text-muted font-medium">Ranked by aggregate throughput</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartsData.by_center} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="center_id" tick={{ fill: '#667085', fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: '#667085', fontSize: 10 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} orders`, 'Total Orders']} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5 & 6: Promotion & Homepage Feature Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Promotion Impact */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-heading font-bold text-dark">Email Promotion Impact</h2>
            </div>
            <span className="text-xs font-semibold text-success bg-green-50 px-2 py-0.5 rounded border border-green-200">
              +{promoUplift}% Avg Uplift
            </span>
          </div>
          <p className="text-xs text-muted mb-4">Comparison of average weekly orders per item when email promotion is active vs inactive.</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.promotion_impact} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#172033', fontSize: 12, fontWeight: 500 }} />
                <YAxis tick={{ fill: '#667085', fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val} orders/week`, 'Average Demand']} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {chartsData.promotion_impact.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#94A3B8' : '#2563EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Homepage Featured Impact */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-heading font-bold text-dark">Homepage Featured Impact</h2>
            </div>
            <span className="text-xs font-semibold text-success bg-green-50 px-2 py-0.5 rounded border border-green-200">
              +{homeUplift}% Avg Uplift
            </span>
          </div>
          <p className="text-xs text-muted mb-4">Comparison of average weekly orders per item when featured on the meal app homepage.</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.featured_impact} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#172033', fontSize: 12, fontWeight: 500 }} />
                <YAxis tick={{ fill: '#667085', fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val} orders/week`, 'Average Demand']} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {chartsData.featured_impact.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#94A3B8' : '#0F766E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
