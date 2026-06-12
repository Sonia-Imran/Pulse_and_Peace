const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: { type: String, default: "" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctorName: { type: String, default: "" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    type: { type: String, required: true },
    consultType: { type: String, enum: ["doctor", "ai"], default: "doctor" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, default: "" },
    fee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    notifRead: { type: Boolean, default: false },
    age: { type: String, default: "" },
    phone: { type: String, default: "" },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
