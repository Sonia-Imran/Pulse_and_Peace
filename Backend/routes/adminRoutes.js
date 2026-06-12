const express = require("express");
const router = express.Router();
const {
  addDoctor, getAllUsers, deleteUser, toggleUserStatus,
  getAllServices, updateServiceStatus,
  getAllAppointments, deleteAppointment,
  getAllPayments, getDashboardStats,
  getAllDoctorStats, getAllPatientStats,
} = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/auth");


router.get('/services',           protect, authorizeRoles('admin'), getAllServices)
router.put('/services/:id/status', protect, authorizeRoles('admin'), updateServiceStatus)
router.use(protect, authorizeRoles("admin"));
router.get("/stats", getDashboardStats);
router.post("/doctors", addDoctor);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/toggle-status", toggleUserStatus);
router.get("/services", getAllServices);
router.put("/services/:id/status", updateServiceStatus);
router.get("/appointments", getAllAppointments);
router.delete("/appointments/:id", deleteAppointment);
router.get("/payments", getAllPayments);
router.get("/doctors/stats", getAllDoctorStats);
router.get("/patients/stats", getAllPatientStats);

module.exports = router;