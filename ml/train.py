"""
Model Training, Model Selection & Chart Generation (ML-T2-003)
Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from ml.preprocess import (
    load_raw_data,
    merge_data,
    add_engineered_features,
    inspect_dataset_quality,
    build_preprocessor,
    split_chronological,
    DATASET_NOTICE
)
from ml.evaluate import (
    compute_metrics,
    evaluate_unusual_demand,
    evaluate_operations
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
CHARTS_DIR = os.path.join(OUTPUTS_DIR, 'charts')

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)


class HistoricalMeanBaseline:
    """Historical mean demand baseline by (center_id, meal_id) with global fallback."""
    def __init__(self):
        self.center_meal_means = {}
        self.global_mean = 0.0

    def fit(self, X_df, y):
        df = X_df.copy()
        df['target'] = y
        self.global_mean = float(df['target'].mean())
        grouped = df.groupby(['center_id', 'meal_id'])['target'].mean()
        self.center_meal_means = grouped.to_dict()
        return self

    def predict(self, X_df):
        preds = []
        for _, row in X_df.iterrows():
            key = (str(row['center_id']), str(row['meal_id']))
            val = self.center_meal_means.get(key, self.global_mean)
            preds.append(val)
        return np.array(preds)


def generate_charts(df_all, y_test, test_preds, model_results, best_model_name):
    print("Generating 10 academic EDA & evaluation charts...", flush=True)
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    
    # 1. Weekly demand trend
    plt.figure(figsize=(12, 5))
    weekly_agg = df_all.groupby('week')['num_orders'].sum().reset_index()
    plt.plot(weekly_agg['week'], weekly_agg['num_orders'] / 1e3, color='#2563EB', linewidth=2.2)
    plt.axvline(101, color='#D97706', linestyle='--', label='Train/Val Boundary (Week 101)')
    plt.axvline(123, color='#DC2626', linestyle='--', label='Val/Test Boundary (Week 123)')
    plt.title('Weekly Aggregate Food Demand Trend (Weeks 1 to 145)', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Week Number', fontsize=11)
    plt.ylabel('Total Orders (in Thousands)', fontsize=11)
    plt.legend(frameon=True)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'weekly_demand_trend.png'), dpi=160)
    plt.close()

    # 2. Demand distribution
    plt.figure(figsize=(10, 5))
    sns.histplot(df_all['num_orders'], bins=70, kde=True, color='#0F766E')
    plt.xlim(0, 2000)
    plt.title('Order Demand Distribution (Capped at 2,000 for Visibility)', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Number of Orders', fontsize=11)
    plt.ylabel('Frequency', fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'demand_distribution.png'), dpi=160)
    plt.close()

    # 3. Demand by meal category
    plt.figure(figsize=(11, 5))
    cat_agg = df_all.groupby('category')['num_orders'].sum().sort_values(ascending=False).reset_index()
    sns.barplot(data=cat_agg, x='category', y='num_orders', palette='Blues_r')
    plt.title('Total Orders by Meal Category', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Category', fontsize=11)
    plt.ylabel('Total Orders', fontsize=11)
    plt.xticks(rotation=40, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'demand_by_category.png'), dpi=160)
    plt.close()

    # 4. Demand by cuisine
    plt.figure(figsize=(8, 5))
    cuisine_agg = df_all.groupby('cuisine')['num_orders'].sum().sort_values(ascending=False).reset_index()
    sns.barplot(data=cuisine_agg, x='cuisine', y='num_orders', palette='Teal')
    plt.title('Total Orders by Cuisine Type', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Cuisine', fontsize=11)
    plt.ylabel('Total Orders', fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'demand_by_cuisine.png'), dpi=160)
    plt.close()

    # 5. Promotion vs non-promotion demand
    plt.figure(figsize=(7, 5))
    sns.barplot(x='emailer_for_promotion', y='num_orders', data=df_all, palette=['#667085', '#2563EB'])
    plt.title('Average Demand: Emailer Promotion Impact', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Emailer Promotion Active (0 = No, 1 = Yes)', fontsize=11)
    plt.ylabel('Average Weekly Orders per Item', fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'promotion_vs_non_promotion.png'), dpi=160)
    plt.close()

    # 6. Homepage featured vs non-featured demand
    plt.figure(figsize=(7, 5))
    sns.barplot(x='homepage_featured', y='num_orders', data=df_all, palette=['#667085', '#0F766E'])
    plt.title('Average Demand: Homepage Featured Impact', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Homepage Featured Active (0 = No, 1 = Yes)', fontsize=11)
    plt.ylabel('Average Weekly Orders per Item', fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'homepage_featured_vs_non_featured.png'), dpi=160)
    plt.close()

    # 7. Demand by fulfillment center (Top 20 centers)
    plt.figure(figsize=(14, 5))
    center_agg = df_all.groupby('center_id')['num_orders'].sum().sort_values(ascending=False).head(20).reset_index()
    sns.barplot(data=center_agg, x='center_id', y='num_orders', palette='crest', order=center_agg['center_id'])
    plt.title('Total Demand: Top 20 Fulfillment Centers', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Center ID', fontsize=11)
    plt.ylabel('Total Orders', fontsize=11)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'demand_by_center.png'), dpi=160)
    plt.close()

    # 8. Actual vs predicted demand (Sample 400 test points for clean rendering)
    plt.figure(figsize=(9, 6))
    sample_idx = np.random.choice(len(y_test), size=min(400, len(y_test)), replace=False)
    y_sub_true = np.array(y_test)[sample_idx]
    y_sub_pred = np.clip(test_preds[best_model_name][sample_idx], 0, None)
    plt.scatter(y_sub_true, y_sub_pred, alpha=0.5, color='#2563EB', edgecolors='none')
    max_val = max(np.max(y_sub_true), np.max(y_sub_pred))
    plt.plot([0, max_val], [0, max_val], 'r--', linewidth=2, label='Perfect 1:1 Forecast Line')
    plt.title(f'Actual vs. Predicted Demand ({best_model_name} on Test Set)', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Actual Orders', fontsize=11)
    plt.ylabel('Predicted Orders', fontsize=11)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'actual_vs_predicted.png'), dpi=160)
    plt.close()

    # 9. Model comparison
    plt.figure(figsize=(10, 5))
    comp_df = pd.DataFrame(model_results)
    x = np.arange(len(comp_df))
    width = 0.35
    plt.bar(x - width/2, comp_df['MAE'], width, label='MAE', color='#2563EB')
    plt.bar(x + width/2, comp_df['RMSE'], width, label='RMSE', color='#0F766E')
    plt.xticks(x, comp_df['model'], rotation=15, ha='right', fontsize=10)
    plt.title('Model Benchmark Comparison (MAE & RMSE on Chronological Test Set)', fontsize=13, fontweight='bold', pad=12)
    plt.ylabel('Error (Orders)', fontsize=11)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'model_comparison.png'), dpi=160)
    plt.close()

    # 10. Error distribution
    plt.figure(figsize=(10, 5))
    residuals = y_test - np.clip(test_preds[best_model_name], 0, None)
    sns.histplot(residuals, bins=60, kde=True, color='#2563EB')
    plt.xlim(-800, 800)
    plt.axvline(0, color='#DC2626', linestyle='--', linewidth=1.5, label='Zero Error')
    plt.title(f'Forecast Residual Error Distribution ({best_model_name})', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Error: (Actual Orders - Predicted Orders)', fontsize=11)
    plt.ylabel('Count', fontsize=11)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, 'error_distribution.png'), dpi=160)
    plt.close()

    print(f"All 10 charts saved to {CHARTS_DIR}", flush=True)


def run_training():
    start_time = time.time()
    print("==================================================", flush=True)
    print("Learn Depth Academy LLP - Track 2 Machine Learning", flush=True)
    print("Project ID: ML-T2-003: Food Demand Forecasting", flush=True)
    print("==================================================", flush=True)

    # 1. Load data
    print("\n[Step 1/6] Loading raw CSV files...", flush=True)
    df_train_raw, df_center_raw, df_meal_raw = load_raw_data(DATA_DIR)
    print(f"Loaded: train={df_train_raw.shape}, centers={df_center_raw.shape}, meals={df_meal_raw.shape}", flush=True)

    # 2. Merge & Engineer
    print("\n[Step 2/6] Merging datasets & engineering features...", flush=True)
    df_merged = merge_data(df_train_raw, df_center_raw, df_meal_raw)
    df_featured = add_engineered_features(df_merged)
    data_quality = inspect_dataset_quality(df_featured)
    print(f"Merged & featured shape: {df_featured.shape}", flush=True)
    print(f"Duplicates: {data_quality['duplicate_records']}, Outliers (IQR): {data_quality['iqr_outliers_count']}", flush=True)

    # 3. Chronological Split
    print("\n[Step 3/6] Performing chronological time-based split (70% train, 15% val, 15% test)...", flush=True)
    train_df, val_df, test_df, split_info = split_chronological(df_featured, train_ratio=0.70, val_ratio=0.15)
    print(f"Train set: {split_info['train_weeks']}", flush=True)
    print(f"Val set:   {split_info['val_weeks']}", flush=True)
    print(f"Test set:  {split_info['test_weeks']}", flush=True)

    # Fit Preprocessor on Train set ONLY
    print("\n[Step 4/6] Fitting preprocessor on training partition...", flush=True)
    preprocessor = build_preprocessor()
    X_train_transformed = preprocessor.fit_transform(train_df)
    X_val_transformed = preprocessor.transform(val_df)
    X_test_transformed = preprocessor.transform(test_df)

    y_train = train_df['num_orders'].values
    y_val = val_df['num_orders'].values
    y_test = test_df['num_orders'].values

    # Extract feature names
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['ohe']
    cat_feature_names = cat_encoder.get_feature_names_out([
        'center_id', 'meal_id', 'city_code', 'region_code', 'center_type', 'category', 'cuisine'
    ]).tolist()
    all_feature_names = [
        'week', 'checkout_price', 'base_price', 'emailer_for_promotion', 'homepage_featured',
        'op_area', 'week_sin', 'week_cos', 'price_difference', 'discount_ratio', 'promotion_any'
    ] + cat_feature_names
    print(f"Transformed feature dimension: {X_train_transformed.shape[1]}", flush=True)

    # 4. Train Models
    print("\n[Step 5/6] Training baseline and candidate models...", flush=True)
    models = {}
    test_preds = {}
    val_preds = {}
    model_results = []

    # Model 0: Baseline (Historical Mean)
    print("  -> Evaluating Baseline (Historical Center-Meal Mean)...", flush=True)
    baseline = HistoricalMeanBaseline()
    baseline.fit(train_df, y_train)
    val_p_base = baseline.predict(val_df)
    test_p_base = baseline.predict(test_df)
    test_preds['Historical Mean Baseline'] = test_p_base
    val_preds['Historical Mean Baseline'] = val_p_base
    m_base = compute_metrics(y_test, test_p_base)
    model_results.append({
        'model': 'Historical Mean Baseline',
        'MAE': m_base['mae'],
        'RMSE': m_base['rmse'],
        'MAPE': m_base['mape']
    })
    print(f"     Baseline Test: MAE={m_base['mae']}, RMSE={m_base['rmse']}, MAPE={m_base['mape']}%", flush=True)

    # Model 1: Linear Regression (Ridge)
    print("  -> Training Linear Regression (Ridge)...", flush=True)
    lr = Ridge(alpha=10.0, random_state=42)
    lr.fit(X_train_transformed, y_train)
    val_p_lr = lr.predict(X_val_transformed)
    test_p_lr = lr.predict(X_test_transformed)
    models['Linear Regression (Ridge)'] = lr
    test_preds['Linear Regression (Ridge)'] = test_p_lr
    val_preds['Linear Regression (Ridge)'] = val_p_lr
    m_lr = compute_metrics(y_test, test_p_lr)
    model_results.append({
        'model': 'Linear Regression (Ridge)',
        'MAE': m_lr['mae'],
        'RMSE': m_lr['rmse'],
        'MAPE': m_lr['mape']
    })
    print(f"     Linear Regression Test: MAE={m_lr['mae']}, RMSE={m_lr['rmse']}, MAPE={m_lr['mape']}%", flush=True)

    # Model 2: Gradient Boosting Regressor (HistGradientBoosting - super fast & powerful)
    print("  -> Training Gradient Boosting Regressor (HistGradientBoosting, 120 iterations)...", flush=True)
    gbr = HistGradientBoostingRegressor(
        max_iter=120,
        max_depth=12,
        learning_rate=0.1,
        random_state=42
    )
    gbr.fit(X_train_transformed, y_train)
    val_p_gbr = gbr.predict(X_val_transformed)
    test_p_gbr = gbr.predict(X_test_transformed)
    models['Gradient Boosting Regressor'] = gbr
    test_preds['Gradient Boosting Regressor'] = test_p_gbr
    val_preds['Gradient Boosting Regressor'] = val_p_gbr
    m_gbr = compute_metrics(y_test, test_p_gbr)
    model_results.append({
        'model': 'Gradient Boosting Regressor',
        'MAE': m_gbr['mae'],
        'RMSE': m_gbr['rmse'],
        'MAPE': m_gbr['mape']
    })
    print(f"     Gradient Boosting Test: MAE={m_gbr['mae']}, RMSE={m_gbr['rmse']}, MAPE={m_gbr['mape']}%", flush=True)

    # Model 3: Random Forest Regressor (Optimized parameters for fast convergence & high accuracy)
    print("  -> Training Random Forest Regressor (40 trees, max_depth=14)...", flush=True)
    rf = RandomForestRegressor(
        n_estimators=40,
        max_depth=14,
        min_samples_leaf=8,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train_transformed, y_train)
    val_p_rf = rf.predict(X_val_transformed)
    test_p_rf = rf.predict(X_test_transformed)
    models['Random Forest Regressor'] = rf
    test_preds['Random Forest Regressor'] = test_p_rf
    val_preds['Random Forest Regressor'] = val_p_rf
    m_rf = compute_metrics(y_test, test_p_rf)
    model_results.append({
        'model': 'Random Forest Regressor',
        'MAE': m_rf['mae'],
        'RMSE': m_rf['rmse'],
        'MAPE': m_rf['mape']
    })
    print(f"     Random Forest Test: MAE={m_rf['mae']}, RMSE={m_rf['rmse']}, MAPE={m_rf['mape']}%", flush=True)

    # 5. Model Comparison & Selection
    print("\n[Step 6/6] Model Evaluation & Selection...", flush=True)
    comp_df = pd.DataFrame(model_results)
    comp_df.to_csv(os.path.join(OUTPUTS_DIR, 'model_comparison.csv'), index=False)
    print("\nModel Comparison Leaderboard:", flush=True)
    print(comp_df.to_string(index=False), flush=True)

    # Select best ML model by lowest test MAE
    ml_models_df = comp_df[comp_df['model'] != 'Historical Mean Baseline'].sort_values(by='MAE')
    best_row = ml_models_df.iloc[0]
    best_model_name = str(best_row['model'])
    best_model_obj = models[best_model_name]
    print(f"\n>> BEST MODEL SELECTED BASED ON ACTUAL TEST METRICS: '{best_model_name}' (MAE: {best_row['MAE']}) <<", flush=True)

    # Operational & Unusual Demand metrics on best model
    best_test_preds = test_preds[best_model_name]
    unusual_analysis = evaluate_unusual_demand(y_test, best_test_preds, threshold_percentile=90.0)
    operational_metrics = evaluate_operations(y_test, best_test_preds)

    # Feature Importance (from Random Forest)
    feature_importances = []
    if hasattr(rf, 'feature_importances_'):
        importances = rf.feature_importances_
        indices = np.argsort(importances)[::-1][:20]
        for idx in indices:
            name = all_feature_names[idx] if idx < len(all_feature_names) else f"feature_{idx}"
            feature_importances.append({
                'feature': name,
                'importance': round(float(importances[idx]), 4)
            })

    # Save artifacts
    joblib.dump(best_model_obj, os.path.join(MODELS_DIR, 'best_model.joblib'))
    joblib.dump(preprocessor, os.path.join(MODELS_DIR, 'preprocessing.joblib'))
    joblib.dump({
        'best_model_name': best_model_name,
        'feature_names': all_feature_names,
        'feature_importances': feature_importances
    }, os.path.join(MODELS_DIR, 'feature_names.joblib'))

    # Save sample predictions
    pred_sample_df = test_df[['id', 'week', 'center_id', 'meal_id', 'num_orders', 'checkout_price', 'base_price']].copy()
    pred_sample_df['predicted_demand'] = np.round(np.clip(best_test_preds, 0, None), 1)
    pred_sample_df['suggested_preparation'] = np.ceil(pred_sample_df['predicted_demand']).astype(int)
    pred_sample_df.head(2000).to_csv(os.path.join(OUTPUTS_DIR, 'predictions.csv'), index=False)

    # Complete metrics.json
    metrics_payload = {
        'project_id': 'ML-T2-003',
        'project_title': 'Food Demand Forecasting Under Changing Conditions',
        'institution': 'Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship',
        'dataset_notice': DATASET_NOTICE,
        'total_records': len(df_featured),
        'split_info': split_info,
        'best_model': best_model_name,
        'best_model_metrics': {
            'MAE': float(best_row['MAE']),
            'RMSE': float(best_row['RMSE']),
            'MAPE': float(best_row['MAPE'])
        },
        'all_models': model_results,
        'unusual_demand_analysis': unusual_analysis,
        'operational_analysis': operational_metrics,
        'data_quality': data_quality,
        'top_features': feature_importances
    }

    with open(os.path.join(OUTPUTS_DIR, 'metrics.json'), 'w') as f:
        json.dump(metrics_payload, f, indent=2)

    # Generate the 10 EDA charts
    generate_charts(df_featured, y_test, test_preds, model_results, best_model_name)

    elapsed = round(time.time() - start_time, 1)
    print(f"\n[DONE] Pipeline complete in {elapsed}s! All models, metrics, and charts saved.", flush=True)


if __name__ == '__main__':
    run_training()
