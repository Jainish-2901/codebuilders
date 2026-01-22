const express = require("express");
const router = express.Router();
const {
  authUser,
  registerUser,
  getUserProfile,
  updateProfile,
  changePassword,
  requestPasswordReset, // 👈 Import
  resetPasswordWithOtp,  // 👈 Import
  logout
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public Routes
router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/logout", logout);

// 👇 Forgot Password Routes (Must be Public)
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPasswordWithOtp);

// Protected Routes
router.get("/me", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.put("/profile/password", protect, changePassword);

module.exports = router;