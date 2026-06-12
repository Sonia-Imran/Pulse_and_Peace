const Message = require("../models/Message");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

const getMessages = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
  const isPatient = String(booking.patient) === String(req.user._id);
  const isDoctor = String(booking.doctor) === String(req.user._id);
  if (!isPatient && !isDoctor && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  const messages = await Message.find({ booking: req.params.bookingId }).sort({ createdAt: 1 });
  res.json({ success: true, data: messages });
};

const sendMessage = async (req, res) => {
  const { text, image, prescription } = req.body;
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
  if (booking.status === "completed") {
    return res.status(400).json({ success: false, message: "Session is completed" });
  }
  const payment = await Payment.findOne({ booking: booking._id, status: "paid" });
  if (!payment) {
    return res.status(400).json({ success: false, message: "Payment not completed" });
  }
  const senderRole =
    String(booking.doctor) === String(req.user._id) ? "doctor" : "patient";
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const message = await Message.create({
    booking: booking._id,
    sender: req.user._id,
    senderRole,
    text: text || "",
    image: image || "",
    prescription: prescription || null,
    time,
  });
  res.status(201).json({ success: true, data: message });
};

const editMessage = async (req, res) => {
  const { text } = req.body;
  const message = await Message.findOneAndUpdate(
    { _id: req.params.messageId, sender: req.user._id },
    { text, isEdited: true },
    { new: true }
  );
  if (!message) return res.status(404).json({ success: false, message: "Message not found" });
  res.json({ success: true, data: message });
};

const endConsultation = async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId },
    { status: "completed" },
    { new: true }
  );
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
  await Message.create({
    booking: booking._id,
    sender: req.user._id,
    senderRole: "system",
    text: "This consultation session has been marked as completed.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
  res.json({ success: true, data: booking });
};

module.exports = { getMessages, sendMessage, editMessage, endConsultation };