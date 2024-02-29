const TrainingRequest = require("../models/trainingRequestModel.js");

exports.createTrainingRequest = async (req, res) => {
    console.log(req.body, 'req.body');
  try {
    const trainingRequest = new TrainingRequest(req.body);
    await trainingRequest.save();
    res.status(201).send({ ...trainingRequest.toObject(), _id: trainingRequest._id }); // Sending hospital with _id
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getAllTrainingRequests = async (req, res) => {
  try {
    const trainingRequests = await TrainingRequest.find();
    res.json(trainingRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
}