const express = require("express");
const TypingEvent = require("../models/TypingEvent");
const WellnessAlert = require("../models/WellnessAlert");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/wellness/my-history
 * Returns the authenticated user's own 30-day telemetry history and alerts.
 * Privacy rule: Users can ONLY ever access their own data.
 */
router.get("/my-history", authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. User's own distress score time-series over last 30 days
    const events = await TypingEvent.find({
      userId: req.user._id,
      timestamp: { $gte: thirtyDaysAgo }
    })
      .sort({ timestamp: 1 })
      .select("timestamp distressScore contributingFactors features");

    // 2. User's own WellnessAlert history
    const alerts = await WellnessAlert.find({
      userId: req.user._id,
      triggeredAt: { $gte: thirtyDaysAgo }
    }).sort({ triggeredAt: -1 });

    // 3. User's baseline profile & opt-in status
    const userDoc = await User.findById(req.user._id).select(
      "optedIntoWellnessMonitoring baselineProfile username role"
    );

    res.json({
      success: true,
      user: userDoc,
      history: events.map((e) => ({
        id: e._id,
        timestamp: e.timestamp,
        distressScore: e.distressScore || 0,
        contributingFactors: e.contributingFactors || [],
        wpm: e.features?.wpm || 0,
        pauseCount: e.features?.pauseCount || 0,
        backspaceRate: e.features?.backspaceRate || 0,
        messageAbandoned: e.features?.messageAbandoned || false
      })),
      alerts: alerts.map((a) => ({
        id: a._id,
        triggeredAt: a.triggeredAt,
        severity: a.severity,
        actionTaken: a.actionTaken,
        resolvedAt: a.resolvedAt
      }))
    });
  } catch (err) {
    console.error("Fetch My Wellness History Error:", err);
    res.status(500).json({ message: "Failed to fetch wellness history", error: err.message });
  }
});

/**
 * PUT /api/wellness/alerts/:id/resolve
 * Updates the user's alert status when they respond to a nudge or view resources.
 */
router.put("/alerts/:id/resolve", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken } = req.body;

    const allowedActions = ["dismissed_by_user", "resource_viewed", "counselor_notified"];
    const chosenAction = allowedActions.includes(actionTaken) ? actionTaken : "dismissed_by_user";

    const alert = await WellnessAlert.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        actionTaken: chosenAction,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Wellness alert not found or unauthorized" });
    }

    res.json({
      success: true,
      message: "Alert resolved successfully",
      alert
    });
  } catch (err) {
    console.error("Resolve Alert Error:", err);
    res.status(500).json({ message: "Failed to resolve alert", error: err.message });
  }
});

/**
 * DELETE /api/wellness/my-data
 * Right to Erasure / GDPR-grade data purge:
 * Immediately disables wellness monitoring and permanently purges all TypingEvent documents.
 */
router.delete("/my-data", authMiddleware, async (req, res) => {
  try {
    // 1. Opt out
    await User.findByIdAndUpdate(req.user._id, {
      optedIntoWellnessMonitoring: false
    });

    // 2. Permanently delete all TypingEvents for this user
    const deleteResult = await TypingEvent.deleteMany({ userId: req.user._id });

    console.log(
      `[Privacy Erasure] User ${req.user.username} purged ${deleteResult.deletedCount} typing events.`
    );

    res.json({
      success: true,
      message: "All typing rhythm telemetry has been permanently purged and monitoring is disabled.",
      deletedEventsCount: deleteResult.deletedCount
    });
  } catch (err) {
    console.error("Purge Telemetry Error:", err);
    res.status(500).json({ message: "Failed to purge telemetry", error: err.message });
  }
});

module.exports = router;
