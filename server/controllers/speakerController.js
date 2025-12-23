const Speaker = require("../models/Speaker");

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
      name, 
      role, 
      specialty, 
      bio, 
      linkedinUrl, 
      githubUrl, 
      whatsappNumber 
    } = req.body;

    // Handle Image Upload (Cloudinary)
    let imageUrl = "";
    if (req.file) {
      // ✅ Cloudinary provides the full URL in .path
      imageUrl = req.file.path;
    }

    const speaker = await Speaker.create({
      name,
      role,
      specialty,
      bio,
      linkedinUrl,
      githubUrl,
      whatsappNumber,
      imageUrl,
    });

    res.status(201).json(speaker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a speaker
// @route   PUT /api/speakers/:id
const updateSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);

    if (speaker) {
      // Update Text Fields (Use existing value if new one isn't provided)
      speaker.name = req.body.name || speaker.name;
      speaker.role = req.body.role || speaker.role;
      speaker.specialty = req.body.specialty || speaker.specialty;
      speaker.bio = req.body.bio || speaker.bio;
      speaker.linkedinUrl = req.body.linkedinUrl || speaker.linkedinUrl;
      speaker.githubUrl = req.body.githubUrl || speaker.githubUrl;
      speaker.whatsappNumber = req.body.whatsappNumber || speaker.whatsappNumber;

      // Update Image ONLY if a new file is uploaded
      if (req.file) {
        // ✅ Cloudinary Logic: Update with new URL
        speaker.imageUrl = req.file.path;
      }

      const updatedSpeaker = await speaker.save();
      res.json(updatedSpeaker);
    } else {
      res.status(404).json({ message: "Speaker not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a speaker
// @route   DELETE /api/speakers/:id
const deleteSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (speaker) {
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