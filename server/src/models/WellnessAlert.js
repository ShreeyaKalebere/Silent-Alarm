const mongoose = require("mongoose");

const wellnessAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  },
  actionTaken: {
    type: String,
    enum: ["self_nudge_sent", "counselor_notified", "dismissed_by_user", "resource_viewed"],
    default: "self_nudge_sent"
  },
  resolvedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model("WellnessAlert", wellnessAlertSchema);
