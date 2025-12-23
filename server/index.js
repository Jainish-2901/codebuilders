const startCronJobs = require("./utils/cronJobs");
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// 👇 1. Import Security Packages
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Routes Import
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const contactRoutes = require("./routes/contactRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();
connectDB();

const app = express();

// --- SECURITY MIDDLEWARES START ---

// 1. Set Security Headers
// We enable crossOriginResourcePolicy to allow your React app (port 5173) to load images from here (port 5000)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS Configuration (Dynamic)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// 3. Rate Limiting Logic

// A. Strict Limiter for Authentication (Prevents Brute Force)
// Allows only 5 attempts every 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// Apply Strict Limiter to Login and Forgot Password
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// B. Global Rate Limiting (General API usage)
// Limit to 100 requests per 10 minutes
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
// Apply Global Limiter to all other API routes
app.use("/api", limiter);


// 4. Body Parser with Size Limit (Prevents DoS by large payloads)
app.use(express.json({ limit: "10kb" }));

// 5. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 6. Data Sanitization against XSS
app.use(xss());

// 7. Prevent Parameter Pollution
app.use(hpp());

// --- SECURITY MIDDLEWARES END ---

// Routes Use
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/speakers", speakerRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);

// Serve Static Images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API is running...");
});

startCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});