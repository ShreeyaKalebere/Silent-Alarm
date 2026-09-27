require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const TypingEvent = require("../models/TypingEvent");
const WellnessAlert = require("../models/WellnessAlert");
const mlClient = require("../services/mlClient");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/silent_alarm";

// Deterministic normal distribution generator
function gaussianRandom(mean, std) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * std;
}

async function seedData() {
  console.log("=================================================");
  console.log("🌱 Starting Silent Alarm Full Demo Data Seeding...");
  console.log("=================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("password123", salt);

  // 1. Define Accounts
  const usersToCreate = [
    { username: "dr_smith", email: "dr_smith@campus.edu", role: "counselor" },
    { username: "admin_clara", email: "admin_clara@campus.edu", role: "admin" },
    { username: "alice", email: "alice@campus.edu", role: "student" },
    { username: "bob", email: "bob@campus.edu", role: "student" },
    { username: "charlie", email: "charlie@campus.edu", role: "student" },
    { username: "diana", email: "diana@campus.edu", role: "student" },
    { username: "ethan", email: "ethan@campus.edu", role: "student" },
    { username: "fiona", email: "fiona@campus.edu", role: "student" },
    { username: "student_distressed", email: "distressed@campus.edu", role: "student" }
  ];

  const userDocs = {};

  for (const u of usersToCreate) {
    let doc = await User.findOne({ username: u.username });
    if (!doc) {
      doc = new User({
        username: u.username,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: u.role,
        optedIntoWellnessMonitoring: true,
        baselineProfile: {
          meanDwellTime: 120,
          stdDwellTime: 15,
          meanFlightTime: 150,
          stdFlightTime: 20,
          meanWPM: 60,
          stdWPM: 8,
          meanBackspaceRate: 0.05,
          sampleCount: 70
        }
      });
      await doc.save();
      console.log(`Created account: ${u.username} (${u.role})`);
    } else {
      doc.optedIntoWellnessMonitoring = true;
      await doc.save();
      console.log(`Updated account: ${u.username} (${u.role})`);
    }
    userDocs[u.username] = doc;
  }

  // 2. Clear old demo events & alerts for clean state
  const allUserIds = Object.values(userDocs).map((u) => u._id);
  await TypingEvent.deleteMany({ userId: { $in: allUserIds } });
  await WellnessAlert.deleteMany({ userId: { $in: allUserIds } });
  console.log("Purged previous typing events & alerts for seed users.");

  // 3. Seed Normal Students (alice, bob, charlie, diana, ethan, fiona)
  const normalStudents = ["alice", "bob", "charlie", "diana", "ethan", "fiona"];

  for (const sName of normalStudents) {
    const sUser = userDocs[sName];
    const eventCount = 70; // Guaranteed >50 vectors for baseline stability
    const vectors = [];

    const now = Date.now();
    const daysOffset = 25 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < eventCount; i++) {
      const timestamp = new Date(now - daysOffset + i * ((24 * 24 * 60 * 60 * 1000) / eventCount));
      const dwell = Math.round(gaussianRandom(118, 12));
      const flight = Math.round(gaussianRandom(145, 15));
      const wpm = Math.round(gaussianRandom(62, 6));
      const backspace = Math.max(0.01, Math.min(0.12, gaussianRandom(0.04, 0.015)));
      const pauses = Math.max(0, Math.round(gaussianRandom(1.5, 0.8)));
      const pauseDuration = pauses * Math.round(gaussianRandom(350, 100));

      const features = {
        avgDwellTime: dwell,
        avgFlightTime: flight,
        wpm: wpm,
        wpmVariance: Math.round(gaussianRandom(12, 3)),
        backspaceRate: Math.round(backspace * 100) / 100,
        pauseCount: pauses,
        pauseDurationTotal: pauseDuration,
        burstTypingScore: 0.15,
        messageAbandoned: false
      };

      const event = new TypingEvent({
        userId: sUser._id,
        roomId: "general",
        timestamp,
        features,
        distressScore: Math.round(gaussianRandom(0.12, 0.05) * 100) / 100,
        contributingFactors: []
      });

      await event.save();
      vectors.push(features);
    }

    console.log(`Seeded ${eventCount} stable historical events for ${sName}.`);

    // Calibrate Python ML baseline
    try {
      await mlClient.calibrateBaseline(sUser._id.toString(), vectors);
      console.log(`[ML Calibrated] Baseline established in Python ML microservice for ${sName}.`);
    } catch (err) {
      console.warn(`[ML Calibration notice for ${sName}]: ${err.message}`);
    }
  }

  // 4. Seed "student_distressed" with escalating distress trajectory
  const distressedUser = userDocs["student_distressed"];
  const distressedVectors = [];
  const now = Date.now();

  // Phase A: 50 stable vectors first (so baseline is calibrated)
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now - (15 * 24 * 60 * 60 * 1000) + (i * 5 * 60 * 60 * 1000));
    const features = {
      avgDwellTime: Math.round(gaussianRandom(115, 10)),
      avgFlightTime: Math.round(gaussianRandom(140, 12)),
      wpm: Math.round(gaussianRandom(65, 5)),
      wpmVariance: 12,
      backspaceRate: 0.04,
      pauseCount: 1,
      pauseDurationTotal: 400,
      burstTypingScore: 0.12,
      messageAbandoned: false
    };

    const ev = new TypingEvent({
      userId: distressedUser._id,
      roomId: "general",
      timestamp,
      features,
      distressScore: 0.1,
      contributingFactors: []
    });

    await ev.save();
    distressedVectors.push(features);
  }

  // Calibrate baseline for student_distressed on normal typing
  try {
    await mlClient.calibrateBaseline(distressedUser._id.toString(), distressedVectors);
    console.log(`[ML Calibrated] Baseline established for student_distressed.`);
  } catch (err) {
    console.warn(`[ML Calibration notice for student_distressed]: ${err.message}`);
  }

  // Phase B: 25 escalating distressed vectors over recent hours
  const escalationSteps = [
    { dwell: 140, flight: 180, wpm: 52, bksp: 0.08, pauses: 3, pauseDur: 1200, score: 0.35, abandon: false, factors: ["typing_speed_dropped_20%"] },
    { dwell: 165, flight: 210, wpm: 46, bksp: 0.14, pauses: 4, pauseDur: 2200, score: 0.52, abandon: false, factors: ["typing_speed_dropped_30%", "pause_duration_extended_2x"] },
    { dwell: 190, flight: 260, wpm: 38, bksp: 0.22, pauses: 5, pauseDur: 3800, score: 0.68, abandon: false, factors: ["backspace_rate_3x_baseline", "pause_duration_extended_3x"] },
    { dwell: 230, flight: 310, wpm: 32, bksp: 0.28, pauses: 6, pauseDur: 5100, score: 0.74, abandon: true, factors: ["backspace_rate_4x_baseline", "typing_speed_dropped_50%", "abandoned_message"] },
    { dwell: 270, flight: 360, wpm: 26, bksp: 0.35, pauses: 8, pauseDur: 6800, score: 0.84, abandon: true, factors: ["backspace_rate_5x_baseline", "pause_count_8", "sustained_rhythm_collapse"] },
    { dwell: 320, flight: 420, wpm: 21, bksp: 0.42, pauses: 9, pauseDur: 8500, score: 0.94, abandon: true, factors: ["backspace_rate_6x_baseline", "typing_speed_dropped_65%", "severe_pause_hesitation"] }
  ];

  for (let j = 0; j < 25; j++) {
    const stepIdx = Math.min(Math.floor(j / 4), escalationSteps.length - 1);
    const step = escalationSteps[stepIdx];
    const timestamp = new Date(now - (25 - j) * (20 * 60 * 1000)); // Recent session

    const features = {
      avgDwellTime: step.dwell + Math.round(gaussianRandom(0, 8)),
      avgFlightTime: step.flight + Math.round(gaussianRandom(0, 10)),
      wpm: Math.max(15, step.wpm + Math.round(gaussianRandom(0, 3))),
      wpmVariance: 28,
      backspaceRate: step.bksp,
      pauseCount: step.pauses,
      pauseDurationTotal: step.pauseDur,
      burstTypingScore: 0.45,
      messageAbandoned: step.abandon
    };

    const ev = new TypingEvent({
      userId: distressedUser._id,
      roomId: "general",
      timestamp,
      features,
      distressScore: step.score,
      contributingFactors: step.factors
    });

    await ev.save();
  }
  console.log(`Seeded 25 escalating distress events for student_distressed.`);

  // 5. Seed WellnessAlerts for student_distressed satisfying the DUAL-THRESHOLD REQUIREMENT:
  // (1) 3+ Unresolved High-Severity Alerts
  // (2) 2+ Dismissed Prior Nudges
  const alertTimes = [
    { offset: 48 * 60 * 60 * 1000, severity: "high", action: "dismissed_by_user", resolved: true }, // Dismissed #1
    { offset: 24 * 60 * 60 * 1000, severity: "high", action: "dismissed_by_user", resolved: true }, // Dismissed #2
    { offset: 8 * 60 * 60 * 1000, severity: "high", action: "self_nudge_sent", resolved: false },   // Unresolved High #1
    { offset: 3 * 60 * 60 * 1000, severity: "high", action: "self_nudge_sent", resolved: false },   // Unresolved High #2
    { offset: 45 * 60 * 1000, severity: "high", action: "self_nudge_sent", resolved: false }       // Unresolved High #3
  ];

  for (const at of alertTimes) {
    const alertDoc = new WellnessAlert({
      userId: distressedUser._id,
      triggeredAt: new Date(now - at.offset),
      severity: at.severity,
      actionTaken: at.action,
      resolvedAt: at.resolved ? new Date(now - at.offset + 5 * 60 * 1000) : null
    });
    await alertDoc.save();
  }
  console.log(`Created 5 alerts for student_distressed (satisfies Dual-Threshold Escalation Exception).`);

  // 6. Seed Cohort-Level Alerts for other students across the last 30 days
  // (To populate the Counselor Hub's aggregate trend chart with realistic variance)
  const cohortAlerts = [
    { user: userDocs["alice"], daysAgo: 18, severity: "low", action: "dismissed_by_user" },
    { user: userDocs["alice"], daysAgo: 9, severity: "medium", action: "resource_viewed" },
    { user: userDocs["bob"], daysAgo: 22, severity: "low", action: "dismissed_by_user" },
    { user: userDocs["bob"], daysAgo: 14, severity: "medium", action: "dismissed_by_user" },
    { user: userDocs["charlie"], daysAgo: 15, severity: "high", action: "resource_viewed" },
    { user: userDocs["charlie"], daysAgo: 7, severity: "low", action: "dismissed_by_user" },
    { user: userDocs["diana"], daysAgo: 11, severity: "medium", action: "self_nudge_sent" },
    { user: userDocs["ethan"], daysAgo: 5, severity: "low", action: "resource_viewed" },
    { user: userDocs["fiona"], daysAgo: 3, severity: "medium", action: "dismissed_by_user" },
    { user: userDocs["fiona"], daysAgo: 1, severity: "low", action: "self_nudge_sent" }
  ];

  for (const ca of cohortAlerts) {
    const alert = new WellnessAlert({
      userId: ca.user._id,
      triggeredAt: new Date(now - ca.daysAgo * 24 * 60 * 60 * 1000),
      severity: ca.severity,
      actionTaken: ca.action,
      resolvedAt: ca.action === "self_nudge_sent" ? null : new Date(now - ca.daysAgo * 24 * 60 * 60 * 1000 + 3600000)
    });
    await alert.save();
  }
  console.log(`Created 10 cohort-level alerts for aggregate trend visualization.`);

  console.log("=================================================");
  console.log("✅ Seed Completed Successfully!");
  console.log("Accounts ready:");
  console.log("  - Counselor:   dr_smith (dr_smith@campus.edu / password123)");
  console.log("  - Admin:       admin_clara (admin_clara@campus.edu / password123)");
  console.log("  - Student:     alice (alice@campus.edu / password123)");
  console.log("  - Escalation:  student_distressed (distressed@campus.edu / password123)");
  console.log("=================================================");

  await mongoose.disconnect();
}

seedData().catch((err) => {
  console.error("Seed Data Error:", err);
  process.exit(1);
});
