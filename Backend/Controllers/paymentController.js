const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

const processPayment = async (req, res) => {
  const { bookingId, method } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
  if (booking.status !== "accepted") {
    return res.status(400).json({ success: false, message: "Doctor has not approved this booking yet" });
  }
  const existing = await Payment.findOne({ booking: bookingId });
  if (existing && existing.status === "paid") {
    return res.status(400).json({ success: false, message: "Already paid" });
  }
  const adminCut = Math.round(booking.fee * 0.1);
  const doctorShare = Math.round(booking.fee * 0.9);
  const payment = await Payment.create({
    booking: bookingId,
    patient: booking.patient,
    doctor: booking.doctor,
    amount: booking.fee,
    adminCut,
    doctorShare,
    status: "paid",
    method: method || "simulated",
    paidAt: new Date(),
  });
  await Booking.findByIdAndUpdate(bookingId, { paymentStatus: "paid" });
  const patient = await User.findById(booking.patient);
  await Notification.create({
    recipient: booking.patient,
    title: "Payment Successful",
    message: `Payment of Rs. ${booking.fee} for ${booking.type} has been received. Your chat is now unlocked.`,
    type: "payment",
    relatedId: String(payment._id),
  });
  if (booking.doctor) {
    await Notification.create({
      recipient: booking.doctor,
      title: "Payment Received",
      message: `${booking.patientName} has completed payment for ${booking.type}. Chat is now active.`,
      type: "payment",
      relatedId: String(payment._id),
    });
  }
  if (patient) {
    await sendEmail({
      to: patient.email,
      subject: "Payment Confirmed - Consultation Unlocked",
      html: `<h3>Hi ${patient.fullName},</h3><p>Your payment of <b>Rs. ${booking.fee}</b> for <b>${booking.type}</b> has been confirmed. Your consultation chat is now unlocked!</p>`,
    });
  }
  res.json({ success: true, data: payment });
};

const getPatientPayments = async (req, res) => {
  const payments = await Payment.find({ patient: req.user._id }).populate("booking");
  res.json({ success: true, data: payments });
};

module.exports = { processPayment, getPatientPayments };