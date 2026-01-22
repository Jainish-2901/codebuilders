const Event = require("../models/Event");
const cloudinary = require("cloudinary").v2;

// Cloudinary Config (Needed if we implement cover image deletion later)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Create an event
// @route   POST /api/events
const createEvent = async (req, res) => {
  try {
    const {
      title, description, fullDescription, venue, dateTime,
      maxAttendees, status, isRegistrationEnabled, mapUrl,
      memoriesUrl
    } = req.body;

    let imageUrl = null;

    // Handle Cover Image Upload
    if (req.files && req.files.image && req.files.image.length > 0) {
      imageUrl = req.files.image[0].path;
    }

    const event = await Event.create({
      title,
      description,
      fullDescription,
      venue,
      dateTime,
      maxAttendees,
      status,
      imageUrl,
      mapUrl,
      // ✅ Save External Album Link
      memoriesUrl: memoriesUrl || "",
      isRegistrationEnabled: isRegistrationEnabled === "true",
    });

    // 🚀 NEW: Queue "New Event" Email for ALL Users
    if (status === 'upcoming') {
      try {
        const User = require("../models/User");
        const EmailQueue = require("../models/EmailQueue");
        const users = await User.find({}, "email name");

        if (users.length > 0) {
          const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const emailJobs = users.map(user => ({
            to: user.email,
            type: 'NEW_EVENT',
            data: {
              userName: user.name,
              event: {
                title,
                dateTime,
                venue
              },
              eventLink: `${clientUrl}/events/${event._id}`
            },
            status: 'pending'
          }));
          await EmailQueue.insertMany(emailJobs);
        }
      } catch (queueError) { console.error("Queue Error", queueError); }
    }

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      event.title = req.body.title || event.title;
      event.description = req.body.description || event.description;
      event.fullDescription = req.body.fullDescription || event.fullDescription;
      event.venue = req.body.venue || event.venue;
      event.mapUrl = req.body.mapUrl || event.mapUrl;
      event.dateTime = req.body.dateTime || event.dateTime;
      event.maxAttendees = req.body.maxAttendees || event.maxAttendees;
      event.status = req.body.status || event.status;

      // ✅ Update Memories Link
      event.memoriesUrl = req.body.memoriesUrl || event.memoriesUrl;

      if (req.body.isRegistrationEnabled !== undefined) {
        event.isRegistrationEnabled = req.body.isRegistrationEnabled === "true";
      }

      // Update Cover Image if new one provided
      if (req.files && req.files.image && req.files.image.length > 0) {
        event.imageUrl = req.files.image[0].path;
      }

      const updatedEvent = await event.save();
      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all events
// @route   GET /api/events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ dateTime: 1 });

    // Attach registration count to each event
    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        // Only count VALID registrations (ignore cancelled)
        const count = await require("../models/Registration").countDocuments({
          eventId: event._id, // ✅ FIXED: Schema uses 'eventId', not 'event'
          status: { $ne: 'cancelled' }
        });

        return {
          ...event.toObject(),
          registrationCount: count
        };
      })
    );

    res.json(eventsWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (event) {
      // ✅ Add dynamic registration count (excluding cancelled)
      const count = await require("../models/Registration").countDocuments({
        eventId: event._id,
        status: { $ne: 'cancelled' }
      });

      const eventData = { ...event.toObject(), registrationCount: count };
      res.json(eventData);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (event) {
      await event.deleteOne();
      res.json({ message: "Event removed" });
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  getEvents,
  getEventById,
  deleteEvent
};