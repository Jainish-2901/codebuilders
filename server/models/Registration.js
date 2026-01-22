const mongoose = require("mongoose");

const registrationSchema = mongoose.Schema(
  {

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Event",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },

    // Auto-generate unique Token ID for QR Codes
    tokenId: {
      type: String,
      unique: true, // Ensure it's unique
      default: () => Math.random().toString(36).substr(2, 9).toUpperCase()
    },

    // 👇 Added this because your controller uses it
    isAttended: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["registered", "attended", "cancelled"],
      default: "registered",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);