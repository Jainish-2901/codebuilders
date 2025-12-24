const Event = require("../models/Event");
const cloudinary = require("cloudinary").v2;

// 1️⃣ Cloudinary Config (Only needed here for Deletion logic)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ❌ Removed: streamifier and uploadToCloudinary helper function
// (Middleware now handles uploads automatically)

// @desc    Create an event
// @route   POST /api/events
const createEvent = async (req, res) => {
  try {
    const {
      title, description, fullDescription, venue, dateTime,
      maxAttendees, status, isRegistrationEnabled, mapUrl
    } = req.body;

    let imageUrl = null;

    // ✅ UPDATED LOGIC: Get URL directly from Middleware
    // Since we use upload.fields(), access via req.files['fieldname']
    if (req.files && req.files.image && req.files.image.length > 0) {
       imageUrl = req.files.image[0].path; // Cloudinary URL
    }

    const event = await Event.create({
      title,
      description,
      fullDescription,
      venue,
      dateTime,
      maxAttendees,
      status,
      imageUrl, // Full Cloudinary URL
      mapUrl,
      isRegistrationEnabled: isRegistrationEnabled === "true",
      memories: []
    });

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
      
      if (req.body.isRegistrationEnabled !== undefined) {
         event.isRegistrationEnabled = req.body.isRegistrationEnabled === "true";
      }

      // ✅ UPDATED LOGIC: Update Image
      if (req.files && req.files.image && req.files.image.length > 0) {
        // Optional: Delete old image if needed using cloudinary.uploader.destroy()
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
    res.json(events);
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
      res.json(event);
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

// ---------------------------------------------------------
// 👇 MEMORIES FUNCTIONS (UPDATED)
// ---------------------------------------------------------

const getEventMemories = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('memories');
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event.memories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadEventMemories = async (req, res) => {
  try {
    // ✅ With upload.array(), req.files is an array of file objects
    // Middleware has already uploaded them to Cloudinary
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // ✅ Simply map the results from req.files
    const newMemories = req.files.map(file => ({
      url: file.path,       // Direct Cloudinary URL
      publicId: file.filename // Direct Cloudinary Public ID
    }));

    event.memories.push(...newMemories);
    await event.save();

    res.status(200).json(event.memories);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteEventMemory = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: "Event not found" });

    const memory = event.memories.id(imageId);
    if (!memory) return res.status(404).json({ message: "Image not found" });

    // ✅ Cloudinary Delete (Still needed here manually)
    if (memory.publicId) {
       try {
         await cloudinary.uploader.destroy(memory.publicId);
       } catch (err) {
         console.error("Cloudinary Delete Error:", err);
         // Continue to delete from DB even if Cloudinary fails
       }
    }

    event.memories.pull(imageId);
    await event.save();

    res.json({ message: "Memory deleted successfully" });
  } catch (error) {
    console.error("Delete Memory Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createEvent, 
  updateEvent, 
  getEvents, 
  getEventById, 
  deleteEvent,
  getEventMemories,
  uploadEventMemories,
  deleteEventMemory
};