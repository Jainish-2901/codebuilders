const mongoose = require("mongoose");

const speakerSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true }, // e.g., "Senior Engineer @ Google"
    specialty: { type: String, required: true }, // e.g., "React & TypeScript"
    bio: { type: String },
    
    // Stores Full Cloudinary URL now (e.g., https://res.cloudinary.com/...)
    imageUrl: { type: String }, 
    
    // Social Links
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    whatsappNumber: { type: String }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Speaker", speakerSchema);