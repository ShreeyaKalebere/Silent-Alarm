const mongoose = require("mongoose");

const typingFeaturesSchema = new mongoose.Schema(
  {
    avgDwellTime: { type: Number, default: 0 },
    avgFlightTime: { type: Number, default: 0 },
    wpm: { type: Number, default: 0 },
    wpmVariance: { type: Number, default: 0 },
    backspaceRate: { type: Number, default: 0 },
    pauseCount: { type: Number, default: 0 },
    pauseDurationTotal: { type: Number, default: 0 },
    burstTypingScore: { type: Number, default: 0 },
    messageAbandoned: { type: Boolean, default: false }
  },
  { _id: false }
);

const typingEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  features: {
    type: typingFeaturesSchema,
    default: () => ({})
  },
  distressScore: {
    type: Number,
    default: 0
  },
  contributingFactors: {
    type: [String],
    default: []
  }
});

// TTL index: auto-delete documents after 30 days (30 * 24 * 60 * 60 = 2,592,000 seconds)
typingEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model("TypingEvent", typingEventSchema);
