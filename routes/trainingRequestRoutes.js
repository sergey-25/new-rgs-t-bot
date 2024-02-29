const express = require('express');
const router = express.Router();
const trainingRequestController = require('../controllers/trainingRequestController.js');

router.post('/training-requests', trainingRequestController.createTrainingRequest);
router.get('/notifications', trainingRequestController.getAllTrainingRequests);
module.exports = router;