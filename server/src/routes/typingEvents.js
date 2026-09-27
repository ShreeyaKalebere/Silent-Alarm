const express = require("express");
const TypingEvent = require("../models/TypingEvent");
const authMiddleware = require("../middleware/auth");
const mlClient = require("../services/mlClient");
const alertService = require("../services/alertService");

const router = express.Router();

/**
 * PRIVACY AUDIT GUARANTEE:
 * ------------------------
 * This endpoint stores ONLY numeric behavioral-biometric timing metrics and a boolean
 * messageAbandoned flag. It rejects any request containing text, characters, key codes,
 * or raw message contents.
 */
const FORBIDDEN_CONTENT_KEYS = ["text", "content", "message", "key", "code", "char", "character", "keystrokes"];

// POST /api/typing-event
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { roomId, features, timestamp } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }

    if (!features || typeof features !== "object") {
      return res.status(400).json({ message: "features object is required" });
    }

    // Strict Privacy Verification: Ensure zero text or key identity fields exist
    for (const forbiddenKey of FORBIDDEN_CONTENT_KEYS) {
      if (req.body[forbiddenKey] !== undefined || features[forbiddenKey] !== undefined) {
        return res.status(400).json({
          message: `Privacy violation: Forbidden field '${forbiddenKey}' detected. Only numeric timing features are permitted.`
        });
      }
    }

    // Verify all timing fields are strictly numeric or expected boolean
    const sanitizedFeatures = {
      avgDwellTime: Number(features.avgDwellTime) || 0,
      avgFlightTime: Number(features.avgFlightTime) || 0,
      wpm: Number(features.wpm) || 0,
      wpmVariance: Number(features.wpmVariance) || 0,
      backspaceRate: Number(features.backspaceRate) || 0,
      pauseCount: Number(features.pauseCount) || 0,
      pauseDurationTotal: Number(features.pauseDurationTotal) || 0,
      burstTypingScore: Number(features.burstTypingScore) || 0,
      messageAbandoned: Boolean(features.messageAbandoned)
    };

    // 1. Save initial TypingEvent document
    const typingEvent = new TypingEvent({
      userId: req.user._id,
      roomId: String(roomId),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      features: sanitizedFeatures,
      distressScore: 0,
      contributingFactors: []
    });

    await typingEvent.save();

    // 2. Call Python ML Microservice asynchronously/immediately for scoring
    const io = req.app.get("io");
    let distressScore = 0;
    let contributingFactors = [];

    try {
      const mlPrediction = await mlClient.predictDistress(
        req.user._id.toString(),
        sanitizedFeatures
      );

      distressScore = mlPrediction.distressScore || 0;
      contributingFactors = mlPrediction.contributingFactors || [];

      // Update the document with ML results (update, do not duplicate)
      await TypingEvent.findByIdAndUpdate(typingEvent._id, {
        distressScore,
        contributingFactors
      });

      // 3. Evaluate alert trigger logic (last 3 consecutive events > 0.7)
      if (distressScore > 0.7) {
        await alertService.evaluateTypingEvent(req.user._id, io);
      }

      // 4. Per-user counter: trigger calibration on multiples of 50
      const userEventCount = await TypingEvent.countDocuments({ userId: req.user._id });
      if (userEventCount % 50 === 0) {
        const recentEvents = await TypingEvent.find({ userId: req.user._id })
          .sort({ timestamp: -1 })
          .limit(100)
          .select("features");

        const vectors = recentEvents.map((ev) => ev.features);
        mlClient.calibrateBaseline(req.user._id.toString(), vectors).catch((err) => {
          console.warn("[ML Calibration Notice]:", err.message);
        });
      }
    } catch (mlErr) {
      console.warn("[ML Scoring Notice]: Failed to score event:", mlErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Typing event features recorded successfully",
      eventId: typingEvent._id,
      distressScore,
      contributingFactors
    });
  } catch (error) {
    console.error("Record Typing Event Error:", error);
    res.status(500).json({
      message: "Failed to record typing event",
      error: error.message
    });
  }
});

module.exports = router;