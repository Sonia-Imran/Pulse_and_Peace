const express = require("express");
const router = express.Router();
const { addReview, getDoctorReviews } = require("../controllers/reviewController");
const { protect, authorizeRoles } = require("../middleware/auth");

router.get("/doctor/:doctorId", getDoctorReviews);
router.post("/", protect, authorizeRoles("patient"), addReview);

module.exports = router;