const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

// Route for single submission checkout session
router.post('/checkout-session', stripeController.createCheckoutSession);

// Route for subscription checkout session
router.post('/subscription-session', stripeController.createSubscriptionSession);

// Route to verify a Stripe session
router.get('/verify-session', stripeController.verifySession);

module.exports = router;