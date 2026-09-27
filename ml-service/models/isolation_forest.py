import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, List, Optional
from config import FEATURE_KEYS

class UserIsolationForestManager:
    def __init__(self):
        # user_id -> IsolationForest instance
        self.models: Dict[str, IsolationForest] = {}
        # user_id -> list of float scores (last 5)
        self.rolling_scores: Dict[str, List[float]] = {}

    def _z_score_vector(self, features: dict, baseline: dict) -> np.ndarray:
        means = baseline["means"]
        stds = baseline["stds"]
        z_vector = []
        for key in FEATURE_KEYS:
            val = float(features.get(key, 0.0))
            m = float(means.get(key, 0.0))
            s = float(stds.get(key, 1.0))
            if s <= 1e-6:
                s = 1.0
            z_vector.append((val - m) / s)
        return np.array(z_vector, dtype=np.float32)

    def fit_user_model(self, user_id: str, historical_vectors: List[dict], baseline: dict):
        if len(historical_vectors) < 10:
            return
        
        X = []
        for vec in historical_vectors:
            X.append(self._z_score_vector(vec, baseline))
        X = np.array(X, dtype=np.float32)

        # Train per-user Isolation Forest on normalized historical data
        iso = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
            n_jobs=-1
        )
        iso.fit(X)
        self.models[user_id] = iso

    def predict_anomaly_score(self, user_id: str, features: dict, baseline: dict) -> float:
        # If model not trained yet, initialize default fit or fallback
        if user_id not in self.models:
            # Synthetic standard normal baseline initialization
            iso = IsolationForest(n_estimators=50, contamination=0.1, random_state=42)
            np.random.seed(42)
            synthetic_normal = np.random.normal(0, 1, size=(50, len(FEATURE_KEYS)))
            iso.fit(synthetic_normal)
            self.models[user_id] = iso

        iso = self.models[user_id]
        z_vec = self._z_score_vector(features, baseline).reshape(1, -1)
        
        # decision_function: lower is more anomalous (typically in range [-0.5, 0.5])
        decision = iso.decision_function(z_vec)[0]
        # Map decision to 0.0 (normal) -> 1.0 (anomalous)
        # decision ~ 0.15 is very normal, decision ~ -0.15 is anomalous
        raw_anomaly = -float(decision)
        normalized_score = float(np.clip((raw_anomaly + 0.15) / 0.35, 0.0, 1.0))

        # Maintain rolling window of last 5 scores per user
        if user_id not in self.rolling_scores:
            self.rolling_scores[user_id] = []
        
        self.rolling_scores[user_id].append(normalized_score)
        if len(self.rolling_scores[user_id]) > 5:
            self.rolling_scores[user_id].pop(0)

        recent = self.rolling_scores[user_id]
        anomaly_count = sum(1 for s in recent if s >= 0.6)

        # Only pass through full distress score if at least 3 of last 5 are above anomaly threshold
        if anomaly_count >= 3:
            effective_score = normalized_score
        else:
            # Single spike dampening
            effective_score = normalized_score * 0.4

        return round(float(np.clip(effective_score, 0.0, 1.0)), 3)

iso_manager = UserIsolationForestManager()