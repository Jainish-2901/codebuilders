const express = require('express');
const router = express.Router();

// 1. Auth Middleware Import
const { protect, admin } = require('../middleware/authMiddleware');

// 2. ✅ Import Your New Cloudinary Middleware
// (Ab humein yaha alag se multer setup karne ki jarurat nahi hai)
const upload = require('../middleware/uploadMiddleware');

// 3. Controller Import
const {
  getSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker
} = require('../controllers/speakerController');

// 4. Routes Define

// Public: Get all speakers
router.get('/', getSpeakers);

// Admin: Create Speaker
// 'upload.single' ab file ko seedha Cloudinary par bhej dega
router.post('/', protect, admin, upload.single('image'), createSpeaker);

// Admin: Update Speaker
router.put('/:id', protect, admin, upload.single('image'), updateSpeaker);

// Admin: Delete Speaker
router.delete('/:id', protect, admin, deleteSpeaker);

module.exports = router;