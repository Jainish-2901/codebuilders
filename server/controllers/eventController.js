const Registration = require("../models/Registration");
const Event = require("../models/Event");
// 1. Import your central email helper
const sendEmail = require("../utils/sendEmail"); 
const { generateTicketPDF } = require("../utils/generateTicket"); 

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

    // 4. Generate PDF Ticket
    let pdfBuffer;
    try {
      pdfBuffer = await generateTicketPDF(registration, event);
    } catch (pdfError) {
      console.error("❌ PDF Generation Failed:", pdfError);
    }

    // 5. Send Email (Using Helper)
    const ticketLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ticket/${registration.tokenId}`;
    const uniqueRef = new Date().getTime().toString(36); 

    // ✅ Formatting Date for Email
    const eventDate = new Date(event.dateTime);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // HTML Content for the email
    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        
        <div style="background-color: #3730a3; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">Registration Confirmed!</h2>
        </div>

        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
          <p>You are all set for <strong>${event.title}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${formattedDate} at ${formattedTime}</p>
            <p style="margin: 5px 0;">📍 <strong>Venue:</strong> ${event.venue}</p>
            <p style="margin: 5px 0;">🎟️ <strong>Token ID:</strong> <span style="font-family: monospace;">${registration.tokenId}</span></p>
          </div>

          <p>Your <strong>e-Ticket PDF</strong> is attached to this email. Please scan the QR code at the entrance.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${ticketLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Mobile Ticket</a>
          </div>
          
          <br/>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <div style="text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 5px 0;">CodeBuilders Community Team</p>
            <span style="opacity: 0; font-size: 1px; color: transparent; display: none;">Ref: ${uniqueRef}</span>
          </div>
        </div>
      </div>
    `;

    // Send the email 
    try {
      await sendEmail({
        email: userEmail,
        subject: `Your Ticket: ${event.title}`,
        html: emailHtml,
        message: `You are registered for ${event.title}. View ticket: ${ticketLink}`, // Fallback text
        attachments: pdfBuffer ? [
          {
            filename: `${event.title.replace(/[^a-z0-9]/gi, '_')}_Ticket.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ] : [],
      });
    } catch (emailErr) {
      console.error("Email Sending Failed:", emailErr);
      // We don't block the response here, user is still registered
    }

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

module.exports = {
  registerForEvent,
  getTicketByToken,
  getEventRegistrations,
  getAllRegistrations,
  getRecentRegistrations,
  checkInRegistration,
  updateAttendance,
  deleteRegistration,
};