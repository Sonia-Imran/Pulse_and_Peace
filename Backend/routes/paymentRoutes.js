const express = require("express");
const router = express.Router();
const { processPayment, getPatientPayments } = require("../controllers/paymentController");
const { protect, authorizeRoles } = require("../middleware/auth");

router.use(protect, authorizeRoles("patient"));
router.post("/pay", processPayment);
router.get("/my", getPatientPayments);

module.exports = router;