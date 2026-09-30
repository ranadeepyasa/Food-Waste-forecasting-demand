# Food Demand Forecasting Under Changing Conditions

**Project ID**: ML-T2-003  
**Institution**: Learn Depth Academy LLP  
**Program**: Track 2 – Advanced Machine Learning Internship  

---

## 1. Project Overview

**Food Demand Forecasting Under Changing Conditions** is a full-stack, production-grade machine learning application designed to forecast weekly food demand across multi-city fulfillment centers and translate those predictions into operational preparation quantities. 

In commercial food delivery and catering operations, inventory mismanagement produces severe friction: **over-preparation** triggers perishable food spoilage and avoidable disposal costs, while **under-preparation (shortages)** leads to lost revenue and customer churn. This platform bridges advanced predictive modeling with operational decision-making.

---

## 2. Problem Statement & Objectives

1. **Demand Forecasting**: Accurately predict order volume (`num_orders`) for specific fulfillment center and meal combinations.
2. **Operational Preparation Heuristics**: Convert continuous regression predictions ($\hat{y}$) into whole-unit preparation recommendations ($\lceil \hat{y} \rceil$).
3. **Risk Telemetry**: Continuously measure over-preparation risk and inventory shortage probability.
4. **Transparent Evaluation**: Benchmark multiple candidate algorithms against simple baselines under strict chronological time splits with zero temporal data leakage.

---

## 3. Dataset Architecture

The platform uses the authentic **Food Demand Forecasting Challenge** dataset:

- `data/train.csv`: 456,548 historical weekly order records across 145 weeks.
  - Features: `id`, `week`, `center_id`, `meal_id`, `checkout_price`, `base_price`, `emailer_for_promotion`, `homepage_featured`, `num_orders`.
- `data/fulfilment_center_info.csv`: 77 fulfillment centers.
  - Features: `center_id`, `city_code`, `region_code`, `center_type`, `op_area`.
- `data/meal_info.csv`: 51 meal items.
  - Features: `meal_id`, `category`, `cuisine`.

### Relational Merge
```
train.center_id = fulfilment_center_info.center_id
train.meal_id = meal_info.meal_id
```

> **Important Dataset Disclosure**:  
> *"The selected dataset does not include weather, holidays or event variables. Therefore the current implementation evaluates the contextual variables actually available in the dataset."*  
> The system does not synthesize fake weather or holiday fields; all analysis strictly derives from the genuine operational features.

---

## 4. Machine Learning Pipeline & Methodology

### 4.1 Feature Engineering
- **Cyclic Calendar Projections**:
  $$\text{week\_sin} = \sin\left(\frac{2\pi \cdot \text{week}}{52}\right)$$
  $$\text{week\_cos} = \cos\left(\frac{2\pi \cdot \text{week}}{52}\right)$$
- **Pricing Dynamics**:
  $$\text{price\_difference} = \text{base\_price} - \text{checkout\_price}$$
  $$\text{discount\_ratio} = \frac{\text{base\_price} - \text{checkout\_price}}{\text{base\_price}}$$
- **Composite Promotional Uplift**:
  $$\text{promotion\_any} = (\text{emailer\_for\_promotion} == 1) \lor (\text{homepage\_featured} == 1)$$

### 4.2 Chronological Time-Based Splitting
To prevent lookahead data leakage in time-series forecasting, random shuffling is strictly prohibited:
- **Training Set (70%)**: Weeks 1 to 101 (312,585 records)
- **Validation Set (15%)**: Weeks 102 to 123 (71,801 records)
- **Test Set (15%)**: Weeks 124 to 145 (72,162 records)

### 4.3 Candidate Models & Empirical Results
All models are evaluated on the unseen chronological test partition (Weeks 124–145):

| Model | MAE (Orders) | RMSE (Orders) | MAPE (%) | Selection Status |
| :--- | :---: | :---: | :---: | :---: |
| **Historical Mean Baseline** | 110.18 | 244.51 | 86.16% | Benchmark Reference |
| **Linear Regression (Ridge)** | 134.18 | 247.09 | 109.90% | Evaluated Parametric |
| **Random Forest Regressor** | 97.86 | 196.89 | 89.78% | Evaluated Ensemble |
| **Gradient Boosting Regressor** | **96.85** | **184.46** | **86.18%** | **Selected Best Model** |

The **Gradient Boosting Regressor (HistGradientBoosting)** achieved the lowest MAE (96.85) and lowest RMSE (184.46), delivering a ~24.5% error reduction over the baseline.

### 4.4 Operational Preparation & Risk Analysis
- **Demonstration Rule**: $\text{suggested\_preparation} = \lceil \text{predicted\_demand} \rceil$
- **Over-preparation**: $\max(\text{suggested\_preparation} - \text{actual\_demand}, 0)$
- **Shortage**: $\max(\text{actual\_demand} - \text{suggested\_preparation}, 0)$
- **Test Evaluation**:
  - Average over-preparation: 47.65 units/item (occurring in 58.53% of instances)
  - Average shortage: 49.29 units/item (occurring in 40.93% of instances)

---

## 5. Technology Stack

- **Backend**: Python 3.11+, FastAPI, Scikit-learn, Pandas, NumPy, Joblib, Uvicorn, Matplotlib, Seaborn
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React
- **ML Storage**: Joblib serialized pipelines (`models/best_model.joblib`, `models/preprocessing.joblib`)

---

## 6. Project Architecture

