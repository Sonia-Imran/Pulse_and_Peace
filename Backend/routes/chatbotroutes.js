const express = require("express");
const router = express.Router();
const { chatWithAI, getChatUsage } = require("../controllers/chatbotController");
const { protect } = require("../middleware/auth");

router.post("/", protect, chatWithAI);
router.get("/usage", protect, getChatUsage);

module.exports = router;