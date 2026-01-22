const Contact = require("../models/Contact");

// @desc    Submit a contact form (Public)
// @route   POST /api/contact
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({ message: "Message sent successfully", contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages (Admin only)
// @route   GET /api/contact
const getAllMessages = async (req, res) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 }); // Latest first
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read (Admin only)
// @route   PUT /api/contact/:id/read
const markAsRead = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (message) {
      message.isRead = true;
      const updatedMessage = await message.save();
      res.json(updatedMessage);
    } else {
      res.status(404).json({ message: "Message not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a message (Admin only)
// @route   DELETE /api/contact/:id
const deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (message) {
      await message.deleteOne();
      res.json({ message: "Message deleted" });
    } else {
      res.status(404).json({ message: "Message not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👇 Ensure all 4 functions are exported
module.exports = {
  submitContactForm,
  getAllMessages,
  markAsRead,
  deleteMessage
};