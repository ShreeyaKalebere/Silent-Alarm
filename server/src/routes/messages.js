const express = require("express");
const Message = require("../models/Message");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET /api/messages/:roomId - fetch history
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(limit);

    res.json({ messages });
  } catch (error) {
    console.error("Fetch Messages Error:", error);
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
});

module.exports = router;
