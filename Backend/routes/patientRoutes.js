const express = require('express')
const router = express.Router()
const {
  getProfile, updateProfile, updateProfilePic,
  getMyAppointments, getAppointmentById,
} = require('../controllers/patientController')
const { protect, authorizeRoles } = require('../middleware/auth')

router.use(protect, authorizeRoles('patient'))
router.get('/profile',          getProfile)
router.put('/profile',          updateProfile)
router.put('/profile/pic',      updateProfilePic)
router.get('/appointments',     getMyAppointments)
router.get('/appointments/:id', getAppointmentById)

module.exports = router