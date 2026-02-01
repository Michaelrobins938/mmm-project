"""
FastAPI Server for Media Mix Model (MMM)

Provides REST API endpoints for:
- Data upload and management
- Model fitting
- Predictions
- ROI computation
- Budget optimization
- Validation
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import pandas as pd
import numpy as np
import json
import os
import sys
from datetime import datetime
import uuid
import shutil

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from synthetic_data import SyntheticMMMDataGenerator
from bayesian_mmm import BayesianMMM
from optimizer import BudgetOptimizer
from validation import MMMValidator

# Initialize FastAPI app
app = FastAPI(
    title="Bayesian Media Mix Model (MMM) API",
    description="Production-ready API for Media Mix Modeling with adstock, saturation, and budget optimization",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage paths
DATA_DIR = "./data"
MODELS_DIR = "./models"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# In-memory model storage (use Redis in production)
models = {}


# Pydantic models for request/response
class FitModelRequest(BaseModel):
    dataset_id: str
    channel_columns: List[str]
    target_column: str
    date_column: Optional[str] = None
    control_columns: Optional[List[str]] = None
    use_adstock: bool = True
    use_saturation: bool = True
    use_trend: bool = True
    use_seasonality: bool = True


class OptimizeBudgetRequest(BaseModel):
    model_id: str
    total_budget: float
    min_budgets: Optional[Dict[str, float]] = None
    max_budgets: Optional[Dict[str, float]] = None


class PredictRequest(BaseModel):
    model_id: str
    dataset_id: str
    return_components: bool = False


class ROICalculationRequest(BaseModel):
    model_id: str
    dataset_id: str


class GenerateDataRequest(BaseModel):
    n_weeks: int = 104
    channels: List[str] = ["TV", "Radio", "Digital", "Social"]
    base_revenue: float = 100000


# API Endpoints

@app.get("/")
def root():
    """API root endpoint."""
    return {
        "message": "Bayesian Media Mix Model (MMM) API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": len(models)
    }


@app.post("/data/upload")
async def upload_data(file: UploadFile = File(...)):
    """Upload a CSV dataset."""
    try:
        # Generate unique ID
        dataset_id = str(uuid.uuid4())[:8]
        
        # Save file
        file_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Load and validate
        df = pd.read_csv(file_path)
        
        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "columns": list(df.columns),
            "rows": len(df),
            "file_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/data/generate")
def generate_synthetic_data(request: GenerateDataRequest):
    """Generate synthetic MMM data."""
    try:
        dataset_id = str(uuid.uuid4())[:8]
        
        generator = SyntheticMMMDataGenerator(
            n_weeks=request.n_weeks,
            channels=request.channels
        )
        
        df, ground_truth = generator.generate(base_revenue=request.base_revenue)
        
        # Save data
        file_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
        df.to_csv(file_path, index=False)
        
        # Save ground truth
        gt_path = os.path.join(DATA_DIR, f"{dataset_id}_ground_truth.json")
        generator.save_ground_truth(gt_path)
        
        return {
            "dataset_id": dataset_id,
            "file_path": file_path,
            "ground_truth_path": gt_path,
            "rows": len(df),
            "columns": list(df.columns),
            "channels": request.channels,
            "true_roi": ground_truth['true_roi']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/data/{dataset_id}")
def get_dataset(dataset_id: str, limit: int = 100):
    """Get dataset preview."""
    try:
        file_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = pd.read_csv(file_path)
        
        return {
            "dataset_id": dataset_id,
            "columns": list(df.columns),
            "total_rows": len(df),
            "preview": df.head(limit).to_dict(orient='records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/model/fit")
def fit_model(request: FitModelRequest, background_tasks: BackgroundTasks):
    """Fit a Bayesian MMM model."""
    try:
        # Load data
        file_path = os.path.join(DATA_DIR, f"{request.dataset_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = pd.read_csv(file_path)
        
        # Create model
        model_id = str(uuid.uuid4())[:8]
        
        model = BayesianMMM(
            channel_names=request.channel_columns,
            use_adstock=request.use_adstock,
            use_saturation=request.use_saturation,
            use_trend=request.use_trend,
            use_seasonality=request.use_seasonality,
            sampler_config={
                'draws': 500,
                'tune': 500,
                'chains': 4,
                'cores': 4,
                'target_accept': 0.95
            }
        )
        
        # Fit model
        model.fit(
            df,
            target_col=request.target_column,
            date_col=request.date_column,
            control_cols=request.control_columns,
            progressbar=False
        )
        
        # Store model
        models[model_id] = {
            'model': model,
            'dataset_id': request.dataset_id,
            'fitted_at': datetime.now().isoformat(),
            'config': request.dict()
        }
        
        # Extract fitted parameters
        fitted_params = {
            'intercept': model.fitted_params.get('intercept'),
            'sigma': model.fitted_params.get('sigma'),
            'channels': {}
        }
        
        for channel in request.channel_columns:
            params = model.fitted_params['channels'].get(channel, {})
            fitted_params['channels'][channel] = {
                'beta': params.get('beta'),
                'decay': params.get('decay'),
                'alpha_sat': params.get('alpha_sat'),
                'K_sat': params.get('K_sat')
            }
        
        return {
            "model_id": model_id,
            "status": "fitted",
            "fitted_params": fitted_params,
            "dataset_id": request.dataset_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model/{model_id}")
def get_model(model_id: str):
    """Get model information."""
    if model_id not in models:
        raise HTTPException(status_code=404, detail="Model not found")
    
    model_info = models[model_id]
    model = model_info['model']
    
    return {
        "model_id": model_id,
        "status": "fitted",
        "fitted_at": model_info['fitted_at'],
        "dataset_id": model_info['dataset_id'],
        "channels": model.channel_names,
        "is_fitted": model.is_fitted
    }


@app.post("/model/{model_id}/predict")
def predict(request: PredictRequest):
    """Generate predictions from fitted model."""
    try:
        if request.model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Load data
        file_path = os.path.join(DATA_DIR, f"{request.dataset_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = pd.read_csv(file_path)
        
        model = models[request.model_id]['model']
        predictions = model.predict(df, return_components=request.return_components)
        
        response = {
            "predictions": predictions['mean'].tolist(),
            "lower_bound": predictions['lower'].tolist(),
            "upper_bound": predictions['upper'].tolist()
        }
        
        if request.return_components and 'components' in predictions:
            response['components'] = {
                k: v.tolist() for k, v in predictions['components'].items()
            }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/model/{model_id}/roi")
def calculate_roi(model_id: str, request: ROICalculationRequest):
    """Calculate ROI for each channel."""
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Load data
        file_path = os.path.join(DATA_DIR, f"{request.dataset_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = pd.read_csv(file_path)
        model = models[model_id]['model']
        
        roi_results = model.compute_roi(df)
        
        return {
            "model_id": model_id,
            "roi_by_channel": roi_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize")
def optimize_budget(request: OptimizeBudgetRequest):
    """Optimize budget allocation."""
    try:
        if request.model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models[request.model_id]
        model = model_info['model']
        
        # Build channel params
        channel_params = {}
        for channel in model.channel_names:
            params = model.fitted_params['channels'].get(channel, {})
            channel_params[channel] = {
                'beta': params.get('beta', 1.0),
                'decay': params.get('decay', 0.5),
                'alpha_sat': params.get('alpha_sat', 50000),
                'K_sat': params.get('K_sat', 10000)
            }
        
        # Create optimizer
        optimizer = BudgetOptimizer(
            model.channel_names,
            channel_params,
            request.total_budget
        )
        
        # Set constraints
        if request.min_budgets or request.max_budgets:
            optimizer.set_constraints(
                min_budgets=request.min_budgets,
                max_budgets=request.max_budgets
            )
        
        # Optimize
        result = optimizer.optimize()
        
        return {
            "model_id": request.model_id,
            "total_budget": request.total_budget,
            "optimal_allocation": result['optimal_budget'],
            "expected_contribution": result['expected_contribution'],
            "net_profit": result['net_profit'],
            "roi_by_channel": result['roi'],
            "marginal_returns": result['marginal_returns'],
            "optimization_success": result['optimization_success']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/model/{model_id}/validate")
def validate_model(model_id: str, dataset_id: str):
    """Validate model performance."""
    try:
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Load data
        file_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
        gt_path = os.path.join(DATA_DIR, f"{dataset_id}_ground_truth.json")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = pd.read_csv(file_path)
        model = models[model_id]['model']
        
        # Load ground truth if available
        ground_truth = None
        if os.path.exists(gt_path):
            with open(gt_path, 'r') as f:
                ground_truth = json.load(f)
        
        # Validate
        validator = MMMValidator(model, ground_truth)
        
        results = {
            "convergence": validator.validate_model_convergence(),
            "prediction_accuracy": validator.validate_prediction_accuracy(df)
        }
        
        if ground_truth:
            results['parameter_recovery'] = validator.validate_parameter_recovery()
            results['roi_accuracy'] = validator.validate_roi_accuracy(df)
        
        return {
            "model_id": model_id,
            "validation_results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models")
def list_models():
    """List all fitted models."""
    return {
        "models": [
            {
                "model_id": mid,
                "fitted_at": info['fitted_at'],
                "dataset_id": info['dataset_id'],
                "channels": info['config']['channel_columns']
            }
            for mid, info in models.items()
        ]
    }


# Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
