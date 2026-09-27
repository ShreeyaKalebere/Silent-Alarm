from typing import List, Dict
from config import FEATURE_KEYS

def generate_contributing_factors(
    features: dict,
    baseline: dict,
    recent_vectors: List[dict] = None
) -> List[str]:
    """
    Computes rule-based explainability factors comparing the current
    feature vector to the user's calibrated baseline.
    """
    means = baseline["means"]
    stds = baseline["stds"]

    deviations = []

    for k in FEATURE_KEYS:
        val = float(features.get(k, 0.0))
        m = float(means.get(k, 0.0))
        s = float(stds.get(k, 1.0))
        if s <= 1e-6:
            s = 1.0

        z = (val - m) / s
        abs_z = abs(z)

        factor_str = None

        if k == "backspaceRate" and val > (m * 1.4) and z > 1.0:
            factor_str = f"backspace_rate_{round(val / max(m, 0.01), 1)}x_baseline"
        elif k == "wpm" and val < (m * 0.75) and z < -1.0:
            drop_pct = int(round((1.0 - (val / max(m, 1.0))) * 100))
            factor_str = f"typing_speed_dropped_{drop_pct}%"
        elif k == "wpm" and val > (m * 1.5) and z > 1.5:
            spike_pct = int(round(((val / max(m, 1.0)) - 1.0) * 100))
            factor_str = f"typing_speed_spiked_{spike_pct}%"
        elif k in ["pauseCount", "pauseDurationTotal"] and val > (m * 1.5) and z > 1.2:
            ratio = round(val / max(m, 1.0), 1)
            factor_str = f"prolonged_pauses_{ratio}x_baseline"
        elif k == "avgDwellTime" and z > 1.3:
            factor_str = f"key_dwell_time_elevated_{round(z, 1)}sd"
        elif k == "burstTypingScore" and val > 1.8 and z > 1.2:
            factor_str = f"burst_typing_instability_{round(val, 1)}x"
        elif abs_z > 1.5:
            direction = "elevated" if z > 0 else "reduced"
            factor_str = f"{k}_{direction}_{round(abs_z, 1)}sd"

        if factor_str and abs_z > 1.0:
            deviations.append((abs_z, factor_str))

    # Sort by strongest deviation first
    deviations.sort(key=lambda x: x[0], reverse=True)
    factors = [d[1] for d in deviations[:3]]

    # Check for recent message abandonment
    if recent_vectors:
        abandoned_count = sum(
            1 for v in recent_vectors[-10:] if v.get("messageAbandoned", False)
        )
        if features.get("messageAbandoned", False):
            abandoned_count += 1

        if abandoned_count >= 2:
            factors.insert(0, f"{abandoned_count}_abandoned_messages_recently")

    return factors[:3]