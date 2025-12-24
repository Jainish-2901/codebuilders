const Speaker = require("../models/Speaker");
const cloudinary = require("cloudinary").v2;

// 1️⃣ Cloudinary Config (Only needed here for Deletion logic)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ❌ Removed: streamifier and uploadToCloudinary helper function
// (Your middleware now handles uploads automatically)

// @desc    Get all speakers
// @route   GET /api/speakers
const getSpeakers = async (req, res) => {
  try {
    const speakers = await Speaker.find({});
    res.json(speakers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a speaker
// @route   POST /api/speakers
const createSpeaker = async (req, res) => {
  try {
    const { 
      name, role, specialty, bio, linkedinUrl, githubUrl, whatsappNumber 
    } = req.body;

    let imageUrl = "";

    // ✅ UPDATED: Get URL directly from Middleware
    // Middleware uploads the file and puts the details in req.file
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    }

    const speaker = await Speaker.create({
      name,
      role,
      specialty,
      bio,
      linkedinUrl,
      githubUrl,
      whatsappNumber,
      imageUrl, // Saved as full URL
    });

    res.status(201).json(speaker);
  } catch (error) {
    console.error("Error creating speaker:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a speaker
// @route   PUT /api/speakers/:id
const updateSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);

    if (speaker) {
      speaker.name = req.body.name || speaker.name;
      speaker.role = req.body.role || speaker.role;
      speaker.specialty = req.body.specialty || speaker.specialty;
      speaker.bio = req.body.bio || speaker.bio;
      speaker.linkedinUrl = req.body.linkedinUrl || speaker.linkedinUrl;
      speaker.githubUrl = req.body.githubUrl || speaker.githubUrl;
      speaker.whatsappNumber = req.body.whatsappNumber || speaker.whatsappNumber;

      // ✅ UPDATED: Update Image
      if (req.file) {
        // Optional: If you want to delete the OLD image from Cloudinary, 
        // you would need to store the public_id in your DB or extract it from the old URL.
        
        speaker.imageUrl = req.file.path; // Update with new URL
      }

      const updatedSpeaker = await speaker.save();
      res.json(updatedSpeaker);
    } else {
      res.status(404).json({ message: "Speaker not found" });
    }
  } catch (error) {
    console.error("Error updating speaker:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a speaker
// @route   DELETE /api/speakers/:id
const deleteSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (speaker) {
      
      // ✅ Optional: Delete image from Cloudinary
      // This extracts "folder/filename" from "https://res.cloudinary.com/.../folder/filename.jpg"
      if (speaker.imageUrl) {
        try {
            const publicId = speaker.imageUrl.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error("Failed to delete image from Cloudinary:", err);
        }
      }

      await speaker.deleteOne();
      res.json({ message: "Speaker removed" });
    } else {
      res.status(404).json({ message: "Speaker not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSpeakers, createSpeaker, updateSpeaker, deleteSpeaker };