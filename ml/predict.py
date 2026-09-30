"""
Inference Pipeline for Food Demand Forecasting (ML-T2-003)
Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship
"""

import os
import math
import joblib
import numpy as np
import pandas as pd
from ml.preprocess import add_engineered_features, load_raw_data

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')


class DemandPredictor:
    def __init__(self):
        model_path = os.path.join(MODELS_DIR, 'best_model.joblib')
        prep_path = os.path.join(MODELS_DIR, 'preprocessing.joblib')
        meta_path = os.path.join(MODELS_DIR, 'feature_names.joblib')

        if not os.path.exists(model_path) or not os.path.exists(prep_path):
            raise FileNotFoundError("Trained models not found. Please execute ml/train.py first.")

        self.model = joblib.load(model_path)
        self.preprocessor = joblib.load(prep_path)
        
        meta = joblib.load(meta_path) if os.path.exists(meta_path) else {}
        self.model_name = meta.get('best_model_name', 'Trained ML Model')

        # Load reference metadata for centers and meals for rapid lookup
        _, self.df_center, self.df_meal = load_raw_data(DATA_DIR)
        self.center_lookup = self.df_center.set_index('center_id').to_dict('index')
        self.meal_lookup = self.df_meal.set_index('meal_id').to_dict('index')

    def predict_single(self, record: dict) -> dict:
        """
        Input record expects:
        - week (int)
        - center_id (int)
        - meal_id (int)
        - checkout_price (float)
        - base_price (float)
        - emailer_for_promotion (int: 0 or 1)
        - homepage_featured (int: 0 or 1)
        """
        center_id = int(record['center_id'])
        meal_id = int(record['meal_id'])

        if center_id not in self.center_lookup:
            raise ValueError(f"Fulfillment Center ID {center_id} is not recognized.")
        if meal_id not in self.meal_lookup:
            raise ValueError(f"Meal ID {meal_id} is not recognized.")

        center_info = self.center_lookup[center_id]
        meal_info = self.meal_lookup[meal_id]

        row = {
            'week': int(record['week']),
            'center_id': center_id,
            'meal_id': meal_id,
            'checkout_price': float(record['checkout_price']),
            'base_price': float(record['base_price']),
            'emailer_for_promotion': int(record['emailer_for_promotion']),
            'homepage_featured': int(record['homepage_featured']),
            'city_code': center_info['city_code'],
            'region_code': center_info['region_code'],
            'center_type': center_info['center_type'],
            'op_area': center_info['op_area'],
            'category': meal_info['category'],
            'cuisine': meal_info['cuisine']
        }

        df_single = pd.DataFrame([row])
        df_featured = add_engineered_features(df_single)
        X_trans = self.preprocessor.transform(df_featured)

        raw_pred = self.model.predict(X_trans)[0]
        pred_orders = max(0.0, float(raw_pred))
        suggested_prep = int(math.ceil(pred_orders))

        return {
            'predicted_demand': round(pred_orders, 1),
            'suggested_preparation': suggested_prep,
            'model': self.model_name,
            'rule_notice': 'Demonstration rule: suggested_preparation = ceil(predicted_demand)',
            'context': {
                'category': meal_info['category'],
                'cuisine': meal_info['cuisine'],
                'center_type': center_info['center_type'],
                'op_area': center_info['op_area']
            }
        }
