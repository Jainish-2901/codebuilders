const express = require("express");
const router = express.Router();
const {
  createEvent,
  updateEvent,
  getEvents,
  getEventById,
  deleteEvent,
  getEventMemories,
  uploadEventMemories,
  deleteEventMemory,
} = require("../controllers/eventController");

const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware"); 

// Define upload configuration for Create/Update Event
// We use .fields() because the controller checks req.files.image
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 } 
]);

// --- Standard Event Routes ---

router.route("/")
  .get(getEvents)
  .post(protect, admin, uploadFields, createEvent);

router.route("/:id")
  .get(getEventById)
  .put(protect, admin, uploadFields, updateEvent)
  .delete(protect, admin, deleteEvent);

// --- 📸 Memories / Gallery Routes ---

router.route("/:id/memories")
  .get(getEventMemories) 
  .post(
    protect, 
    admin, 
    upload.array('images', 10), // Cloudinary allows up to 10 images per batch here
    uploadEventMemories
  );

router.route("/:id/memories/:imageId")
  .delete(protect, admin, deleteEventMemory);

module.exports = router;