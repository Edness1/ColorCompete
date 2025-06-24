// Require Stripe and initialize with your secret key
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create a Stripe Checkout session for a single submission
exports.createCheckoutSession = async (req, res) => {
  try {
    const { userId, contestId, returnUrl } = req.body;
    if (!userId || !contestId || !returnUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Replace with your actual price ID for single submission
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_SINGLE_SUBMISSION_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: returnUrl,
      cancel_url: returnUrl,
      metadata: { userId, contestId },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a Stripe Checkout session for a subscription
exports.createSubscriptionSession = async (req, res) => {
  try {
    const { userId, planTier, returnUrl } = req.body;
    if (!userId || !planTier || !returnUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Map planTier to your Stripe price IDs
    const priceIdMap = {
      lite: process.env.STRIPE_LITE_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
      champ: process.env.STRIPE_CHAMP_PRICE_ID,
    };
    const priceId = priceIdMap[planTier];
    if (!priceId) {
      return res.status(400).json({ message: 'Invalid plan tier' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: returnUrl,
      cancel_url: returnUrl,
      metadata: { userId, planTier },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify a Stripe session (expand as needed)
exports.verifySession = async (req, res) => {
    console.log('Verifying Stripe session');
  try {
    const { sessionId } = req.query;

    console.log('Verifying Stripe session', sessionId);
    if (!sessionId) {
      return res.status(400).json({ message: 'Missing sessionId' });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};