const Subscription = require('../models/Subscription');

// Get subscription by userId
exports.getSubscriptionByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    const subscription = await Subscription.findOne({ userId });
    res.status(200).json({ subscription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new subscription
exports.createSubscription = async (req, res) => {
  try {
    const { userId, tier, remaining_submissions, month, year } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    const subscription = new Subscription({
      userId,
      tier,
      remaining_submissions,
      month,
      year,
    });
    await subscription.save();
    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update subscription (reset submissions)
exports.updateSubscription = async (req, res) => {
  try {
    const { userId, remaining_submissions, month, year } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      { remaining_submissions, month, year },
      { new: true }
    );
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Deduct a submission
exports.deductSubmission = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    if (subscription.remaining_submissions <= 0) {
      return res.status(400).json({ message: 'No submissions left' });
    }
    subscription.remaining_submissions -= 1;
    await subscription.save();
    res.status(200).json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};