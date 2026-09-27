require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const TypingEvent = require("./src/models/TypingEvent");
const WellnessAlert = require("./src/models/WellnessAlert");

async function testSchemas() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/silent_alarm");
    console.log("Connected to MongoDB for schema verification.");

    // Ensure indexes are built
    await TypingEvent.init();
    await User.init();

    // 1. Check TTL index
    const indexes = await TypingEvent.collection.indexes();
    console.log("TypingEvent indexes:", JSON.stringify(indexes, null, 2));

    const ttlIndex = indexes.find(idx => idx.expireAfterSeconds !== undefined);
    if (!ttlIndex) {
      throw new Error("FAIL: TTL index not found on TypingEvent!");
    }
    console.log(`SUCCESS: Found TTL index on field(s) ${JSON.stringify(ttlIndex.key)} with expireAfterSeconds: ${ttlIndex.expireAfterSeconds}`);

    // 2. Test User creation
    const testUsername = "test_verify_" + Date.now();
    const testUser = await User.create({
      username: testUsername,
      email: `${testUsername}@example.com`,
      passwordHash: "fake_hash_12345",
      role: "student",
      optedIntoWellnessMonitoring: false
    });
    console.log("SUCCESS: Created User:", testUser.username, "Role:", testUser.role, "Baseline:", testUser.baselineProfile);

    // 3. Test TypingEvent creation
    const testEvent = await TypingEvent.create({
      userId: testUser._id,
      roomId: "general",
      features: {
        avgDwellTime: 120,
        avgFlightTime: 95,
        wpm: 68,
        wpmVariance: 4.2,
        backspaceRate: 0.05,
        pauseCount: 2,
        pauseDurationTotal: 1500,
        burstTypingScore: 82,
        messageAbandoned: false
      },
      distressScore: 0.12,
      contributingFactors: ["rapid_bursts"]
    });
    console.log("SUCCESS: Created TypingEvent:", testEvent._id, "timestamp:", testEvent.timestamp);

    // 4. Test WellnessAlert creation
    const testAlert = await WellnessAlert.create({
      userId: testUser._id,
      severity: "low",
      actionTaken: "self_nudge_sent"
    });
    console.log("SUCCESS: Created WellnessAlert:", testAlert._id, "severity:", testAlert.severity);

    // Clean up test records
    await TypingEvent.deleteOne({ _id: testEvent._id });
    await WellnessAlert.deleteOne({ _id: testAlert._id });
    await User.deleteOne({ _id: testUser._id });
    console.log("SUCCESS: Cleanup completed. All schemas & TTL indexes verified!");

    process.exit(0);
  } catch (err) {
    console.error("Schema test failed:", err);
    process.exit(1);
  }
}

testSchemas();
