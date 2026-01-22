const mongoose = require("mongoose");

const certificateQueueSchema = mongoose.Schema(
    {
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Registration"
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Event"
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false // Might be guest registration
        },
        userName: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },
        attempts: {
            type: Number,
            default: 0,
        },
        error: {
            type: String,
        },
        // generatedPdfPath removed as per request
    },
    {
        timestamps: true,
    }
);

// Index for faster querying
certificateQueueSchema.index({ status: 1, createdAt: 1 });
certificateQueueSchema.index({ eventId: 1, userEmail: 1 }); // Prevent duplicate jobs if needed

module.exports = mongoose.model("CertificateQueue", certificateQueueSchema);
