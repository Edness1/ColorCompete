const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.get('/', subscriptionController.getSubscriptionByUserId);
router.post('/', subscriptionController.createSubscription);
router.put('/', subscriptionController.updateSubscription);
router.post('/deduct', subscriptionController.deductSubmission);
router.post('/ensure-current', subscriptionController.ensureCurrentSubscription);

module.exports = router;