"""
Forecast & Analytics Service (ML-T2-003)
Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship
"""

import os
import json
import pandas as pd
import numpy as np
from ml.predict import DemandPredictor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
MODELS_DIR = os.path.join(BASE_DIR, 'models')


class ForecastService:
    _instance = None

    def __init__(self):
        self.predictor = None
        self._load_data()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_data(self):
        train_path = os.path.join(DATA_DIR, 'train.csv')
        center_path = os.path.join(DATA_DIR, 'fulfilment_center_info.csv')
        meal_path = os.path.join(DATA_DIR, 'meal_info.csv')

        self.df_train = pd.read_csv(train_path)
        self.df_center = pd.read_csv(center_path)
        self.df_meal = pd.read_csv(meal_path)

        # Merge for quick filtering
        self.df_merged = self.df_train.merge(self.df_center, on='center_id', how='left')
        self.df_merged = self.df_merged.merge(self.df_meal, on='meal_id', how='left')

    def get_predictor(self) -> DemandPredictor:
        if self.predictor is None:
            self.predictor = DemandPredictor()
        return self.predictor

    def get_metrics_json(self) -> dict:
        metrics_file = os.path.join(OUTPUTS_DIR, 'metrics.json')
        if os.path.exists(metrics_file):
            with open(metrics_file, 'r') as f:
                return json.load(f)
        return {}

    def get_dashboard_summary(self) -> dict:
        metrics = self.get_metrics_json()
        best_metrics = metrics.get('best_model_metrics', {'MAE': 0, 'RMSE': 0, 'MAPE': 0})
        op = metrics.get('operational_analysis', {})

        return {
            "total_historical_records": int(len(self.df_train)),
            "total_orders": int(self.df_train['num_orders'].sum()),
            "average_orders": round(float(self.df_train['num_orders'].mean()), 2),
            "number_of_meals": int(self.df_meal['meal_id'].nunique()),
            "number_of_fulfillment_centers": int(self.df_center['center_id'].nunique()),
            "best_model": metrics.get('best_model', 'Gradient Boosting Regressor'),
            "MAE": best_metrics.get('MAE', 0.0),
            "RMSE": best_metrics.get('RMSE', 0.0),
            "MAPE": best_metrics.get('MAPE', 0.0),
            "operational_overview": {
                "average_over_preparation": op.get('average_over_preparation', 0),
                "average_shortage": op.get('average_shortage', 0),
                "percentage_over_preparation": op.get('percentage_over_preparation', 0),
                "percentage_shortage": op.get('percentage_shortage', 0),
                "demonstration_rule": op.get('demonstration_rule', 'suggested_preparation = ceil(predicted_demand)')
            }
        }

    def get_meals(self) -> list:
        meals = self.df_meal.sort_values(by='meal_id').to_dict('records')
        return meals

    def get_centers(self) -> list:
        centers = self.df_center.sort_values(by='center_id').to_dict('records')
        return centers

    def get_demand_history(self, center_id: int, meal_id: int) -> list:
        sub = self.df_train[(self.df_train['center_id'] == center_id) & (self.df_train['meal_id'] == meal_id)]
        sub = sub.sort_values(by='week')
        return sub[['week', 'checkout_price', 'base_price', 'emailer_for_promotion', 'homepage_featured', 'num_orders']].to_dict('records')

    def predict(self, payload: dict) -> dict:
        predictor = self.get_predictor()
        return predictor.predict_single(payload)

    def get_model_metrics(self) -> list:
        metrics = self.get_metrics_json()
        return metrics.get('all_models', [])

    def get_feature_importance(self) -> list:
        metrics = self.get_metrics_json()
        return metrics.get('top_features', [])

    def get_analysis(self) -> dict:
        metrics = self.get_metrics_json()
        
        # Promo calculations
        promo_group = self.df_train.groupby('emailer_for_promotion')['num_orders'].agg(['mean', 'count']).to_dict('index')
        home_group = self.df_train.groupby('homepage_featured')['num_orders'].agg(['mean', 'count']).to_dict('index')

        return {
            "demand_stats": {
                "average_demand": round(float(self.df_train['num_orders'].mean()), 2),
                "maximum_demand": int(self.df_train['num_orders'].max()),
                "minimum_demand": int(self.df_train['num_orders'].min()),
                "median_demand": float(self.df_train['num_orders'].median()),
                "std_demand": round(float(self.df_train['num_orders'].std()), 2)
            },
            "unusual_demand": metrics.get('unusual_demand_analysis', {}),
            "promotion_comparison": {
                "emailer_active_mean": round(promo_group.get(1, {}).get('mean', 0), 2),
                "emailer_inactive_mean": round(promo_group.get(0, {}).get('mean', 0), 2),
                "homepage_active_mean": round(home_group.get(1, {}).get('mean', 0), 2),
                "homepage_inactive_mean": round(home_group.get(0, {}).get('mean', 0), 2)
            },
            "operational_analysis": metrics.get('operational_analysis', {}),
            "notice": (
                "The selected dataset does not include weather, holidays or event variables. "
                "Therefore the current implementation evaluates the contextual variables actually "
                "available in the dataset."
            )
        }

    def get_analytics_charts_data(self) -> dict:
        """Aggregated real data for frontend interactive charts."""
        # Weekly demand trend
        weekly = self.df_train.groupby('week')['num_orders'].sum().reset_index()
        weekly_data = [
            {"week": int(r['week']), "orders": int(r['num_orders'])}
            for _, r in weekly.iterrows()
        ]

        # By category
        cat = self.df_merged.groupby('category')['num_orders'].sum().sort_values(ascending=False).reset_index()
        category_data = [
            {"category": str(r['category']), "orders": int(r['num_orders'])}
            for _, r in cat.iterrows()
        ]

        # By cuisine
        cui = self.df_merged.groupby('cuisine')['num_orders'].sum().sort_values(ascending=False).reset_index()
        cuisine_data = [
            {"cuisine": str(r['cuisine']), "orders": int(r['num_orders'])}
            for _, r in cui.iterrows()
        ]

        # Top 15 Centers
        ctr = self.df_merged.groupby('center_id')['num_orders'].sum().sort_values(ascending=False).head(15).reset_index()
        center_data = [
            {"center_id": f"C-{int(r['center_id'])}", "orders": int(r['num_orders'])}
            for _, r in ctr.iterrows()
        ]

        # Promotion comparison
        promo_data = [
            {"name": "No Email", "orders": round(float(self.df_train[self.df_train['emailer_for_promotion'] == 0]['num_orders'].mean()), 1)},
            {"name": "Email Promo", "orders": round(float(self.df_train[self.df_train['emailer_for_promotion'] == 1]['num_orders'].mean()), 1)}
        ]

        featured_data = [
            {"name": "Not Featured", "orders": round(float(self.df_train[self.df_train['homepage_featured'] == 0]['num_orders'].mean()), 1)},
            {"name": "Featured", "orders": round(float(self.df_train[self.df_train['homepage_featured'] == 1]['num_orders'].mean()), 1)}
        ]

        return {
            "weekly_trend": weekly_data,
            "by_category": category_data,
            "by_cuisine": cuisine_data,
            "by_center": center_data,
            "promotion_impact": promo_data,
            "featured_impact": featured_data
        }

    def get_explorer_data(self, center_id=None, meal_id=None, category=None, cuisine=None, min_week=None, max_week=None, page=1, page_size=50) -> dict:
        df = self.df_merged

        if center_id is not None:
            df = df[df['center_id'] == center_id]
        if meal_id is not None:
            df = df[df['meal_id'] == meal_id]
        if category:
            df = df[df['category'] == category]
        if cuisine:
            df = df[df['cuisine'] == cuisine]
        if min_week is not None:
            df = df[df['week'] >= min_week]
        if max_week is not None:
            df = df[df['week'] <= max_week]

        total_records = len(df)
        start = (page - 1) * page_size
        end = start + page_size
        records = df.iloc[start:end][[
            'id', 'week', 'center_id', 'meal_id', 'checkout_price', 'base_price',
            'emailer_for_promotion', 'homepage_featured', 'num_orders',
            'city_code', 'region_code', 'center_type', 'op_area', 'category', 'cuisine'
        ]].to_dict('records')

        return {
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": int(np.ceil(total_records / page_size)) if page_size > 0 else 1,
            "records": records,
            "summary": {
                "dataset_size": len(self.df_train),
                "columns": list(self.df_merged.columns),
                "missing_values": int(self.df_merged.isnull().sum().sum()),
                "duplicate_rows": int(self.df_train.duplicated(subset=['week', 'center_id', 'meal_id']).sum())
            }
        }
