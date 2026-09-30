"""
Evaluation, Unusual Demand Analysis & Operational Metrics (ML-T2-003)
Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship
"""

import numpy as np
import pandas as pd


def compute_metrics(y_true, y_pred) -> dict:
    """
    Calculate MAE, RMSE, and MAPE.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    
    # Non-negative forecast constraint
    y_pred_clipped = np.clip(y_pred, 0, None)

    mae = float(np.mean(np.abs(y_true - y_pred_clipped)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred_clipped) ** 2)))
    
    # Safe MAPE: exclude or guard zeros
    safe_y = np.where(y_true <= 0, 1.0, y_true)
    mape = float(np.mean(np.abs((y_true - y_pred_clipped) / safe_y)) * 100.0)

    return {
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'mape': round(mape, 2)
    }


def evaluate_unusual_demand(y_true, y_pred, threshold_percentile=90.0) -> dict:
    """
    Segment predictions into Normal vs Unusual (High-Demand) based on historical percentile.
    Evaluates MAE & RMSE separately for each segment.
    Note: Does not label as weather or holidays because those fields are absent.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.clip(np.asarray(y_pred, dtype=float), 0, None)

    threshold_val = float(np.percentile(y_true, threshold_percentile))
    is_unusual = y_true >= threshold_val
    is_normal = ~is_unusual

    normal_metrics = compute_metrics(y_true[is_normal], y_pred[is_normal]) if np.any(is_normal) else {}
    unusual_metrics = compute_metrics(y_true[is_unusual], y_pred[is_unusual]) if np.any(is_unusual) else {}

    return {
        'threshold_percentile': threshold_percentile,
        'threshold_value': round(threshold_val, 2),
        'normal_count': int(np.sum(is_normal)),
        'unusual_count': int(np.sum(is_unusual)),
        'normal_metrics': normal_metrics,
        'unusual_metrics': unusual_metrics,
        'definition': (
            f"Unusual demand is defined as actual demand >= {threshold_percentile}th "
            f"percentile ({round(threshold_val, 1)} units) in the observed period."
        )
    }


def evaluate_operations(y_true, y_pred) -> dict:
    """
    Operational safety & shortage analysis:
    - suggested_preparation = ceil(predicted_demand)
    - over_preparation = max(suggested_preparation - actual_demand, 0)
    - shortage = max(actual_demand - suggested_preparation, 0)
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.clip(np.asarray(y_pred, dtype=float), 0, None)

    # Simple demonstration ceiling preparation rule
    prep_qty = np.ceil(y_pred)

    over_prep = np.maximum(prep_qty - y_true, 0)
    shortage = np.maximum(y_true - prep_qty, 0)

    avg_over_prep = float(np.mean(over_prep))
    avg_shortage = float(np.mean(shortage))

    pct_over_prep = float(np.mean(over_prep > 0) * 100.0)
    pct_shortage = float(np.mean(shortage > 0) * 100.0)
    pct_exact = float(np.mean(prep_qty == y_true) * 100.0)

    return {
        'demonstration_rule': 'suggested_preparation = ceil(predicted_demand)',
        'average_over_preparation': round(avg_over_prep, 2),
        'average_shortage': round(avg_shortage, 2),
        'percentage_over_preparation': round(pct_over_prep, 2),
        'percentage_shortage': round(pct_shortage, 2),
        'percentage_exact_match': round(pct_exact, 2),
        'explanation': (
            'Demonstration operational metrics only. They model unit-level buffer differences '
            'and do not represent monetary financial loss or actual inventory waste.'
        )
    }
