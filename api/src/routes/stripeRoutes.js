const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// GET subscription by userId
router.get('/', subscriptionController.getSubscriptionByUserId);

// POST create a new subscription
router.post('/', subscriptionController.createSubscription);

// PUT update/reset subscription
router.put('/', subscriptionController.updateSubscription);

// POST deduct a submission
router.post('/deduct', subscriptionController.deductSubmission);

module.exports = router;