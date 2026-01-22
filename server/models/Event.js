const mongoose = require("mongoose");

const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String, // Short description for cards
      required: true,
    },
    fullDescription: {
      type: String, // Long description for detail page
    },
    venue: {
      type: String,
      required: true,
    },

    // Google Maps Link Field
    mapUrl: {
      type: String,
    },

    resourceLinks: {
      type: [String], // Array of asset/resource links
      default: [],
    },

    dateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "past", "cancelled"],
      default: "upcoming",
    },
    maxAttendees: {
      type: Number,
      default: 100,
    },

    // --- Images ---
    imageUrl: {
      type: String, // Stores Full Cloudinary URL (Cover Photo)
    },

    // ✅ NEW: External Album Link (Google Photos / Drive / etc.)
    memoriesUrl: {
      type: String,
      default: "",
    },

    // --- Registration Logic ---
    isRegistrationEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;