const express = require('express')
const router = express.Router()
const { createBooking, deleteBooking } = require('../controllers/bookingController')
const { protect, authorizeRoles } = require('../middleware/auth')

router.post('/',     protect, authorizeRoles('patient'), createBooking)
router.delete('/:id', protect, authorizeRoles('patient'), deleteBooking)

module.exports = router