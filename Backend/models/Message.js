const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["doctor", "patient", "system"], required: true },
    text: { type: String, default: "" },
    image: { type: String, default: "" },
    prescription: { type: Object, default: null },
    isEdited: { type: Boolean, default: false },
    time: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);