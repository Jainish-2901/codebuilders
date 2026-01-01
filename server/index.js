const dotenv = require("dotenv").config();
const startCronJobs = require("./utils/cronJobs");
const express = require("express");
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
const teamMemberRoutes = require("./routes/teamMemberRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const messageRoutes = require("./routes/messageRoutes");
const externalEventsRoutes = require("./routes/externalEventsRoutes");

connectDB();

const app = express();

// --- SECURITY MIDDLEWARES START ---

// 1. Set Security Headers
// We enable crossOriginResourcePolicy to allow resources to be loaded from cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. ✅ CORS Configuration (FIXED)
// '*' ke sath credentials: true kaam nahi karta. Specific domains batane padte hain.
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",                   // Localhost Frontend
    "https://codebuilders-client.vercel.app",  // Live Frontend (Update karein agar URL alag hai)
    "https://codebuildersadmin.vercel.app",
    "https://codebuilders-events.vercel.app",
    "https://codebuilders-admin.vercel.app"
    // Agar koi aur domain hai to yaha add karein
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));

// 3. Rate Limiting Logic

// A. Strict Limiter for Authenticationx          
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true, 
  legacyHeaders: false,
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// Apply Strict Limiter
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// B. Global Rate Limiting (General API usage)
// ⚠️ Maine limit badha di hai (1000) taaki testing ke dauran aap block na hon
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 1000, // Increased for development/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 10 minutes' }
});

// Apply Global Limiter
app.use("/api", limiter);


// 4. Body Parser
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
app.use("/api/team-members", teamMemberRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/external-events", externalEventsRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

startCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
