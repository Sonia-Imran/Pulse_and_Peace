const express = require("express");
const router = express.Router();
const { getMessages, sendMessage, editMessage, endConsultation } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/:bookingId/messages", getMessages);
router.post("/:bookingId/messages", sendMessage);
router.put("/messages/:messageId", editMessage);
router.put("/:bookingId/end", endConsultation);

module.exports = router;