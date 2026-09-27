const express = require("express");
const User = require("../models/User");
const WellnessAlert = require("../models/WellnessAlert");
const TypingEvent = require("../models/TypingEvent");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * Role-check middleware: ensures requester is a counselor or admin
 */
const requireCounselorOrAdmin = (req, res, next) => {
  if (!req.user || !["counselor", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Access forbidden: Counselor or Administrator credentials required."
    });
  }
  next();
};

/**
 * GET /api/admin/cohort-trends
 * Aggregate cohort-level wellness metrics over the specified time window.
 * 
 * PRIVACY GUARANTEE:
 * Returns ONLY anonymous counts, distributions, and date-aggregated trend volumes.
 * Zero individual student identities or private message references are ever included.
 */
router.get("/cohort-trends", authMiddleware, requireCounselorOrAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1. Fetch total monitored population
    const totalStudents = await User.countDocuments({ role: "student" });
    const optedInStudents = await User.countDocuments({
      role: "student",
      optedIntoWellnessMonitoring: true
    });

    // 2. Fetch alerts in the requested date range
    const alerts = await WellnessAlert.find({
      triggeredAt: { $gte: startDate }
    }).select("triggeredAt severity actionTaken resolvedAt");

    // 3. Compute aggregate breakdown
    const severityCounts = { low: 0, medium: 0, high: 0 };
    const actionCounts = { self_nudge_sent: 0, dismissed_by_user: 0, resource_viewed: 0, counselor_notified: 0 };
    const dateMap = {};

    // Initialize all dates in the range
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      dateMap[dateKey] = { date: dateKey, low: 0, medium: 0, high: 0, total: 0 };
    }

    alerts.forEach((alert) => {
      if (severityCounts[alert.severity] !== undefined) {
        severityCounts[alert.severity]++;
      }
      if (actionCounts[alert.actionTaken] !== undefined) {
        actionCounts[alert.actionTaken]++;
      }

      const dateKey = alert.triggeredAt.toISOString().slice(0, 10);
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, low: 0, medium: 0, high: 0, total: 0 };
      }
      dateMap[dateKey][alert.severity] = (dateMap[dateKey][alert.severity] || 0) + 1;
      dateMap[dateKey].total++;
    });

    const trends = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      timeWindowDays: days,
      population: {
        totalStudents,
        optedInStudents,
        optInPercentage: totalStudents > 0 ? Math.round((optedInStudents / totalStudents) * 100) : 0
      },
      summary: {
        totalAlerts: alerts.length,
        severityCounts,
        actionCounts
      },
      trends
    });
  } catch (err) {
    console.error("Fetch Cohort Trends Error:", err);
    res.status(500).json({ message: "Failed to fetch cohort trends", error: err.message });
  }
});

/**
 * GET /api/admin/escalation-candidates
 * 
 * THE ONE INDIVIDUAL-ESCALATION EXCEPTION:
 * Only surface an individual student's identity if BOTH criteria are met:
 * 1. User has 3+ UNRESOLVED HIGH-SEVERITY WellnessAlerts (`severity: 'high'`, `resolvedAt: null`)
 * 2. User has DISMISSED 2+ prior self-nudges (`actionTaken: 'dismissed_by_user'`) without the pattern resolving.
 * 
 * This is the ONLY place individual student identities ever appear in the counselor dashboard.
 */
router.get("/escalation-candidates", authMiddleware, requireCounselorOrAdmin, async (req, res) => {
  try {
    // 1. Find users who have high-severity unresolved alerts
    const highAlerts = await WellnessAlert.find({
      severity: "high",
      resolvedAt: null
    }).sort({ triggeredAt: -1 });

    // Group by userId
    const highAlertsByUser = {};
    for (const alert of highAlerts) {
      const uid = alert.userId.toString();
      if (!highAlertsByUser[uid]) {
        highAlertsByUser[uid] = [];
      }
      highAlertsByUser[uid].push(alert);
    }

    // Filter for users with >= 3 unresolved high alerts
    const qualifyingUserIds = Object.keys(highAlertsByUser).filter(
      (uid) => highAlertsByUser[uid].length >= 3
    );

    const escalationCandidates = [];

    // 2. Check second condition: >= 2 dismissed prior self-nudges
    for (const uid of qualifyingUserIds) {
      const dismissedCount = await WellnessAlert.countDocuments({
        userId: uid,
        actionTaken: "dismissed_by_user"
      });

      if (dismissedCount >= 2) {
        const user = await User.findById(uid).select("username email role createdAt");
        if (user) {
          // Get latest typing event distress score
          const latestEvent = await TypingEvent.findOne({ userId: uid })
            .sort({ timestamp: -1 })
            .select("distressScore contributingFactors timestamp");

          escalationCandidates.push({
            userId: user._id,
            username: user.username,
            email: user.email,
            unresolvedHighAlertsCount: highAlertsByUser[uid].length,
            dismissedNudgesCount: dismissedCount,
            latestAlertDate: highAlertsByUser[uid][0].triggeredAt,
            latestDistressScore: latestEvent?.distressScore || 0.9,
            contributingFactors: latestEvent?.contributingFactors || [
              "sustained_high_distress",
              "frequent_nudge_dismissal"
            ],
            reason: "Met Dual-Threshold Exception: ≥3 unresolved high-severity alerts and ≥2 dismissed nudges"
          });
        }
      }
    }

    res.json({
      success: true,
      criteriaMetCount: escalationCandidates.length,
      candidates: escalationCandidates,
      auditPolicy: "Individual identity surfaced strictly in accordance with the Dual-Threshold Safeguard Policy."
    });
  } catch (err) {
    console.error("Fetch Escalation Candidates Error:", err);
    res.status(500).json({ message: "Failed to fetch escalation candidates", error: err.message });
  }
});

module.exports = router;
