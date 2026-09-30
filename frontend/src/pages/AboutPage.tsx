import React from 'react';
import {
  Info,
  Layers,
  Award,
  AlertCircle,
  TrendingUp,
  Cpu,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-heading font-bold text-dark tracking-tight">
            About Project
          </h1>
          <span className="text-[11px] font-semibold bg-primary-light text-primary px-2.5 py-0.5 rounded-full border border-blue-200">
            ML-T2-003
          </span>
        </div>
        <p className="text-sm text-muted mt-1">
          Learn Depth Academy LLP • Track 2 – Advanced Machine Learning Internship
        </p>
      </div>

      {/* Critical Academic Notice */}
      <div className="p-5 rounded-xl border border-amber-300 bg-amber-50/70 shadow-sm flex items-start space-x-3.5">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-dark uppercase tracking-wider">
            Dataset Context & Limitations Disclosure
          </h3>
          <p className="text-xs text-dark/90 leading-relaxed font-medium">
            "The selected dataset does not include weather, holidays or event variables. Therefore the current implementation evaluates the contextual variables actually available in the dataset."
          </p>
          <p className="text-[11px] text-muted">
            Rather than synthesizing non-existent external features, this model operates strictly on authentic physical fulfillment center attributes, meal categories, pricing dynamics, cyclic calendar representations, and active promotional campaigns.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-2">
          <div className="flex items-center space-x-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Problem Statement & Objective</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Food service and meal delivery fulfillment networks struggle with inventory mismatches. Over-preparing perishable meals leads to acute food waste, while under-preparing incurs costly stockouts. The objective is to produce accurate weekly demand forecasts that convert directly into actionable preparation quantities while continuously monitoring operational shortage risks.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-2">
          <div className="flex items-center space-x-2 text-secondary font-semibold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Methodology & Validation</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Forecasting requires strict temporal fidelity. The 145-week observation timeline was sorted chronologically into 70% Training (Weeks 1–101), 15% Validation (Weeks 102–123), and 15% Test (Weeks 124–145). Random data shuffling was strictly prohibited to guarantee realistic zero-leakage out-of-time evaluation.
          </p>
        </div>
      </div>

      {/* ML Pipeline & Architecture */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="text-sm font-heading font-bold text-dark flex items-center space-x-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Feature Engineering Pipeline</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-background border border-border space-y-1">
            <p className="font-semibold text-dark font-mono">week_sin / week_cos</p>
            <p className="text-muted text-[11px]">sin(2π · week / 52) and cos(2π · week / 52) capture recurring annual seasonal cycles.</p>
          </div>
          <div className="p-3 rounded-lg bg-background border border-border space-y-1">
            <p className="font-semibold text-dark font-mono">price_difference</p>
            <p className="text-muted text-[11px]">base_price - checkout_price measures absolute consumer price discount.</p>
          </div>
          <div className="p-3 rounded-lg bg-background border border-border space-y-1">
            <p className="font-semibold text-dark font-mono">discount_ratio</p>
            <p className="text-muted text-[11px]">(base_price - checkout_price) / base_price quantifies relative percentage savings.</p>
          </div>
          <div className="p-3 rounded-lg bg-background border border-border space-y-1">
            <p className="font-semibold text-dark font-mono">promotion_any</p>
            <p className="text-muted text-[11px]">Binary flag active if either direct emailer campaign or homepage featured placement is active.</p>
          </div>
        </div>
      </div>

      {/* Model Benchmark Architecture */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-3">
        <h2 className="text-sm font-heading font-bold text-dark flex items-center space-x-2">
          <Award className="w-4 h-4 text-secondary" />
          <span>Trained Model Architectures</span>
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between font-semibold text-dark">
              <span>1. Historical Mean Baseline</span>
              <span className="text-[11px] text-muted">Benchmark Control</span>
            </div>
            <p className="text-muted mt-1 text-[11px]">
              Calculates the historical average demand for each unique center-meal pair over the training timeline. Provides an interpretable reference point for measuring genuine ML uplift.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between font-semibold text-dark">
              <span>2. Linear Regression (L2 Regularized Ridge)</span>
              <span className="text-[11px] text-primary">Parametric Baseline</span>
            </div>
            <p className="text-muted mt-1 text-[11px]">
              Fast linear model with L2 weight decay penalty applied over the scaled numerical features and one-hot encoded category/center indicators.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between font-semibold text-dark">
              <span>3. Gradient Boosting Regressor (HistGradientBoosting)</span>
              <span className="text-[11px] text-success font-bold">Top Performing</span>
            </div>
            <p className="text-muted mt-1 text-[11px]">
              Histogram-based gradient boosted decision tree ensemble. Bins continuous features into integer bins to optimize split evaluation and capture non-linear feature interactions with minimal memory overhead.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between font-semibold text-dark">
              <span>4. Random Forest Regressor</span>
              <span className="text-[11px] text-muted">Ensemble Baseline</span>
            </div>
            <p className="text-muted mt-1 text-[11px]">
              Bagged forest of decision trees trained on randomized subsets of features, offering robust variance reduction and non-linear regression boundaries.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Rules & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-2">
          <h3 className="font-heading font-bold text-dark text-sm">Operational Buffer Rule</h3>
          <p className="text-muted text-[11px] leading-relaxed">
            The suggested preparation directive uses <code className="text-primary bg-primary-light px-1 py-0.5 rounded font-mono">suggested_preparation = ceil(predicted_demand)</code>. This ensures physical unit integrity. While it provides an upper bound demonstration, it is explicitly not an optimized financial safety stock calculation.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-2">
          <h3 className="font-heading font-bold text-dark text-sm">Future Improvements</h3>
          <ul className="list-disc list-inside text-muted text-[11px] space-y-1">
            <li>Dynamic safety buffer optimization based on asymmetric cost matrices (cost of waste vs cost of shortage).</li>
            <li>Lagged autoregressive features across rolling multi-week windows.</li>
            <li>Deep learning sequence models (Temporal Fusion Transformers / LSTMs).</li>
            <li>Direct integration of live weather radar API data when operational telemetry permits.</li>
          </ul>
        </div>
      </div>

      {/* Institutional Signoff */}
      <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-2">
        <span>Project ID: <strong className="text-dark">ML-T2-003</strong></span>
        <span>Learn Depth Academy LLP • Advanced Machine Learning</span>
        <span className="text-success font-medium">Production Release v1.0</span>
      </div>
    </div>
  );
};
