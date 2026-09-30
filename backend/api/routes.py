"""
API Routes (ML-T2-003)
Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from backend.schemas.models import (
    PredictRequest,
    PredictResponse,
    DashboardSummary,
    MealItem,
    CenterItem,
    ModelMetricItem,
    FeatureImportanceItem
)
from backend.services.forecast_service import ForecastService

router = APIRouter(prefix="/api")
service = ForecastService.get_instance()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHARTS_DIR = os.path.join(BASE_DIR, 'outputs', 'charts')


@router.get("/health")
def health_check():
    return {"status": "ok", "project": "Food Demand Forecasting Under Changing Conditions", "project_id": "ML-T2-003"}


@router.get("/dashboard-summary")
def get_dashboard_summary():
    try:
        return service.get_dashboard_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard summary: {str(e)}")


@router.get("/meals")
def get_meals():
    try:
        return service.get_meals()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch meal catalog: {str(e)}")


@router.get("/centers")
def get_centers():
    try:
        return service.get_centers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fulfillment centers: {str(e)}")


@router.get("/demand-history")
def get_demand_history(
    center_id: int = Query(..., description="Fulfillment center ID"),
    meal_id: int = Query(..., description="Meal ID")
):
    try:
        history = service.get_demand_history(center_id, meal_id)
        if not history:
            return []
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch demand history: {str(e)}")


@router.post("/predict", response_model=PredictResponse)
def predict_demand(req: PredictRequest):
    try:
        payload = req.dict()
        result = service.predict(payload)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except FileNotFoundError as fe:
        raise HTTPException(status_code=503, detail="Trained model artifacts not available. Please run ML pipeline.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.get("/model-metrics")
def get_model_metrics():
    try:
        return service.get_model_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch model metrics: {str(e)}")


@router.get("/feature-importance")
def get_feature_importance():
    try:
        return service.get_feature_importance()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feature importance: {str(e)}")


@router.get("/analysis")
def get_analysis():
    try:
        return service.get_analysis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {str(e)}")


@router.get("/charts-data")
def get_charts_data():
    try:
        return service.get_analytics_charts_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart datasets: {str(e)}")


@router.get("/explorer")
def get_explorer(
    center_id: Optional[int] = Query(None),
    meal_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    cuisine: Optional[str] = Query(None),
    min_week: Optional[int] = Query(None),
    max_week: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100)
):
    try:
        return service.get_explorer_data(
            center_id=center_id,
            meal_id=meal_id,
            category=category,
            cuisine=cuisine,
            min_week=min_week,
            max_week=max_week,
            page=page,
            page_size=page_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explorer query failed: {str(e)}")


@router.get("/charts/{chart_name}")
def get_static_chart(chart_name: str):
    file_path = os.path.join(CHARTS_DIR, chart_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Chart not found")
    return FileResponse(file_path, media_type="image/png")
