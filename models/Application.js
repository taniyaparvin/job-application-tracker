const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Wishlist", "Applied", "Interview", "Offer", "Rejected"],
      default: "Applied",
    },
    dateApplied: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
