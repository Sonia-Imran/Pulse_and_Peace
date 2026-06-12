const express = require('express')
const router  = express.Router()
const {
  addService, getDoctorServices, updateService,
  deleteService, getApprovedServices,
} = require('../controllers/serviceController')
const { protect, authorizeRoles } = require('../middleware/auth')

router.get('/approved', getApprovedServices)

router.post('/',      protect, authorizeRoles('doctor'), addService)
router.get('/my',     protect, authorizeRoles('doctor'), getDoctorServices)
router.put('/:id',    protect, authorizeRoles('doctor'), updateService)
router.delete('/:id', protect, authorizeRoles('doctor'), deleteService)

module.exports = router