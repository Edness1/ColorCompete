const Subscription = require('../models/Subscription');

const tierSubmissionLimits = { free: 2, lite: 5, pro: 20, champ: 999 };

function needsMonthlyReset(lastResetAt, now = new Date()) {
  if (!lastResetAt) return true;
  return (
    lastResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
    lastResetAt.getUTCMonth() !== now.getUTCMonth()
  );
}

async function ensureSubscription(userId, desiredTier) {
  // If legacy data has multiple docs, keep the newest and remove the rest
  const subs = await Subscription.find({ userId }).sort({ updatedAt: -1 });
  let sub = subs[0] || null;
  if (subs.length > 1) {
    const toRemove = subs.slice(1).map(s => s._id);
    if (toRemove.length) {
      await Subscription.deleteMany({ _id: { $in: toRemove } });
    }
  }
  if (!sub) {
    sub = await Subscription.create({
      userId,
      tier: desiredTier || 'free',
      remaining_submissions: tierSubmissionLimits[desiredTier || 'free'],
      lastResetAt: new Date()
    });
    return sub;
  }
  const now = new Date();
  if (needsMonthlyReset(sub.lastResetAt, now)) {
    const tier = sub.tier || 'free';
    sub.remaining_submissions = tierSubmissionLimits[tier];
    sub.lastResetAt = now;
    await sub.save();
  }
  return sub;
}

// Get or ensure a single subscription document for a user (auto monthly reset)
exports.getSubscriptionByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    const sub = await ensureSubscription(userId);
    res.status(200).json({ subscription: sub });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or upsert a subscription (single doc per user)
exports.createSubscription = async (req, res) => {
  try {
    const { userId, tier = 'free', remaining_submissions } = req.body;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    const defaults = tierSubmissionLimits[tier] ?? tierSubmissionLimits.free;
    const sub = await Subscription.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          lastResetAt: new Date()
        },
        $set: {
          tier,
          ...(typeof remaining_submissions === 'number' ? { remaining_submissions } : { remaining_submissions: defaults })
        }
      },
      { new: true, upsert: true }
    );
    res.status(201).json(sub);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update subscription (single doc per user)
exports.updateSubscription = async (req, res) => {
  try {
    const { userId, tier, remaining_submissions } = req.body;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    const update = {};
    if (tier) update.tier = tier;
    if (typeof remaining_submissions === 'number') update.remaining_submissions = remaining_submissions;
    const sub = await Subscription.findOneAndUpdate({ userId }, update, { new: true, upsert: true });
    // Do not mutate lastResetAt here; monthly reset handled via ensure
    res.status(200).json(sub);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Deduct a submission (auto ensure + monthly reset)
exports.deductSubmission = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    await ensureSubscription(userId);
    const updated = await Subscription.findOneAndUpdate(
      { userId, remaining_submissions: { $gt: 0 } },
      { $inc: { remaining_submissions: -1 } },
      { new: true }
    );
    if (!updated) {
      return res.status(402).json({ message: 'No submissions left' });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Ensure a subscription exists (single doc) and reset monthly if needed
exports.ensureCurrentSubscription = async (req, res) => {
  try {
    const { userId, tier } = req.body;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    const sub = await ensureSubscription(userId, tier);
    res.status(200).json(sub);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};