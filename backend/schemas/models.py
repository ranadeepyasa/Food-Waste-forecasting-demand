"""
Pydantic Data Schemas (ML-T2-003)
Learn Depth Academy LLP - Track 2: Advanced Machine Learning Internship
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    week: int = Field(..., ge=1, le=500, description="Forecast target week number")
    center_id: int = Field(..., description="Fulfillment center identifier")
    meal_id: int = Field(..., description="Meal identifier")
    checkout_price: float = Field(..., gt=0, description="Offered final checkout price")
    base_price: float = Field(..., gt=0, description="Base catalog price")
    emailer_for_promotion: int = Field(0, ge=0, le=1, description="1 if email campaign sent, else 0")
    homepage_featured: int = Field(0, ge=0, le=1, description="1 if featured on homepage, else 0")


class PredictResponse(BaseModel):
    predicted_demand: float = Field(..., description="Predicted number of orders")
    suggested_preparation: int = Field(..., description="Demonstration ceiling preparation quantity")
    model: str = Field(..., description="Name of the selected machine learning model")
    rule_notice: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ModelMetricItem(BaseModel):
    model: str
    MAE: float
    RMSE: float
    MAPE: float


class DashboardSummary(BaseModel):
    total_historical_records: int
    total_orders: int
    average_orders: float
    number_of_meals: int
    number_of_fulfillment_centers: int
    best_model: str
    MAE: float
    RMSE: float
    MAPE: float
    operational_overview: Optional[Dict[str, Any]] = None


class MealItem(BaseModel):
    meal_id: int
    category: str
    cuisine: str


class CenterItem(BaseModel):
    center_id: int
    city_code: int
    region_code: int
    center_type: str
    op_area: float


class DemandHistoryPoint(BaseModel):
    week: int
    checkout_price: float
    base_price: float
    emailer_for_promotion: int
    homepage_featured: int
    num_orders: int


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
