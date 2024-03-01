const SupportRequest = require("../models/supportRequestModel.js");

exports.createTrainingRequest = async (req, res) => {
    console.log(req.body, 'req.body');
  try {
    const supportRequest = new SupportRequest(req.body);
    await supportRequest.save();
    res.status(201).send({ ...supportRequest.toObject(), _id: supportRequest._id }); // Sending hospital with _id
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.getAllSupportRequests = async (req, res) => {
  try {
    const supportRequests = await SupportRequest.find();
    res.json(supportRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
}