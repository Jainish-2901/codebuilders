const express = require("express");
const router = express.Router();
const {
  registerForEvent,
  getTicketByToken,
  getAllRegistrations,
  getRecentRegistrations,
  checkInRegistration,
  updateAttendance,
  deleteRegistration,
  getEventRegistrations,
  isUserRegisteredForEvent,
} = require("../controllers/registrationController");

// Auth Middleware
const { protect, optionalProtect, admin } = require("../middleware/authMiddleware");

// ==================================================================
// ✅ PUBLIC ROUTES (No Login Required)
// ==================================================================

// 1. Create Registration (Guest User Allowed but tracks UserID if logged in)
router.post("/", optionalProtect, registerForEvent);

// 2. View Ticket (Guest User Allowed)
router.get("/ticket/:tokenId", getTicketByToken);


// ==================================================================
// 🔒 PROTECTED ROUTES (Login Required)
// ==================================================================

// ✅ VOLUNTEER & ADMIN ROUTE
// This prevents the 401 Error on the Volunteer Panel.
// It allows fetching registrations for a specific event without needing Admin role.
router.get("/event/:eventId", protect, getEventRegistrations);

// ------------------------------------------------------------------

// ✅ ADMIN ONLY ROUTES
// Get All Registrations (Global list)
router.get("/", protect, admin, getAllRegistrations);

// Get Recent Activity
router.get("/recent", protect, admin, getRecentRegistrations);

// Delete Registration
router.delete("/:id", protect, admin, deleteRegistration);

// ------------------------------------------------------------------

// ✅ SHARED (Volunteer or Admin)
// Check-in User
router.put("/checkin/:tokenId", protect, checkInRegistration);

// Toggle Attendance
router.put("/:id/attendance", protect, updateAttendance);

// Check if User is Registered for Event
router.get("/is-registered/:eventId", protect, isUserRegisteredForEvent);

module.exports = router;