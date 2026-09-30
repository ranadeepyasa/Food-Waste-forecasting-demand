import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Store,
  Utensils,
  DollarSign,
  Tag,
  Mail,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { MealItem, CenterItem, PredictResponse, DemandHistoryPoint } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CenterSearchDropdown, formatCenterType, formatCenterLabel } from '../components/CenterSearchDropdown';
import { getCityDisplayName } from '../cityDisplayNames';

export const ForecastPage: React.FC = () => {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [week, setWeek] = useState<number>(146);
  const [centerId, setCenterId] = useState<number>(55);
  const [mealId, setMealId] = useState<number>(1885);
  const [basePrice, setBasePrice] = useState<number>(140.69);
  const [checkoutPrice, setCheckoutPrice] = useState<number>(136.83);
  const [emailPromo, setEmailPromo] = useState<number>(0);
  const [homeFeatured, setHomeFeatured] = useState<number>(0);

  // Inference state
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Demand history for selected pair
  const [history, setHistory] = useState<DemandHistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingInitial(true);
        const [mealsData, centersData] = await Promise.all([
          api.getMeals(),
          api.getCenters()
        ]);
        setMeals(mealsData);
        setCenters(centersData);
        if (centersData.length > 0) setCenterId(centersData[0].center_id);
        if (mealsData.length > 0) setMealId(mealsData[0].meal_id);
      } catch (err: any) {
        setError("Failed to load catalog data from backend.");
      } finally {
        setLoadingInitial(false);
      }
    }
    loadCatalog();
  }, []);

  // Fetch historical context whenever center or meal changes
  useEffect(() => {
    if (!centerId || !mealId) return;
    async function fetchHistory() {
      try {
        setLoadingHistory(true);
        const data = await api.getDemandHistory(centerId, mealId);
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch demand history", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, [centerId, mealId]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutPrice > basePrice) {
      setError("Checkout price cannot exceed catalog base price.");
      return;
    }
    if (checkoutPrice <= 0 || basePrice <= 0) {
      setError("Prices must be strictly positive numerical values.");
      return;
    }

    try {
      setPredicting(true);
      setError(null);
      const res = await api.predictDemand({
        week: Number(week),
        center_id: Number(centerId),
        meal_id: Number(mealId),
        checkout_price: Number(checkoutPrice),
        base_price: Number(basePrice),
        emailer_for_promotion: Number(emailPromo),
        homepage_featured: Number(homeFeatured),
      });
      setResult(res);
      setToastMessage("Demand forecast generated successfully using the real ML pipeline!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to generate forecast.");
    } finally {
      setPredicting(false);
    }
  };

  const selectedMeal = meals.find((m) => m.meal_id === Number(mealId));
  const selectedCenter = centers.find((c) => c.center_id === Number(centerId));
  const discountPercent = basePrice > 0 ? (((basePrice - checkoutPrice) / basePrice) * 100).toFixed(1) : '0';

  if (loadingInitial) return <LoadingSpinner message="Loading meals and fulfillment centers catalog..." />;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 flex items-center space-x-2 bg-dark text-white px-4 py-3 rounded-xl shadow-lg border border-border/20 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-heading font-bold text-dark tracking-tight">
            Demand Forecast
          </h1>
          <span className="text-[11px] font-semibold bg-primary-light text-primary px-2.5 py-0.5 rounded-full border border-blue-200">
            Live ML Inference
          </span>
        </div>
        <p className="text-sm text-muted mt-1">
          Generate a demand forecast using historical and operational information.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-danger text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Prediction Form & Result Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel (7 cols) */}
        <div className="lg:col-span-7 bg-card rounded-xl border border-border p-6 shadow-card">
          <form onSubmit={handlePredict} className="space-y-5">
            <div className="pb-3 border-b border-border/70">
              <h2 className="text-sm font-heading font-bold text-dark">Forecast Parameters</h2>
              <p className="text-xs text-muted">Input operational targets and promotional flags</p>
            </div>

            {/* Target Week */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Forecast Target Week
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={250}
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted">Weeks 1-145 in training set</span>
              </div>
            </div>

            {/* Center & Meal Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Fulfillment Center</span>
                  {selectedCenter && (
                    <span className="text-[10px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                      {formatCenterType(selectedCenter.center_type)}
                    </span>
                  )}
                </label>
                <CenterSearchDropdown
                  centers={centers}
                  selectedCenterId={centerId}
                  onSelect={(id) => setCenterId(id)}
                  disabled={predicting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Meal Item</span>
                  <span className="text-[10px] text-secondary">{selectedMeal?.category}</span>
                </label>
                <select
                  value={mealId}
                  onChange={(e) => setMealId(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {meals.map((m) => (
                    <option key={m.meal_id} value={m.meal_id}>
                      Meal {m.meal_id} ({m.category} • {m.cuisine})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Base Price (₹ / $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Checkout Price</span>
                  {Number(discountPercent) > 0 && (
                    <span className="text-[10px] font-semibold text-success">{discountPercent}% Off</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={checkoutPrice}
                  onChange={(e) => setCheckoutPrice(Number(e.target.value))}
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Promotion Toggles */}
            <div className="p-4 rounded-lg bg-background border border-border/80 space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Promotional Channels</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center space-x-3 p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={emailPromo === 1}
                    onChange={(e) => setEmailPromo(e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border"
                  />
                  <div>
                    <span className="text-xs font-semibold text-dark block">Email Promotion</span>
                    <span className="text-[10px] text-muted block">Direct customer marketing push</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={homeFeatured === 1}
                    onChange={(e) => setHomeFeatured(e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border"
                  />
                  <div>
                    <span className="text-xs font-semibold text-dark block">Homepage Featured</span>
                    <span className="text-[10px] text-muted block">App front banner placement</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={predicting}
              className={`w-full py-3 rounded-lg text-sm font-semibold text-white transition-all shadow-sm flex items-center justify-center space-x-2 ${
                predicting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
              }`}
            >
              {predicting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Running ML Model...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Predict Demand</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Highlight Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Forecast Output</span>
                {result ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-success border border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Computed
                  </span>
                ) : (
                  <span className="text-[11px] text-muted">Awaiting Input</span>
                )}
              </div>

              {result ? (
                <div className="space-y-5 animate-in fade-in">
                  {/* Large metric 1: Predicted Demand */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Predicted Demand</p>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-heading font-extrabold text-dark tracking-tight">
                        {result.predicted_demand}
                      </span>
                      <span className="text-sm font-semibold text-muted">orders</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">Continuous expected demand forecast</p>
                  </div>

                  {/* Large metric 2: Suggested Preparation */}
                  <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Suggested Preparation</p>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-heading font-extrabold text-dark tracking-tight">
                        {result.suggested_preparation}
                      </span>
                      <span className="text-sm font-semibold text-muted">units</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">Integer operational preparation directive</p>
                  </div>

                  {/* Model Used */}
                  <div className="p-3 rounded-lg bg-background border border-border/80">
                    <p className="text-[11px] font-semibold text-muted uppercase">Model Used</p>
                    <p className="text-xs font-bold text-dark mt-0.5">{result.model}</p>
                  </div>

                  {/* Demonstration Rule Explanation Callout */}
                  <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-warning font-semibold">
                      <Info className="w-3.5 h-3.5" />
                      <span>Demonstration Rule Notice</span>
                    </div>
                    <p className="text-[11px] text-dark/80 leading-relaxed">
                      "The preparation quantity shown here is a simple demonstration rule that rounds the forecast upward to a whole unit."
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center mx-auto text-muted">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">No Forecast Generated Yet</p>
                    <p className="text-xs text-muted max-w-xs mx-auto mt-1">
                      Adjust the operational parameters on the left and click "Predict Demand" to query the trained machine learning model.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Context meta summary */}
            {selectedMeal && selectedCenter && (
              <div className="pt-4 mt-4 border-t border-border/70 text-[11px] text-muted flex flex-wrap justify-between gap-1">
                <span>{selectedMeal.cuisine} Cuisine • {selectedMeal.category}</span>
                <span>{getCityDisplayName(selectedCenter.city_code)} (Code {selectedCenter.city_code}) • {formatCenterType(selectedCenter.center_type)} • {selectedCenter.op_area} km²</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demand History Chart for Selected Center and Meal */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/70 mb-4 gap-2">
          <div>
            <h2 className="text-sm font-heading font-bold text-dark">
              Recent Demand History: {selectedCenter ? formatCenterLabel(selectedCenter) : `Center ${centerId}`} — Meal {mealId}
            </h2>
            <p className="text-xs text-muted">Historical weekly actual orders for this specific center and meal combination</p>
          </div>
          <span className="text-xs text-muted font-medium bg-background px-2.5 py-1 rounded border border-border">
            {history.length} observation weeks recorded
          </span>
        </div>

        {loadingHistory ? (
          <div className="h-48 flex items-center justify-center">
            <LoadingSpinner message="Fetching historical weekly trend..." />
          </div>
        ) : history.length > 0 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#667085', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{ value: 'Week', position: 'insideBottom', offset: -4, fill: '#667085', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: '#667085', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} orders`, 'Actual Demand']}
                  labelFormatter={(lbl) => `Week ${lbl}`}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="num_orders"
                  stroke="#0F766E"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#0F766E' }}
                  activeDot={{ r: 5, fill: '#0F766E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted py-6 text-center">
            No historical records found for this specific combination.
          </p>
        )}
      </div>
    </div>
  );
};