```
food-demand-forecasting/
├── data/
│   ├── train.csv                     # 456,548 historical order rows
│   ├── fulfilment_center_info.csv    # 77 fulfillment centers
│   └── meal_info.csv                 # 51 meals
├── ml/
│   ├── preprocess.py                 # Cleaning, feature engineering, chronological split
│   ├── train.py                      # Model training, comparison, and evaluation
│   ├── evaluate.py                   # MAE, RMSE, MAPE, unusual demand & operational metrics
│   └── predict.py                    # Real-time inference pipeline
├── models/
│   ├── best_model.joblib             # Top performing trained model
│   ├── preprocessing.joblib          # Scikit-learn column transformer
│   └── feature_names.joblib          # Feature metadata & importances
├── outputs/
│   ├── model_comparison.csv          # Real benchmark comparison table
│   ├── metrics.json                  # Complete metrics & statistics
│   ├── predictions.csv               # Sample test set predictions
│   └── charts/                       # 10 generated academic EDA & evaluation charts
├── backend/
│   ├── main.py                       # FastAPI application entry point
│   ├── api/routes.py                 # REST API endpoints
│   ├── schemas/models.py             # Pydantic data schemas
│   ├── services/forecast_service.py  # Business logic & data access
│   └── utils/logger.py               # Structured logging
├── frontend/
│   ├── src/
│   │   ├── components/               # Sidebar, KPICard, LoadingSpinner
│   │   ├── pages/                    # Dashboard, Forecast, Analytics, Performance, Explorer, About
│   │   ├── services/api.ts           # Type-safe API client
│   │   ├── types/index.ts            # Data transfer contracts
│   │   ├── App.tsx                   # Main layout and router
│   │   └── main.tsx                  # React DOM root
│   ├── package.json
│   └── vite.config.ts
├── requirements.txt                  # Python dependencies
└── README.md
```

---

## 7. Installation & Quick Start

### 7.1 Prerequisites
- Python 3.10+ (Anaconda / Virtualenv recommended)
- Node.js 18+ and npm

### 7.2 Backend Setup
```bash
# Navigate to project root
cd food-demand-forecasting

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Re-train models from scratch
python -m ml.train

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000`  
Swagger API Docs: `http://localhost:8000/docs`

### 7.3 Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd food-demand-forecasting/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend UI will be live at: `http://localhost:5173`

---

## 8. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and project identification |
| `GET` | `/api/dashboard-summary` | Overall KPI summary, order aggregates, and best model metrics |
| `GET` | `/api/meals` | Complete list of distinct meal IDs, categories, and cuisines |
| `GET` | `/api/centers` | Complete list of fulfillment centers, operational areas, and city codes |
| `GET` | `/api/demand-history` | Weekly actual demand history for a specific `center_id` and `meal_id` |
| `POST` | `/api/predict` | Executes live inference; returns predicted demand and ceiling preparation quantity |
| `GET` | `/api/model-metrics` | Benchmark metrics (MAE, RMSE, MAPE) across all trained candidate models |
| `GET` | `/api/feature-importance` | Feature importances derived from the tree-based model |
| `GET` | `/api/analysis` | Normal vs unusual demand segmentation and promotional uplift stats |
| `GET` | `/api/charts-data` | Pre-aggregated time-series and categorical datasets for Recharts |
| `GET` | `/api/explorer` | Paginated search and filtering for historical dataset records |
| `GET` | `/api/charts/{filename}` | Serves static high-resolution PNG evaluation charts |

---

## 9. Generated Static Charts

The pipeline generates and saves 10 high-resolution charts in `outputs/charts/`:
1. `weekly_demand_trend.png`: 145-week cumulative demand trajectory with chronological split cutoffs.
2. `demand_distribution.png`: Frequency distribution of weekly item orders.
3. `demand_by_category.png`: Order volume broken down across 8 meal categories.
4. `demand_by_cuisine.png`: Demand comparative distribution across Italian, Thai, Indian, and Continental.
5. `promotion_vs_non_promotion.png`: Mean weekly orders under active email campaigns.
6. `homepage_featured_vs_non_featured.png`: Demand uplift for homepage featured placement.
7. `demand_by_center.png`: Order volume ranking of top 20 fulfillment centers.
8. `actual_vs_predicted.png`: Parity scatter plot on the unseen test set.
9. `model_comparison.png`: MAE and RMSE benchmark bar chart across candidate models.
10. `error_distribution.png`: Residual histogram centered around zero error.

---

## 10. Limitations & Future Scope

### Limitations
- **Omission of Weather & Holiday Features**: As stated in the data disclosures, external environmental drivers (rainfall, temperature, public holidays) are not present in the challenge dataset.
- **Heuristic Preparation Buffer**: Rounding continuous predictions upward ($\lceil \hat{y} \rceil$) guarantees whole units but does not optimize financial risk asymmetry.

### Future Scope
- **Asymmetric Cost Loss Functions**: Train custom loss functions that penalize shortages more heavily than surplus to align with commercial profit margins.
- **Deep Sequence Architectures**: Integrate Temporal Fusion Transformers (TFT) or N-BEATS with rolling autoregressive window lags.
- **Dynamic Weather API Integration**: Incorporate real-time meteorological radar feeds into production inference pipelines.

---

## 11. Institutional Verification

- **Institution**: Learn Depth Academy LLP
- **Track**: Track 2 – Advanced Machine Learning Internship
- **Project ID**: ML-T2-003
- **Author / Developer**: Full-Stack ML Intern Engineering Team
