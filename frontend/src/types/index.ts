export interface DashboardSummary {
  total_historical_records: number;
  total_orders: number;
  average_orders: number;
  number_of_meals: number;
  number_of_fulfillment_centers: number;
  best_model: string;
  MAE: number;
  RMSE: number;
  MAPE: number;
  operational_overview?: {
    average_over_preparation: number;
    average_shortage: number;
    percentage_over_preparation: number;
    percentage_shortage: number;
    demonstration_rule: string;
  };
}

export interface MealItem {
  meal_id: number;
  category: string;
  cuisine: string;
}

export interface CenterItem {
  center_id: number;
  city_code: number;
  region_code: number;
  center_type: string;
  op_area: number;
}

export interface DemandHistoryPoint {
  week: number;
  checkout_price: number;
  base_price: number;
  emailer_for_promotion: number;
  homepage_featured: number;
  num_orders: number;
}

export interface PredictRequest {
  week: number;
  center_id: number;
  meal_id: number;
  checkout_price: number;
  base_price: number;
  emailer_for_promotion: number;
  homepage_featured: number;
}

export interface PredictResponse {
  predicted_demand: number;
  suggested_preparation: number;
  model: string;
  rule_notice?: string;
  context?: {
    category: string;
    cuisine: string;
    center_type: string;
    op_area: number;
  };
}

export interface ModelMetricItem {
  model: string;
  MAE: number;
  RMSE: number;
  MAPE: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface AnalysisData {
  demand_stats: {
    average_demand: number;
    maximum_demand: number;
    minimum_demand: number;
    median_demand: number;
    std_demand: number;
  };
  unusual_demand: {
    threshold_percentile: number;
    threshold_value: number;
    normal_count: number;
    unusual_count: number;
    normal_metrics: { mae: number; rmse: number; mape: number };
    unusual_metrics: { mae: number; rmse: number; mape: number };
    definition: string;
  };
  promotion_comparison: {
    emailer_active_mean: number;
    emailer_inactive_mean: number;
    homepage_active_mean: number;
    homepage_inactive_mean: number;
  };
  operational_analysis: {
    demonstration_rule: string;
    average_over_preparation: number;
    average_shortage: number;
    percentage_over_preparation: number;
    percentage_shortage: number;
    percentage_exact_match: number;
    explanation: string;
  };
  notice: string;
}

export interface ChartsData {
  weekly_trend: { week: number; orders: number }[];
  by_category: { category: string; orders: number }[];
  by_cuisine: { cuisine: string; orders: number }[];
  by_center: { center_id: string; orders: number }[];
  promotion_impact: { name: string; orders: number }[];
  featured_impact: { name: string; orders: number }[];
}

export interface ExplorerData {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: any[];
  summary: {
    dataset_size: number;
    columns: string[];
    missing_values: number;
    duplicate_rows: number;
  };
}
