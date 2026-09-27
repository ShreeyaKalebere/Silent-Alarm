import os

PORT = int(os.getenv("PORT", "8001"))
HOST = os.getenv("HOST", "0.0.0.0")

# Model weights
W1 = float(os.getenv("W1", "0.5"))  # IsolationForest weight
W2 = float(os.getenv("W2", "0.5"))  # LSTM Autoencoder weight

# Calibration threshold
MIN_BASELINE_SAMPLES = int(os.getenv("MIN_BASELINE_SAMPLES", "50"))

# Sequence length for LSTM sequence evaluation
SEQUENCE_LENGTH = int(os.getenv("SEQUENCE_LENGTH", "10"))

# Numeric features evaluated for behavioral timing
FEATURE_KEYS = [
    "avgDwellTime",
    "avgFlightTime",
    "wpm",
    "wpmVariance",
    "backspaceRate",
    "pauseCount",
    "pauseDurationTotal",
    "burstTypingScore",
]

# Database path for local SQLite baselines
DB_PATH = os.path.join(os.path.dirname(__file__), "baselines.db")