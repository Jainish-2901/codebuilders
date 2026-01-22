const Registration = require("../models/Registration");
const Event = require("../models/Event");
// 👇 1. Import your central email helper instead of nodemailer directly
const sendEmail = require("../utils/sendEmail");
// const { generateTicketPDF } = require("../utils/generateTicket");

// @desc    Register for an event & Send Ticket Email
// @route   POST /api/registrations
const registerForEvent = async (req, res) => {
  try {
    const { eventId, userName, userEmail, userPhone } = req.body;

    // 1. Check duplicate registration
    const existingReg = await Registration.findOne({ eventId, userEmail });
    if (existingReg) {
      return res.status(400).json({ message: "User already registered for this event" });
    }

    // 2. Fetch Event Details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 3. Create Registration
    const registration = await Registration.create({
      eventId,
      userId: req.user ? req.user._id : null,
      userName,
      userEmail,
      userPhone,
    });

    // 4. Send Email (Using Queue System to prevent blocking)
    const ticketLink = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/ticket/${registration.tokenId}`;
    const EmailQueue = require("../models/EmailQueue");

    await EmailQueue.create({
      to: userEmail,
      type: 'REGISTRATION',
      data: {
        userName,
        event: {
          title: event.title,
          dateTime: event.dateTime,
          venue: event.venue
        },
        tokenId: registration.tokenId,
        ticketLink,
        registrationId: registration._id
      },
      status: 'pending'
    });

    console.log(`[Registration] Ticket email queued for ${userEmail}`);

    console.log(`[Registration] Ticket email queued for ${userEmail}`);

    res.status(201).json(registration);
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Ticket details by Token
// @route   GET /api/registrations/ticket/:tokenId
const getTicketByToken = async (req, res) => {
  try {
    const registration = await Registration.findOne({ tokenId: req.params.tokenId })
      .populate("eventId", "title venue dateTime fullDescription");
    if (registration) {
      res.json(registration);
    } else {
      res.status(404).json({ message: "Ticket not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get registrations for a specific event
// @route   GET /api/registrations/event/:eventId
const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ eventId: req.params.eventId });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// ✅ UPDATED: Robust Filter Logic & Debugging
// =========================================================
// @route   GET /api/registrations
const getAllRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const eventId = req.query.eventId;

    // Build Filter Query
    let queryObj = {};

    // 1. Search Filter (Validate string is not "undefined" or empty)
    if (search && search !== "undefined" && search !== "") {
      queryObj.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Event Filter (Strict validation)
    // Sometimes frontend sends string "undefined" or "null" which breaks DB query
    if (eventId && eventId !== 'all' && eventId !== 'undefined' && eventId !== 'null') {
      queryObj.eventId = eventId;
    }


    // Count Total Documents matching filter
    const count = await Registration.countDocuments(queryObj);

    // Prepare Database Query
    let dbQuery = Registration.find(queryObj)
      .populate("eventId", "title dateTime")
      .sort({ createdAt: -1 });

    // ✅ LOGIC: Apply Pagination ONLY if limit is NOT 'all'
    if (req.query.limit !== 'all') {
      const skip = (page - 1) * limit;
      dbQuery = dbQuery.limit(limit).skip(skip);
    }

    const registrations = await dbQuery;

    res.json({
      registrations,
      page,
      pages: req.query.limit === 'all' ? 1 : Math.ceil(count / limit),
      total: count,
    });
  } catch (error) {
    console.error("❌ Error in getAllRegistrations:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// ✅ NEW: Get Recent Registrations (Top 5)
// =========================================================
// @route   GET /api/registrations/recent
const getRecentRegistrations = async (req, res) => {
  try {
    // Filter logic removed here to ensure we get *ANY* recent registration
    const recentRegistrations = await Registration.find({})
      .sort({ createdAt: -1 }) // Newest first
      .limit(5)                // Only top 5
      .populate("eventId", "title");

    res.json(recentRegistrations);
  } catch (error) {
    console.error("Error fetching recent registrations:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Check-in User (Update status)
// @route   PUT /api/registrations/checkin/:tokenId
const checkInRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({ tokenId: req.params.tokenId });
    if (registration) {
      registration.isAttended = true;
      registration.status = "attended";
      const updatedReg = await registration.save();
      res.json({
        _id: updatedReg._id,
        userName: updatedReg.userName,
        userEmail: updatedReg.userEmail,
        tokenId: updatedReg.tokenId,
        isAttended: updatedReg.isAttended
      });
    } else {
      res.status(404).json({ message: "Registration token not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Attendance
// @route   PUT /api/registrations/:id/attendance
const updateAttendance = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (registration) {
      registration.isAttended = req.body.isAttended;
      registration.status = req.body.isAttended ? "attended" : "registered";
      const updatedReg = await registration.save();
      res.json(updatedReg);
    } else {
      res.status(404).json({ message: "Registration not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Registration
// @route   DELETE /api/registrations/:id
const deleteRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (registration) {
      await registration.deleteOne();
      res.json({ message: "Registration cancelled" });
    } else {
      res.status(404).json({ message: "Registration not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Check if logged-in user is registered for an event
// @route   GET /api/registrations/is-registered/:eventId
// @access  Private
const isUserRegisteredForEvent = async (req, res) => {
  try {
    // 🔐 SAFETY: if not logged in, they are not registered
    if (!req.user) {
      return res.json({ isRegistered: false });
    }

    const userId = req.user._id;
    const userEmail = req.user.email;
    const { eventId } = req.params;

    // Check by ID OR Email
    const exists = await Registration.findOne({
      eventId,
      $or: [
        { userId: userId },
        { userEmail: userEmail }
      ]
    });
    
    res.json({
      isRegistered: !!exists,
      tokenId: exists ? exists.tokenId : null
    });
  } catch (error) {
    console.error("❌ isUserRegisteredForEvent:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerForEvent,
  getTicketByToken,
  getEventRegistrations,
  getAllRegistrations,
  getRecentRegistrations,
  checkInRegistration,
  updateAttendance,
  deleteRegistration,
  isUserRegisteredForEvent,
};