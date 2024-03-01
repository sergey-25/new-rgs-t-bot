const mongoose = require("mongoose");

// Define the schema for training requests
const supportRequestSchema = new mongoose.Schema(
  {
    hospital_name: { type: String },
    recipient_name: { type: String },
    recipient_phone: { type: String },
    recipient_email: { type: String },
    problem: { type: String },
  },
  {
    timestamps: true,
  }
);

// Define the model for training requests
const SupportRequest = mongoose.model(
  "SupportRequest",
  supportRequestSchema
);

module.exports = SupportRequest;
