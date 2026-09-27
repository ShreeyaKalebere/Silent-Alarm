const mongoose = require("mongoose");

const baselineProfileSchema = new mongoose.Schema(
  {
    meanDwellTime: { type: Number, default: 0 },
    stdDwellTime: { type: Number, default: 0 },
    meanFlightTime: { type: Number, default: 0 },
    stdFlightTime: { type: Number, default: 0 },
    meanWPM: { type: Number, default: 0 },
    stdWPM: { type: Number, default: 0 },
    meanBackspaceRate: { type: Number, default: 0 },
    sampleCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "counselor", "admin"],
    default: "student"
  },
  optedIntoWellnessMonitoring: {
    type: Boolean,
    default: false
  },
  baselineProfile: {
    type: baselineProfileSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
