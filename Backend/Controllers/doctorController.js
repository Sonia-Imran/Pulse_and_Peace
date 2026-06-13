const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");

const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id).select("-password");
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        ...doctor?.toObject(),
        userId: String(req.user._id),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const { fullName, specialty, phone, education, description, avatarUrl } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fullName, phone });
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { fullName, specialty, phone, education, description, avatarUrl },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });
    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();
    res.json({ success: true, data: { isAvailable: doctor.isAvailable } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDoctorStats = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA");
    const allBookings = await Booking.find({ doctor: req.user._id });
    const payments = await Payment.find({ doctor: req.user._id, status: "paid" });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({
      success: true,
      data: {
        todayAppointments: allBookings.filter(b => b.date === today).length,
        totalPatients: new Set(allBookings.map(b => String(b.patient))).size,
        pendingRequests: allBookings.filter(b => b.status === "pending").length,
        completedToday: allBookings.filter(b => b.status === "completed" && b.date === today).length,
        totalEarnings: totalRevenue,
        doctorShare: Math.round(totalRevenue * 0.9),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const bookings = await Booking.find({ doctor: req.user._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ doctor: req.user._id });

    const result = bookings.map(b => {
      const pay = payments.find(p => String(p.booking) === String(b._id));
      return {
        id: String(b._id),
        patient: b.patientName || "Patient",
        patientId: String(b.patient),
        phone: b.phone || "N/A",
        type: b.type,
        consultType: b.consultType,
        date: b.date,
        time: b.time,
        reason: b.reason,
        fee: b.fee,
        status: b.status,
        paymentStatus: pay?.status === "paid" ? "paid" : b.paymentStatus || "unpaid",
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id },
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: "Appointment not found" });

    const { io } = require("../server");
    io.emit("appointment_updated", {
      bookingId: String(booking._id),
      status,
      patientId: String(booking.patient),
    });

    await Notification.create({
      recipient: booking.patient,
      title: `Appointment ${status}`,
      message: `Your ${booking.type} appointment has been ${status} by the doctor.`,
      type: "appointment",
      relatedId: String(booking._id),
    });

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDoctorPatients = async (req, res) => {
  try {
    const bookings = await Booking.find({ doctor: req.user._id });
    const seen = new Set();
    const result = [];
    for (const b of bookings) {
      const key = String(b.patient);
      if (seen.has(key)) continue;
      seen.add(key);
      const patientUser = await User.findById(b.patient).select("-password");
      const patientBookings = bookings.filter(x => String(x.patient) === key);
      const sorted = [...patientBookings].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      result.push({
        id: b.patient,
        name: patientUser?.fullName || b.patientName,
        phone: patientUser?.phone || b.phone || "N/A",
        age: patientUser?.age || b.age || "—",
        gender: patientUser?.gender || b.gender || "—",
        bloodGroup: patientUser?.bloodGroup || "—",
        city: patientUser?.city || "—",
        totalVisits: patientBookings.length,
        lastVisit: sorted[0]?.date || "N/A",
      });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDoctorEarnings = async (req, res) => {
  try {
    const payments = await Payment.find({ doctor: req.user._id, status: "paid" }).populate("booking");
    const result = payments.map(p => ({
      id: p._id,
      patient: p.booking?.patientName || "Patient",
      service: p.booking?.type || "Consultation",
      date: p.booking?.date || "N/A",
      fee: p.amount,
      doctorShare: p.doctorShare,
      adminShare: p.adminCut,
      status: p.status,
    }));
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({
      success: true,
      data: result,
      stats: {
        totalRevenue,
        doctorShare: Math.round(totalRevenue * 0.9),
        adminShare: Math.round(totalRevenue * 0.1),
        totalPaid: payments.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor", status: "active" }).select("-password");
    const result = await Promise.all(
      doctors.map(async d => {
        const profile = await Doctor.findOne({ user: d._id });
        const reviews = await Review.find({ doctor: d._id });
        const avgRating = reviews.length
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : profile?.rating || 0;
        return {
          _id: d._id,
          fullName: d.fullName,
          email: d.email,
          phone: d.phone,
          specialty: profile?.specialty || "General Physician",
          education: profile?.education || "",
          description: profile?.description || "",
          avatarUrl: profile?.avatarUrl || "",
          rating: avgRating,
          role: "doctor",
        };
      })
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDoctorProfile, updateDoctorProfile, toggleAvailability,
  getDoctorStats, getDoctorAppointments, updateAppointmentStatus,
  getDoctorPatients, getDoctorEarnings, getAllDoctors,
};