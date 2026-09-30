import {
  DashboardSummary,
  MealItem,
  CenterItem,
  DemandHistoryPoint,
  PredictRequest,
  PredictResponse,
  ModelMetricItem,
  FeatureImportanceItem,
  AnalysisData,
  ChartsData,
  ExplorerData
} from '../types';

const BASE_URL = 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An unexpected server error occurred';
    try {
      const data = await res.json();
      if (data && data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse(res);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${BASE_URL}/dashboard-summary`);
    return handleResponse(res);
  },

  async getMeals(): Promise<MealItem[]> {
    const res = await fetch(`${BASE_URL}/meals`);
    return handleResponse(res);
  },

  async getCenters(): Promise<CenterItem[]> {
    const res = await fetch(`${BASE_URL}/centers`);
    return handleResponse(res);
  },

  async getDemandHistory(centerId: number, mealId: number): Promise<DemandHistoryPoint[]> {
    const res = await fetch(`${BASE_URL}/demand-history?center_id=${centerId}&meal_id=${mealId}`);
    return handleResponse(res);
  },

  async predictDemand(payload: PredictRequest): Promise<PredictResponse> {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getModelMetrics(): Promise<ModelMetricItem[]> {
    const res = await fetch(`${BASE_URL}/model-metrics`);
    return handleResponse(res);
  },

  async getFeatureImportance(): Promise<FeatureImportanceItem[]> {
    const res = await fetch(`${BASE_URL}/feature-importance`);
    return handleResponse(res);
  },

  async getAnalysis(): Promise<AnalysisData> {
    const res = await fetch(`${BASE_URL}/analysis`);
    return handleResponse(res);
  },

  async getChartsData(): Promise<ChartsData> {
    const res = await fetch(`${BASE_URL}/charts-data`);
    return handleResponse(res);
  },

  async getExplorerData(params: {
    centerId?: number;
    mealId?: number;
    category?: string;
    cuisine?: string;
    minWeek?: number;
    maxWeek?: number;
    page?: number;
    pageSize?: number;
  }): Promise<ExplorerData> {
    const query = new URLSearchParams();
    if (params.centerId) query.set('center_id', params.centerId.toString());
    if (params.mealId) query.set('meal_id', params.mealId.toString());
    if (params.category) query.set('category', params.category);
    if (params.cuisine) query.set('cuisine', params.cuisine);
    if (params.minWeek) query.set('min_week', params.minWeek.toString());
    if (params.maxWeek) query.set('max_week', params.maxWeek.toString());
    query.set('page', (params.page || 1).toString());
    query.set('page_size', (params.pageSize || 25).toString());

    const res = await fetch(`${BASE_URL}/explorer?${query.toString()}`);
    return handleResponse(res);
  }
};
