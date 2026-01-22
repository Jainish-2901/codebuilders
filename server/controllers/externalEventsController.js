const ExternalEvent = require("../models/ExternalEvent");

// @desc    Get all external events
// @route   GET /api/external-events
// @access  Public
const getExternalEvents = async (req, res) => {
  try {
    // Auto-update status based on time
    const now = new Date();
    await ExternalEvent.updateMany(
      { date: { $lt: now }, status: 'upcoming' },
      { $set: { status: 'past' } }
    );

    const { type, status } = req.query;
    let filter = {};

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    const events = await ExternalEvent.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single external event
// @route   GET /api/external-events/:id
// @access  Public
const getExternalEvent = async (req, res) => {
  try {
    const event = await ExternalEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "External event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create external event
// @route   POST /api/external-events
// @access  Private/Admin
const createExternalEvent = async (req, res) => {
  try {
    const event = await ExternalEvent.create(req.body);

    // 🚀 NEW: Queue "New Event" Email for ALL Users (if upcoming)
    // Assuming status is determined by date for external events usually, or we just send it.
    if (!req.body.status || req.body.status === 'upcoming') {
      try {
        const User = require("../models/User");
        const EmailQueue = require("../models/EmailQueue");
        const users = await User.find({}, "email name");

        if (users.length > 0) {
          const { title, date, venue } = req.body;
          const _id = event._id;
          const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

          const emailJobs = users.map(user => ({
            to: user.email,
            type: 'EXTERNAL_EVENT_ALERT',
            data: {
              userName: user.name,
              event: {
                title,
                date,
                venue,
                link: `${clientUrl}/external-events/${_id}`
              }
            },
            status: 'pending'
          }));
          await EmailQueue.insertMany(emailJobs);
        }
      } catch (queueError) { console.error("Queue Error", queueError); }
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update external event
// @route   PUT /api/external-events/:id
// @access  Private/Admin
const updateExternalEvent = async (req, res) => {
  try {
    const event = await ExternalEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ message: "External event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete external event
// @route   DELETE /api/external-events/:id
// @access  Private/Admin
const deleteExternalEvent = async (req, res) => {
  try {
    const event = await ExternalEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "External event not found" });
    }
    res.json({ message: "External event removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExternalEvents,
  getExternalEvent,
  createExternalEvent,
  updateExternalEvent,
  deleteExternalEvent,
};