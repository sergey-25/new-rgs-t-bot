const express = require('express');
const router = express.Router();
const supportRequestController = require('../controllers/supportRequestController.js');

router.post('/support-request', supportRequestController.createTrainingRequest);
router.get('/support-requests', supportRequestController.getAllSupportRequests);
module.exports = router;