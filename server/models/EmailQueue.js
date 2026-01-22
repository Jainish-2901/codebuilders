const mongoose = require("mongoose");

const emailQueueSchema = mongoose.Schema(
    {
        to: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: false, // Generated dynamically if missing
        },
        type: {
            type: String, // 'REGISTRATION', 'NEW_EVENT', 'SIMPLE'
            default: 'SIMPLE'
        },
        data: {
            type: mongoose.Schema.Types.Mixed, // flexible data storage
        },
        // html and attachments removed to save DB space
        // We now generate email content dynamically based on 'type' and 'data'
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
    },
    {
        timestamps: true,
    }
);

// Index for faster querying of pending jobs
emailQueueSchema.index({ status: 1, createdAt: 1 });

const EmailQueue = mongoose.model("EmailQueue", emailQueueSchema);

module.exports = EmailQueue;
