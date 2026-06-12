const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const addDoctor = async (req, res) => {
  try {
    const { fullName, email, phone, password, specialty, education, description, rating } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "fullName, email and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered" });

    const user = await User.create({ fullName, email, phone: phone || "", password, role: "doctor" });

    await Doctor.create({
      user: user._id,
      fullName,
      email,
      specialty: specialty || "General Physician",
      phone: phone || "",
      education: education || "",
      description: description || "",
      rating: rating || 0,
      isApproved: true,
    });

    try {
      await sendEmail({
        to: email,
        subject: "Doctor Account Created - Pulse & Peace",
        html: `<h3>Welcome Dr. ${fullName},</h3><p>Your doctor account has been created by the admin.</p>`,
      });
    } catch {}

    res.status(201).json({ success: true, message: `Dr. ${fullName} added successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password").sort({ createdAt: -1 });
    const result = await Promise.all(
      users.map(async (u) => {
        if (u.role === "doctor") {
          const profile = await Doctor.findOne({ user: u._id });
          return { ...u.toObject(), specialty: profile?.specialty || "" };
        }
        return u.toObject();
      })
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Doctor.findOneAndDelete({ user: req.params.id });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.status = user.status === "active" ? "blocked" : "active";
    await user.save();
    res.json({ success: true, data: { status: user.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const service = await Service.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });
    const doctor = await User.findById(service.doctor);
    if (doctor) {
      await Notification.create({
        recipient: doctor._id,
        title: `Service ${status}`,
        message: `Your service "${service.serviceName}" has been ${status.toLowerCase()} by admin.`,
        type: "service",
        relatedId: String(service._id),
      });
      try {
        await sendEmail({
          to: doctor.email,
          subject: `Your Service Has Been ${status}`,
          html: `<h3>Hi Dr. ${doctor.fullName},</h3><p>Your service <b>${service.serviceName}</b> has been <b>${status.toLowerCase()}</b> by the admin.</p>`,
        });
      } catch {}
    }
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    const payments = await Payment.find();
    const result = bookings.map((b) => {
      const pay = payments.find((p) => String(p.booking) === String(b._id));
      return {
        id: b._id,
        patientName: b.patientName,
        doctorName: b.doctorName,
        type: b.type,
        date: b.date,
        time: b.time,
        fee: b.fee,
        status: b.status,
        paymentStatus: pay?.status === "paid" ? "paid" : b.paymentStatus,
      };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    await Payment.findOneAndDelete({ booking: req.params.id });
    res.json({ success: true, message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("booking").sort({ createdAt: -1 });
    const result = payments.map((p) => ({
      key: p._id,
      txId: `TXN-${String(p._id).slice(-6).toUpperCase()}`,
      source: p.booking?.type || "Consultation",
      sender: p.booking?.patientName || "Patient",
      receiver: p.booking?.doctorName || "Doctor",
      amount: p.amount,
      adminCut: p.adminCut,
      doctorShare: p.doctorShare,
      status: p.status === "paid" ? "Settled" : "Pending",
      aptId: p.booking?._id,
    }));
    const grossVolume = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    res.json({
      success: true,
      data: result,
      stats: {
        grossVolume,
        platformCommission: Math.round(grossVolume * 0.1),
        doctorPayouts: Math.round(grossVolume * 0.9),
        pendingEscrow: payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const allUsers = await User.find({ role: { $ne: "admin" } });
    const appointments = await Booking.find();
    const payments = await Payment.find({ status: "paid" });
    const totalProfit = payments.reduce((s, p) => s + (p.adminCut || 0), 0);
    res.json({
      success: true,
      data: {
        totalProfit,
        doctors: allUsers.filter((u) => u.role === "doctor").length,
        patients: allUsers.filter((u) => u.role === "patient").length,
        appointments: appointments.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllDoctorStats = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    const result = await Promise.all(
      doctors.map(async (d) => {
        const profile = await Doctor.findOne({ user: d._id });
        const reviews = await Review.find({ doctor: d._id });
        const bookings = await Booking.find({ doctor: d._id });
        const avgRating = reviews.length
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : profile?.rating || 0;
        return {
          key: d._id,
          name: d.fullName,
          email: d.email,
          specialty: profile?.specialty || "General Physician",
          education: profile?.education || "N/A",
          phone: d.phone || "N/A",
          rating: avgRating,
          casesCount: bookings.length,
        };
      })
    );
    const ratedDoctors = result.filter((d) => d.rating > 0);
    const avgPlatformRating = ratedDoctors.length
      ? (ratedDoctors.reduce((s, d) => s + d.rating, 0) / ratedDoctors.length).toFixed(1)
      : "0.0";
    const totalConsultations = await Booking.countDocuments();
    res.json({
      success: true,
      data: result,
      stats: { totalDoctors: doctors.length, avgPlatformRating, totalConsultations },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllPatientStats = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password");
    const appointments = await Booking.find();
    const result = patients.map((p) => {
      const patientBookings = appointments.filter((a) => String(a.patient) === String(p._id));
      const doctorConsults = patientBookings.filter(
        (b) => b.status === "accepted" || b.status === "completed"
      );
      return {
        key: p._id,
        id: p._id,
        name: p.fullName,
        email: p.email,
        phone: p.phone || "N/A",
        age: p.age || "N/A",
        gender: p.gender || "N/A",
        status: p.status || "active",
        botChatCount: 0,
        botDurationMinutes: 0,
        lastBotChat: "N/A",
        doctorConsultCount: doctorConsults.length,
        lastDoctorConsult: patientBookings[patientBookings.length - 1]?.date || "Never",
        assignedDoctor: patientBookings.length > 0 ? `Dr. ${patientBookings[0].doctorName}` : "None",
        consultationHistory: doctorConsults.map((b) => ({
          date: b.date,
          doctor: `Dr. ${b.doctorName}`,
          type: b.type,
          duration: "N/A",
        })),
      };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  addDoctor,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  getAllServices,
  updateServiceStatus,
  getAllAppointments,
  deleteAppointment,
  getAllPayments,
  getDashboardStats,
  getAllDoctorStats,
  getAllPatientStats,
};