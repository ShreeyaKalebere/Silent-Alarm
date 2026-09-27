from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
import uvicorn

from config import PORT, HOST, W1, W2, MIN_BASELINE_SAMPLES, FEATURE_KEYS
from services.baseline_store import (
    get_baseline,
    save_baseline,
    add_vector,
    get_recent_vectors,
    get_vector_count
)
from models.isolation_forest import iso_manager
from models.lstm_autoencoder import lstm_manager
from services.explainer import generate_contributing_factors

app = FastAPI(title="Silent Alarm ML Distress Detection Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeatureVector(BaseModel):
    avgDwellTime: float = 0.0
    avgFlightTime: float = 0.0
    wpm: float = 0.0
    wpmVariance: float = 0.0
    backspaceRate: float = 0.0
    pauseCount: float = 0.0
    pauseDurationTotal: float = 0.0
    burstTypingScore: float = 0.0
    messageAbandoned: bool = False

class PredictRequest(BaseModel):
    userId: str
    features: FeatureVector

class PredictResponse(BaseModel):
    distressScore: float
    isolationForestScore: float
    lstmReconstructionScore: float
    contributingFactors: List[str]
    confidence: float
    baseline_not_ready: bool

class CalibrateRequest(BaseModel):
    userId: str
    recentFeatureVectors: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/calibrate-baseline")
def calibrate_baseline(req: CalibrateRequest):
    vectors = req.recentFeatureVectors
    if not vectors or len(vectors) < 5:
        raise HTTPException(status_code=400, detail="At least 5 vectors are required to calibrate")

    means = {}
    stds = {}

    for k in FEATURE_KEYS:
        vals = [float(v.get(k, 0.0)) for v in vectors]
        means[k] = round(float(np.mean(vals)), 3)
        std_val = float(np.std(vals))
        stds[k] = round(max(std_val, 0.01), 3)

    sample_count = len(vectors)
    save_baseline(req.userId, means, stds, sample_count)

    # Store recent vectors into local SQLite history
    for vec in vectors[-50:]:
        add_vector(req.userId, vec)

    baseline = {"means": means, "stds": stds, "sample_count": sample_count}
    # Retrain per-user IsolationForest on calibrated data
    iso_manager.fit_user_model(req.userId, vectors, baseline)

    return {
        "userId": req.userId,
        "sampleCount": sample_count,
        "means": means,
        "stds": stds,
        "status": "calibrated"
    }

@app.post("/predict", response_model=PredictResponse)
def predict_distress(req: PredictRequest):
    user_id = req.userId
    features_dict = req.features.model_dump()

    baseline = get_baseline(user_id)

    # Guard: Require calibrated baseline with at least 50 historical vectors
    if not baseline or baseline["sample_count"] < MIN_BASELINE_SAMPLES:
        # Still record vector to build up sample count
        add_vector(user_id, features_dict)
        return PredictResponse(
            distressScore=0.0,
            isolationForestScore=0.0,
            lstmReconstructionScore=0.0,
            contributingFactors=[],
            confidence=0.0,
            baseline_not_ready=True
        )

    # Record this incoming vector
    add_vector(user_id, features_dict)

    # Model 1: IsolationForest per-message anomaly score
    iso_score = iso_manager.predict_anomaly_score(user_id, features_dict, baseline)

    # Model 2: PyTorch LSTM Autoencoder sequence drift score
    recent_vectors = get_recent_vectors(user_id, limit=20)
    lstm_score = lstm_manager.compute_reconstruction_score(recent_vectors, baseline)

    # Combine scores with configurable weights
    if lstm_score > 0:
        combined = (W1 * iso_score) + (W2 * lstm_score)
        confidence = 0.85
    else:
        combined = iso_score
        confidence = 0.65

    # If message was abandoned, apply a slight upward adjustment
    if req.features.messageAbandoned:
        combined = min(1.0, combined + 0.15)

    final_distress = round(float(np.clip(combined, 0.0, 1.0)), 3)

    # Explainability: Top contributing factors
    factors = generate_contributing_factors(features_dict, baseline, recent_vectors)

    return PredictResponse(
        distressScore=final_distress,
        isolationForestScore=iso_score,
        lstmReconstructionScore=lstm_score,
        contributingFactors=factors,
        confidence=confidence,
        baseline_not_ready=False
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)