const CertificateQueue = require("../models/CertificateQueue");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");

// @desc    Generate and Send Certificates for an Event
// @route   POST /api/certificates/send/:eventId
// @access  Admin
const sendCertificates = async (req, res) => {
    try {
        const { eventId } = req.params;

        // 1. Get Event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // 2. Get Attended Registrations
        const attendees = await Registration.find({
            eventId: eventId,
            $or: [{ status: "attended" }, { isAttended: true }]
        });

        if (attendees.length === 0) {
            return res.status(400).json({ message: "No attended registrations found for this event." });
        }

        console.log(`Queueing certificates for ${attendees.length} attendees...`);

        // 3. Batch Insert into Queue with User Lookup
        const queueDocs = await Promise.all(attendees.map(async (attendee) => {
            let finalUserId = attendee.userId;

            // If userId is missing in registration, try to find user by email
            if (!finalUserId) {
                const user = await User.findOne({ email: attendee.userEmail });
                if (user) {
                    finalUserId = user._id;
                }
            }

            return {
                registrationId: attendee._id,
                eventId: event._id,
                userId: finalUserId, // Now populated if user exists
                userName: attendee.userName,
                userEmail: attendee.userEmail,
                status: "pending"
            };
        }));

        // Use insertMany for performance
        await CertificateQueue.insertMany(queueDocs, { ordered: false });

        res.status(200).json({
            message: `Queued ${attendees.length} certificates for processing.`,
            recipientCount: attendees.length
        });

    } catch (error) {
        console.error("Certificate Controller Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { sendCertificates };
