const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    providerName: { type: String, required: true },
    serviceName: { type: String, required: true },
    category: { type: String, enum: ["Therapy", "Cardiology", "Nutrition", "General"], default: "General" },
    baseFee: { type: Number, required: true },
    duration: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);