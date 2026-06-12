const express = require('express')
const router  = express.Router()
const {
  getDoctorProfile, updateDoctorProfile, toggleAvailability,
  getDoctorStats, getDoctorAppointments, updateAppointmentStatus,
  getDoctorPatients, getDoctorEarnings, getAllDoctors,
} = require('../controllers/doctorController')
const { protect, authorizeRoles } = require('../middleware/auth')

router.get('/all', getAllDoctors)

router.use(protect, authorizeRoles('doctor'))
router.get('/profile',                   getDoctorProfile)
router.put('/profile',                   updateDoctorProfile)
router.put('/availability',              toggleAvailability)
router.get('/stats',                     getDoctorStats)
router.get('/appointments',              getDoctorAppointments)
router.put('/appointments/:id/status',   updateAppointmentStatus)
router.get('/patients',                  getDoctorPatients)
router.get('/earnings',                  getDoctorEarnings)

module.exports = router