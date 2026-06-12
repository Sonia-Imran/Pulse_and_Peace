const User = require("../models/User");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, bloodGroup, age, gender, dob, city } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, bloodGroup, age, gender, dob, city },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfilePic = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic },
      { new: true }
    ).select("-password");
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const bookings = await Booking.find({ patient: req.user._id })
      .populate("doctor", "fullName specialty")
      .sort({ createdAt: -1 });
    const payments = await Payment.find({ patient: req.user._id });
    const result = bookings.map((b) => {
      const pay = payments.find((p) => String(p.booking) === String(b._id));
      return {
        id: b._id,
        type: b.type,
        consultType: b.consultType,
        doctorName: b.doctor?.fullName || b.doctorName || "",
        date: b.date,
        time: b.time,
        reason: b.reason,
        fee: b.fee,
        status: b.status,
        paymentStatus: pay?.status === "paid" ? "paid" : b.paymentStatus || "unpaid",
        notifRead: b.notifRead,
      };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      patient: req.user._id,
    }).populate("doctor", "fullName specialty");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    const pay = await Payment.findOne({ booking: booking._id });
    res.json({
      success: true,
      data: {
        id: booking._id,
        type: booking.type,
        consultType: booking.consultType,
        doctorName: booking.doctor?.fullName || booking.doctorName || "",
        date: booking.date,
        time: booking.time,
        reason: booking.reason,
        fee: booking.fee,
        status: booking.status,
        paymentStatus: pay?.status === "paid" ? "paid" : booking.paymentStatus || "unpaid",
        notifRead: booking.notifRead,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProfile, updateProfile, updateProfilePic, getMyAppointments, getAppointmentById };