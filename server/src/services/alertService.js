const TypingEvent = require("../models/TypingEvent");
const WellnessAlert = require("../models/WellnessAlert");
const { emitToUser } = require("../sockets/chatHandler");

const alertService = {
  async evaluateTypingEvent(userId, io) {
    try {
      // 1. Fetch last 3 consecutive TypingEvents for this user
      const recentEvents = await TypingEvent.find({ userId })
        .sort({ timestamp: -1 })
        .limit(3);

      if (recentEvents.length < 3) {
        return null;
      }

      // Check if all 3 consecutive events had distressScore > 0.7
      const allDistressed = recentEvents.every(
        (ev) => typeof ev.distressScore === "number" && ev.distressScore > 0.7
      );

      if (!allDistressed) {
        return null;
      }

      // 2. Check if an unresolved WellnessAlert exists within roughly the last 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existingAlert = await WellnessAlert.findOne({
        userId,
        resolvedAt: null,
        triggeredAt: { $gte: oneHourAgo }
      });

      if (existingAlert) {
        return null; // Suppress duplicate alert within 1 hour
      }

      // 3. Compute severity based on latest event score
      const latestScore = recentEvents[0].distressScore;
      let severity = "low";
      if (latestScore >= 0.9) {
        severity = "high";
      } else if (latestScore >= 0.8) {
        severity = "medium";
      }

      // 4. Create new WellnessAlert
      const newAlert = new WellnessAlert({
        userId,
        triggeredAt: new Date(),
        severity,
        actionTaken: "self_nudge_sent",
        resolvedAt: null
      });

      await newAlert.save();
      console.log(`[AlertService] Created ${severity}-severity WellnessAlert for user ${userId}`);

      // 5. Emit private Socket.io event scoped strictly to that user
      if (io) {
        emitToUser(io, userId.toString(), "wellness_nudge", {
          alertId: newAlert._id,
          severity: newAlert.severity,
          triggeredAt: newAlert.triggeredAt,
          message: "Hey, just checking in — everything okay? 💙"
        });
      }

      return newAlert;
    } catch (err) {
      console.error("[AlertService Error]:", err);
      return null;
    }
  }
};

module.exports = alertService;