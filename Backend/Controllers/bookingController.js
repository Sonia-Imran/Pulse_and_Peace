const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const createBooking = async (req, res) => {
  try {
    const { doctorId, serviceId, type, consultType, date, time, reason, fee } = req.body
    const patient = req.user

    let doctor = null
    if (doctorId) {
      doctor = await User.findById(doctorId.toString())
    }

    const booking = await Booking.create({
      patient:       patient._id,
      patientName:   patient.fullName,
      doctor:        doctor ? doctor._id : null,
      doctorName:    doctor ? doctor.fullName : '',
      service:       serviceId || null,
      type:          type || 'Consultation',
      consultType:   consultType || 'doctor',
      date:          date || '',
      time:          time || '',
      reason:        reason || '',
      fee:           Number(fee) || 0,
      phone:         patient.phone || '',
      status:        'pending',
      paymentStatus: 'unpaid',
    })

    if (doctor) {
      await Notification.create({
        recipient: doctor._id,
        title:     'New Appointment Request',
        message:   `${patient.fullName} requested ${type} on ${date}`,
        type:      'appointment',
        relatedId: String(booking._id),
      })
    }

    await Notification.create({
      recipient: patient._id,
      title:     'Booking Submitted',
      message:   `Your ${type} appointment request has been sent.`,
      type:      'appointment',
      relatedId: String(booking._id),
    })

    sendEmail({
      to:      patient.email,
      subject: 'Appointment Request Received',
      html:    `<h3>Hi ${patient.fullName},</h3><p>Your appointment for <b>${type}</b> on <b>${date} at ${time}</b> has been submitted.</p>`,
    }).catch(err => console.log('Email error (non-critical):', err.message))

    res.status(201).json({ success: true, data: booking })
  } catch (err) {
    console.error('Booking error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteBooking = async (req, res) => {
  try {
    await Booking.findOneAndDelete({ _id: req.params.id, patient: req.user._id });
    res.json({ success: true, message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createBooking, deleteBooking };