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
} = require("../controllers/registrationController");

// Auth Middleware
const { protect, admin } = require("../middleware/authMiddleware");

// ==================================================================
// ✅ PUBLIC ROUTES (No Login Required)
// ==================================================================

// 1. Create Registration (Guest User Allowed)
// ⚠️ Yahan se 'protect' hata diya gaya hai. Ab bina login ke form submit hoga.
router.post("/", registerForEvent);

// 2. View Ticket (Guest User Allowed)
router.get("/ticket/:tokenId", getTicketByToken);


// ==================================================================
// 🔒 ADMIN / PROTECTED ROUTES (Login Required)
// ==================================================================

// Get All Registrations (Admin Only)
router.get("/", protect, admin, getAllRegistrations);

// Get Recent Activity (Admin Only)
router.get("/recent", protect, admin, getRecentRegistrations);

// Check-in User (Volunteer/Admin)
router.put("/checkin/:tokenId", protect, checkInRegistration);

// Toggle Attendance (Volunteer/Admin)
router.put("/:id/attendance", protect, updateAttendance); 

// Delete Registration (Admin Only)
router.delete("/:id", protect, admin, deleteRegistration);

module.exports = router;