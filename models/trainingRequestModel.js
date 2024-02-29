const mongoose = require("mongoose");

// Define the schema for training requests
const trainingRequestSchema = new mongoose.Schema(
  {
    was_there_training: { type: String },
    hospital_name: { type: String },
    recipient_name: { type: String },
    recipient_phone: { type: String },
    date: { type: String },
    time: { type: String },
    participants: { type: String },
  },
  {
    timestamps: true,
  }
);

// Define the model for training requests
const TrainingRequest = mongoose.model(
  "TrainingRequest",
  trainingRequestSchema
);

module.exports = TrainingRequest;
