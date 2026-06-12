const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");

const addReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
  if (String(booking.patient) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  if (booking.status !== "completed") {
    return res.status(400).json({ success: false, message: "Can only review completed consultations" });
  }
  const exists = await Review.findOne({ booking: bookingId });
  if (exists) return res.status(400).json({ success: false, message: "Already reviewed" });
  const review = await Review.create({
    booking: bookingId,
    patient: req.user._id,
    doctor: booking.doctor,
    rating,
    comment,
  });
  const reviews = await Review.find({ doctor: booking.doctor });
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Doctor.findOneAndUpdate({ user: booking.doctor }, { rating: avgRating, totalReviews: reviews.length });
  res.status(201).json({ success: true, data: review });
};

const getDoctorReviews = async (req, res) => {
  const reviews = await Review.find({ doctor: req.params.doctorId }).populate("patient", "fullName");
  res.json({ success: true, data: reviews });
};

module.exports = { addReview, getDoctorReviews };