"""
Data Preprocessing & Feature Engineering for Food Demand Forecasting (ML-T2-003)
Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship
"""

import os
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATASET_NOTICE = (
    "The Genpact Food Demand Forecasting dataset does not contain weather, holiday, "
    "or special event fields. Feature engineering leverages the available contextual "
    "and promotional variables without synthesizing non-existent external data."
)

NUMERICAL_COLS = [
    'week',
    'checkout_price',
    'base_price',
    'emailer_for_promotion',
    'homepage_featured',
    'op_area',
    'week_sin',
    'week_cos',
    'price_difference',
    'discount_ratio',
    'promotion_any',
]

CATEGORICAL_COLS = [
    'center_id',
    'meal_id',
    'city_code',
    'region_code',
    'center_type',
    'category',
    'cuisine',
]


def load_raw_data(data_dir: str):
    """Load the three raw CSV files."""
    train_path = os.path.join(data_dir, 'train.csv')
    center_path = os.path.join(data_dir, 'fulfilment_center_info.csv')
    meal_path = os.path.join(data_dir, 'meal_info.csv')

    if not os.path.exists(train_path):
        raise FileNotFoundError(f"Missing {train_path}")
    if not os.path.exists(center_path):
        raise FileNotFoundError(f"Missing {center_path}")
    if not os.path.exists(meal_path):
        raise FileNotFoundError(f"Missing {meal_path}")

    df_train = pd.read_csv(train_path)
    df_center = pd.read_csv(center_path)
    df_meal = pd.read_csv(meal_path)
    return df_train, df_center, df_meal


def merge_data(df_train: pd.DataFrame, df_center: pd.DataFrame, df_meal: pd.DataFrame) -> pd.DataFrame:
    """
    Merge the three datasets:
    train.center_id = fulfilment_center_info.center_id
    train.meal_id = meal_info.meal_id
    """
    merged = df_train.merge(df_center, on='center_id', how='left')
    merged = merged.merge(df_meal, on='meal_id', how='left')
    return merged


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineered features:
    - week_sin: sin(2*pi*week/52)
    - week_cos: cos(2*pi*week/52)
    - price_difference: base_price - checkout_price
    - discount_ratio: (base_price - checkout_price) / base_price
    - promotion_any: 1 if emailer_for_promotion or homepage_featured is active, else 0
    """
    df = df.copy()

    # Cyclic time features
    df['week_sin'] = np.sin(2.0 * np.pi * df['week'] / 52.0)
    df['week_cos'] = np.cos(2.0 * np.pi * df['week'] / 52.0)

    # Pricing dynamics
    df['price_difference'] = df['base_price'] - df['checkout_price']
    
    # Avoid zero division
    safe_base = np.where(df['base_price'] == 0, 1e-5, df['base_price'])
    df['discount_ratio'] = (df['base_price'] - df['checkout_price']) / safe_base

    # Promotion composite
    df['promotion_any'] = (
        (df['emailer_for_promotion'] == 1) | (df['homepage_featured'] == 1)
    ).astype(int)

    # Ensure categoricals are string typed for OHE consistency
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            df[col] = df[col].astype(str)

    return df


def inspect_dataset_quality(df: pd.DataFrame) -> dict:
    """Check missing values, duplicates, outliers, and basic statistics."""
    missing = df.isnull().sum().to_dict()
    duplicates = int(df.duplicated(subset=['week', 'center_id', 'meal_id']).sum())
    
    q1 = float(df['num_orders'].quantile(0.25))
    q3 = float(df['num_orders'].quantile(0.75))
    iqr = q3 - q1
    outlier_count = int(((df['num_orders'] < (q1 - 1.5 * iqr)) | (df['num_orders'] > (q3 + 1.5 * iqr))).sum())

    stats = {
        'total_rows': int(len(df)),
        'total_cols': int(df.shape[1]),
        'missing_values': {k: int(v) for k, v in missing.items()},
        'duplicate_records': duplicates,
        'iqr_outliers_count': outlier_count,
        'demand_stats': {
            'min': float(df['num_orders'].min()),
            'max': float(df['num_orders'].max()),
            'mean': round(float(df['num_orders'].mean()), 2),
            'median': float(df['num_orders'].median()),
            'std': round(float(df['num_orders'].std()), 2),
            'p90': float(df['num_orders'].quantile(0.90)),
            'p95': float(df['num_orders'].quantile(0.95))
        },
        'notice': DATASET_NOTICE
    }
    return stats


def build_preprocessor() -> ColumnTransformer:
    """
    Construct scikit-learn preprocessor pipeline:
    - Numerical: Median imputation + Standard scaling
    - Categorical: Most frequent imputation + OneHotEncoder
    """
    num_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    cat_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_transformer, NUMERICAL_COLS),
            ('cat', cat_transformer, CATEGORICAL_COLS)
        ],
        remainder='drop'
    )
    return preprocessor


def split_chronological(df: pd.DataFrame, train_ratio=0.70, val_ratio=0.15):
    """
    Chronological time-series split by week (1 to 145).
    70% train (weeks 1 to 101)
    15% val   (weeks 102 to 123)
    15% test  (weeks 124 to 145)
    Strictly without random shuffling to prevent future data leakage.
    """
    df_sorted = df.sort_values(by=['week', 'center_id', 'meal_id']).reset_index(drop=True)
    
    weeks = np.sort(df_sorted['week'].unique())
    n_weeks = len(weeks)
    train_end_idx = int(np.floor(train_ratio * n_weeks))
    val_end_idx = int(np.floor((train_ratio + val_ratio) * n_weeks))

    train_weeks = weeks[:train_end_idx]
    val_weeks = weeks[train_end_idx:val_end_idx]
    test_weeks = weeks[val_end_idx:]

    train_df = df_sorted[df_sorted['week'].isin(train_weeks)].copy()
    val_df = df_sorted[df_sorted['week'].isin(val_weeks)].copy()
    test_df = df_sorted[df_sorted['week'].isin(test_weeks)].copy()

    split_info = {
        'train_weeks': f"{min(train_weeks)}-{max(train_weeks)} ({len(train_weeks)} weeks, {len(train_df)} rows)",
        'val_weeks': f"{min(val_weeks)}-{max(val_weeks)} ({len(val_weeks)} weeks, {len(val_df)} rows)",
        'test_weeks': f"{min(test_weeks)}-{max(test_weeks)} ({len(test_weeks)} weeks, {len(test_df)} rows)"
    }
    return train_df, val_df, test_df, split_info
