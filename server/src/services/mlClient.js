const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

const mlClient = {
  async predictDistress(userId, features) {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(userId), features })
      });

      if (!response.ok) {
        console.warn(`[ML Service] Predict returned status ${response.status}`);
        return {
          distressScore: 0.0,
          isolationForestScore: 0.0,
          lstmReconstructionScore: 0.0,
          contributingFactors: [],
          confidence: 0.0,
          baseline_not_ready: true
        };
      }

      return await response.json();
    } catch (err) {
      console.warn(`[ML Service Unavailable] Skipping ML scoring: ${err.message}`);
      return {
        distressScore: 0.0,
        isolationForestScore: 0.0,
        lstmReconstructionScore: 0.0,
        contributingFactors: [],
        confidence: 0.0,
        baseline_not_ready: true
      };
    }
  },

  async calibrateBaseline(userId, recentFeatureVectors) {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/calibrate-baseline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: String(userId),
          recentFeatureVectors
        })
      });

      if (!response.ok) {
        console.warn(`[ML Service] Calibration returned status ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (err) {
      console.warn(`[ML Service Unavailable] Baseline calibration skipped: ${err.message}`);
      return null;
    }
  }
};

module.exports = mlClient;