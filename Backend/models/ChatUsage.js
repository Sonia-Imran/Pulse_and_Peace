const mongoose = require("mongoose");

const chatUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    count: { type: Number, default: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatUsage", chatUsageSchema);