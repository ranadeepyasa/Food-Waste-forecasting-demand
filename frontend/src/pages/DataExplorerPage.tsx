import React, { useEffect, useState } from 'react';
import {
  Database,
  Filter,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { ExplorerData, MealItem, CenterItem } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const DataExplorerPage: React.FC = () => {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCenter, setFilterCenter] = useState<string>('');
  const [filterMeal, setFilterMeal] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterCuisine, setFilterCuisine] = useState<string>('');
  const [minWeek, setMinWeek] = useState<string>('');
  const [maxWeek, setMaxWeek] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  // Load catalog for filter dropdowns
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [mList, cList] = await Promise.all([api.getMeals(), api.getCenters()]);
        setMeals(mList);
        setCenters(cList);
      } catch (e) {
        console.error("Failed to load filter metadata", e);
      }
    }
    loadCatalog();
  }, []);

  const fetchData = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await api.getExplorerData({
        centerId: filterCenter ? Number(filterCenter) : undefined,
        mealId: filterMeal ? Number(filterMeal) : undefined,
        category: filterCategory || undefined,
        cuisine: filterCuisine || undefined,
        minWeek: minWeek ? Number(minWeek) : undefined,
        maxWeek: maxWeek ? Number(maxWeek) : undefined,
        page: targetPage,
        pageSize: pageSize,
      });
      setData(res);
    } catch (err) {
      console.error("Failed to query data explorer", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    setPage(1);
  }, [filterCenter, filterMeal, filterCategory, filterCuisine, minWeek, maxWeek]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
  };

  const categories = Array.from(new Set(meals.map((m) => m.category))).sort();
  const cuisines = Array.from(new Set(meals.map((m) => m.cuisine))).sort();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-heading font-bold text-dark tracking-tight">
            Data Explorer
          </h1>
          <span className="text-[11px] font-semibold bg-gray-100 text-dark px-2.5 py-0.5 rounded-full border border-border">
            Relational View
          </span>
        </div>
        <p className="text-sm text-muted mt-1">
          Inspect, filter, and audit records across the 456,548 historical meal-center observations.
        </p>
      </div>

      {/* Dataset Health / Quality Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-card">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Dataset Size</p>
          <p className="text-xl font-heading font-bold text-dark mt-1">
            {data?.summary.dataset_size.toLocaleString() || '456,548'}
          </p>
          <p className="text-[11px] text-muted">Weekly order instances</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-card">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Features</p>
          <p className="text-xl font-heading font-bold text-dark mt-1">
            {data?.summary.columns.length || 15} Columns
          </p>
          <p className="text-[11px] text-muted">Across 3 relational tables</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-card">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Missing Values</p>
          <p className="text-xl font-heading font-bold text-success mt-1">
            {data?.summary.missing_values || 0}
          </p>
          <p className="text-[11px] text-muted">100% complete dataset</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border shadow-card">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Duplicate Rows</p>
          <p className="text-xl font-heading font-bold text-success mt-1">
            {data?.summary.duplicate_rows || 0}
          </p>
          <p className="text-[11px] text-muted">Key: (week, center, meal)</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-muted uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Multi-Criteria Query Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Center</label>
            <select
              value={filterCenter}
              onChange={(e) => setFilterCenter(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-dark focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Centers</option>
              {centers.map((c) => (
                <option key={c.center_id} value={c.center_id}>
                  Center {c.center_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Meal</label>
            <select
              value={filterMeal}
              onChange={(e) => setFilterMeal(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-dark focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Meals</option>
              {meals.map((m) => (
                <option key={m.meal_id} value={m.meal_id}>
                  Meal {m.meal_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-dark focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Cuisine</label>
            <select
              value={filterCuisine}
              onChange={(e) => setFilterCuisine(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-dark focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Cuisines</option>
              {cuisines.map((cui) => (
                <option key={cui} value={cui}>
                  {cui}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Min Week</label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={minWeek}
              onChange={(e) => setMinWeek(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-dark focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Max Week</label>
            <input
              type="number"
              placeholder="e.g. 145"
              value={maxWeek}
              onChange={(e) => setMaxWeek(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-dark focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <p className="text-muted">
            Found <span className="font-semibold text-dark">{data?.total.toLocaleString() || 0}</span> matching records
          </p>
          {(filterCenter || filterMeal || filterCategory || filterCuisine || minWeek || maxWeek) && (
            <button
              onClick={() => {
                setFilterCenter('');
                setFilterMeal('');
                setFilterCategory('');
                setFilterCuisine('');
                setMinWeek('');
                setMaxWeek('');
              }}
              className="text-primary hover:underline font-medium text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying filtered data partition..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Week</th>
                  <th className="py-3 px-4">Center</th>
                  <th className="py-3 px-4">Meal</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Cuisine</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Checkout Price</th>
                  <th className="py-3 px-4 text-center">Email Promo</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-right font-bold text-dark">Orders (Target)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data?.records.map((r) => (
                  <tr key={r.id} className="hover:bg-background/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-muted">{r.id}</td>
                    <td className="py-2.5 px-4 font-medium text-dark">W{r.week}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-dark">{r.center_id}</span>
                      <span className="text-[10px] text-muted ml-1">({r.center_type})</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-dark">{r.meal_id}</td>
                    <td className="py-2.5 px-4 text-muted">{r.category}</td>
                    <td className="py-2.5 px-4 text-muted">{r.cuisine}</td>
                    <td className="py-2.5 px-4 font-mono text-muted">₹{Number(r.base_price).toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-mono text-dark font-medium">₹{Number(r.checkout_price).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center">
                      {r.emailer_for_promotion === 1 ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-primary" title="Active"></span>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {r.homepage_featured === 1 ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-secondary" title="Active"></span>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-dark">
                      {r.num_orders.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>
              Page <span className="font-semibold text-dark">{page}</span> of{' '}
              <span className="font-semibold text-dark">{data.total_pages.toLocaleString()}</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className={`p-1.5 rounded border border-border flex items-center ${
                  page <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-background text-dark'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => handlePageChange(page + 1)}
                className={`p-1.5 rounded border border-border flex items-center ${
                  page >= data.total_pages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-background text-dark'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
