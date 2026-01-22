const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/overview
const getAdminOverview = async (req, res) => {
  const totalEvents = await Event.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalVolunteers = await User.countDocuments({ role: "volunteer" });
  const totalRegistrations = await Registration.countDocuments({ status: { $ne: 'cancelled' } });

  res.json({
    totalEvents,
    totalUsers,
    totalVolunteers,
    totalRegistrations,
  });
};

// @desc    Get all volunteers
// @route   GET /api/admin/volunteers
const getVolunteers = async (req, res) => {
  const volunteers = await User.find({ role: "volunteer" }).populate("assignedEventId", "title");

  // Format data for frontend
  const formattedVolunteers = volunteers.map(vol => ({
    _id: vol._id,
    username: vol.name,
    email: vol.email,
    assignedEventId: vol.assignedEventId, // This will be the full object or null
    isActive: vol.isActive,
  }));

  res.json(formattedVolunteers);
};

// @desc    Create a Volunteer (Admin creates a User with role 'volunteer')
// @route   POST /api/admin/volunteers
const createVolunteer = async (req, res) => {
  const { username, assignedEventId, isActive } = req.body;

  // Since frontend only provides username, we generate dummy email/pass
  // In a real app, you'd ask for email in the form
  const email = `${username.replace(/\s+/g, '').toLowerCase()}@volunteer.codebuilders.com`;
  const password = "password123"; // Default password

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "Volunteer with this username already exists" });
  }

  const user = await User.create({
    name: username,
    email,
    password, // Will be hashed by User model
    role: "volunteer",
    assignedEventId: assignedEventId || null,
    isActive: isActive !== undefined ? isActive : true,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.name,
      assignedEventId: user.assignedEventId,
      isActive: user.isActive,
    });
  } else {
    res.status(400).json({ message: "Invalid volunteer data" });
  }
};

// @desc    Update Volunteer
// @route   PUT /api/admin/volunteers/:id
const updateVolunteer = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.username || user.name;
    user.assignedEventId = req.body.assignedEventId || user.assignedEventId;
    if (req.body.isActive !== undefined) {
      user.isActive = req.body.isActive;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.name,
      assignedEventId: updatedUser.assignedEventId,
      isActive: updatedUser.isActive,
    });
  } else {
    res.status(404).json({ message: "Volunteer not found" });
  }
};

// @desc    Delete Volunteer
// @route   DELETE /api/admin/volunteers/:id
const deleteVolunteer = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: "Volunteer removed" });
  } else {
    res.status(404).json({ message: "Volunteer not found" });
  }
};

module.exports = {
  getAdminOverview,
  getVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
};