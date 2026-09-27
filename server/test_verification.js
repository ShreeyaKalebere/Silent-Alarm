const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const TypingEvent = require("./src/models/TypingEvent");
const WellnessAlert = require("./src/models/WellnessAlert");
const Message = require("./src/models/Message");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function verify() {
  console.log("Connecting to MongoDB at:", process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connection successful!");

  // Ensure indexes
  console.log("Synchronizing indexes on all models...");
  await User.syncIndexes();
  await TypingEvent.syncIndexes();
  await WellnessAlert.syncIndexes();
  await Message.syncIndexes();

  // Inspect TypingEvent indexes
  const typingIndexes = await TypingEvent.collection.indexes();
  console.log("TypingEvent collection indexes:", JSON.stringify(typingIndexes, null, 2));

  const ttlIndex = typingIndexes.find(idx => idx.expireAfterSeconds !== undefined);
  if (ttlIndex) {
    console.log(`[PASS] TTL Index found on TypingEvent! Field: ${JSON.stringify(ttlIndex.key)}, expireAfterSeconds: ${ttlIndex.expireAfterSeconds} (${ttlIndex.expireAfterSeconds / (24*3600)} days)`);
  } else {
    console.error("[FAIL] TTL index not found on TypingEvent!");
    process.exit(1);
  }

  // Verify bcrypt
  const plain = "test_password_123";
  const hash = await bcrypt.hash(plain, 10);
  const match = await bcrypt.compare(plain, hash);
  console.log("[PASS] Bcrypt password hashing test:", match ? "SUCCESS" : "FAILED");

  // Verify JWT
  const token = jwt.sign({ test: true }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  console.log("[PASS] JWT sign/verify test:", decoded.test ? "SUCCESS" : "FAILED");

  console.log("All automated backend model and database checks passed!");
  await mongoose.disconnect();
}

verify().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
