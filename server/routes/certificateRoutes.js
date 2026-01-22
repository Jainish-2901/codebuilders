const express = require("express");
const router = express.Router();
const { sendCertificates } = require("../controllers/certificateController");
const { protect, admin } = require("../middleware/authMiddleware");

// Route to send certificates
router.post("/send/:eventId", protect, admin, sendCertificates);

module.exports = router;
