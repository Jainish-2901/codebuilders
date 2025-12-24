const express = require("express");
const router = express.Router();

// 1. Controller Import
const {
  getSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
} = require("../controllers/speakerController");

// 2. Auth Middleware Import
const { protect, admin } = require("../middleware/authMiddleware");

// 3. Cloudinary Upload Middleware Import
const upload = require("../middleware/uploadMiddleware");

// ==================================================================
// ROUTES
// ==================================================================

// Route: /api/speakers
router.route("/")
  .get(getSpeakers) // ✅ Public: Everyone can see speakers
  .post(
    protect, 
    admin, 
    upload.single("image"), // ✅ Middleware: Handles Image Upload to Cloudinary
    createSpeaker
  );

// Route: /api/speakers/:id
router.route("/:id")
  .put(
    protect, 
    admin, 
    upload.single("image"), // ✅ Middleware: Handles Image Upload on Update
    updateSpeaker
  )
  .delete(protect, admin, deleteSpeaker);

module.exports = router;