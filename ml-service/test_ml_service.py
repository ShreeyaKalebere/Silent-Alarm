import urllib.request
import json

BASE_URL = "http://127.0.0.1:8001"

def post_json(path, data):
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))

def run_tests():
    print("--- 1. Testing Uncalibrated User Predict ---")
    res1 = post_json("/predict", {
        "userId": "test_student_new",
        "features": {
            "avgDwellTime": 110, "avgFlightTime": 200, "wpm": 45,
            "wpmVariance": 4, "backspaceRate": 0.04, "pauseCount": 1,
            "pauseDurationTotal": 1600, "burstTypingScore": 1.1,
            "messageAbandoned": False
        }
    })
    print("Uncalibrated response:", res1)
    assert res1["baseline_not_ready"] is True
    assert res1["distressScore"] == 0.0
    print("[PASS] Correctly blocked scoring on uncalibrated baseline!")

    print("\n--- 2. Testing Baseline Calibration (60 vectors) ---")
    import random
    random.seed(42)
    vectors = []
    for _ in range(60):
        vectors.append({
            "avgDwellTime": random.gauss(110, 10),
            "avgFlightTime": random.gauss(200, 20),
            "wpm": random.gauss(50, 5),
            "wpmVariance": random.gauss(4, 1),
            "backspaceRate": random.uniform(0.02, 0.08),
            "pauseCount": random.choice([0, 1]),
            "pauseDurationTotal": random.uniform(0, 2000),
            "burstTypingScore": random.uniform(0.9, 1.3),
            "messageAbandoned": False
        })
    cal_res = post_json("/calibrate-baseline", {
        "userId": "test_student_calibrated",
        "recentFeatureVectors": vectors
    })
    print(f"Calibration response: {cal_res['status']}, sampleCount: {cal_res['sampleCount']}")
    assert cal_res["sampleCount"] == 60
    print("[PASS] User calibrated successfully with 60 vectors!")

    print("\n--- 3. Testing Normal Predict on Calibrated User ---")
    normal_res = post_json("/predict", {
        "userId": "test_student_calibrated",
        "features": {
            "avgDwellTime": 112, "avgFlightTime": 205, "wpm": 49,
            "wpmVariance": 4.1, "backspaceRate": 0.05, "pauseCount": 0,
            "pauseDurationTotal": 0, "burstTypingScore": 1.0,
            "messageAbandoned": False
        }
    })
    print("Normal predict response:", normal_res)
    assert normal_res["baseline_not_ready"] is False
    assert normal_res["distressScore"] < 0.6
    print("[PASS] Normal typing yielded low distress score!")

    print("\n--- 4. Testing Severe Distress Anomaly Sequence ---")
    # Send sequence of anomalous distressed events (long pauses, dropped WPM, high backspace)
    distressed_features = {
        "avgDwellTime": 195.0,        # Elevated hold time
        "avgFlightTime": 650.0,       # Very slow flight time
        "wpm": 18.0,                 # Speed dropped ~64%
        "wpmVariance": 24.5,          # High variance
        "backspaceRate": 0.42,        # Backspace rate 6x
        "pauseCount": 6,              # Multiple pauses
        "pauseDurationTotal": 14500,  # >14 seconds paused
        "burstTypingScore": 3.4,      # Erratic bursts
        "messageAbandoned": False
    }
    # Simulate series of 3 consecutive distressed events
    final_res = None
    for i in range(4):
        final_res = post_json("/predict", {
            "userId": "test_student_calibrated",
            "features": distressed_features
        })
    print("Distressed predict response:", final_res)
    assert final_res["distressScore"] >= 0.6
    assert len(final_res["contributingFactors"]) > 0
    print(f"[PASS] Distress score elevated to: {final_res['distressScore']}, factors: {final_res['contributingFactors']}")

    print("\n=============================================")
    print("ALL PYTHON ML MICROSERVICE UNIT TESTS PASSED!")
    print("=============================================\n")

if __name__ == "__main__":
    run_tests()