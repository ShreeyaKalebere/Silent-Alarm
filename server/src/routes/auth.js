const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "silent_alarm_jwt_super_secret_key_2026_change_in_prod",
    { expiresIn: "7d" }
  );
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, optedIntoWellnessMonitoring } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedUsername = username.trim();

    // Check existing
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: trimmedUsername }]
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      return res.status(409).json({ message: "Username is already taken" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Validate role if passed
    const allowedRoles = ["student", "counselor", "admin"];
    const userRole = allowedRoles.includes(role) ? role : "student";

    const newUser = new User({
      username: trimmedUsername,
      email: normalizedEmail,
      passwordHash,
      role: userRole,
      optedIntoWellnessMonitoring: Boolean(optedIntoWellnessMonitoring),
      baselineProfile: {
        meanDwellTime: 0,
        stdDwellTime: 0,
        meanFlightTime: 0,
        stdFlightTime: 0,
        meanWPM: 0,
        stdWPM: 0,
        meanBackspaceRate: 0,
        sampleCount: 0
      }
    });

    await newUser.save();

    const token = generateToken(newUser._id);
    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    res.status(201).json({
      message: "Registration successful",
      token,
      user: userObj
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error during registration", error: error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    const cleanIdentifier = identifier.trim();

    // Find user by email (case-insensitive) or username
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { username: cleanIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email/username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email/username or password" });
    }

    const token = generateToken(user._id);
    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.json({
      message: "Login successful",
      token,
      user: userObj
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error during login", error: error.message });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/wellness-consent
router.put("/wellness-consent", authMiddleware, async (req, res) => {
  try {
    const { optedIntoWellnessMonitoring } = req.body;
    if (optedIntoWellnessMonitoring === undefined) {
      return res.status(400).json({ message: "optedIntoWellnessMonitoring boolean is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { optedIntoWellnessMonitoring: Boolean(optedIntoWellnessMonitoring) },
      { new: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Wellness monitoring consent updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update Wellness Consent Error:", error);
    res.status(500).json({ message: "Failed to update wellness consent", error: error.message });
  }
});

// GET /api/auth/users (to list available users to message)
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("_id username email role optedIntoWellnessMonitoring createdAt")
      .sort({ username: 1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

module.exports = router;
