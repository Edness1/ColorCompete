require('dotenv').config();
const mongoose = require('mongoose');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI env var');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
}

const Subscription = require('../models/Subscription');

const tierSubmissionLimits = { free: 2, lite: 5, pro: 20, champ: 999 };

function needsMonthlyReset(lastResetAt, now = new Date()) {
  if (!lastResetAt) return true;
  return (
    lastResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
    lastResetAt.getUTCMonth() !== now.getUTCMonth()
  );
}

async function migrate() {
  await connect();
  console.log('Connected to MongoDB');

  // Find users that have multiple legacy docs (month/year) or any doc at all
  const pipeline = [
    { $group: { _id: '$userId', count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
    { $match: { count: { $gte: 1 } } }
  ];
  const groups = await Subscription.aggregate(pipeline);

  let updated = 0;
  for (const g of groups) {
    const userId = g._id;
    // Sort docs by updatedAt desc (newest first)
    const docs = g.docs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const newest = docs[0];

    // Build the single-doc shape
    const tier = newest.tier || 'free';
    let remaining = typeof newest.remaining_submissions === 'number' ? newest.remaining_submissions : tierSubmissionLimits[tier] || 2;
    let lastResetAt = newest.lastResetAt || new Date();

    // If legacy docs have month/year, try to set a reasonable lastResetAt (use newest updatedAt)
    if (!newest.lastResetAt) {
      lastResetAt = newest.updatedAt || newest.createdAt || new Date();
    }

    // Ensure monthly reset aligned
    if (needsMonthlyReset(new Date(lastResetAt))) {
      remaining = tierSubmissionLimits[tier] || 2;
      lastResetAt = new Date();
    }

    // Upsert single doc per user
    const single = await Subscription.findOneAndUpdate(
      { userId },
      { userId, tier, remaining_submissions: remaining, lastResetAt },
      { upsert: true, new: true }
    );

    // Remove all other docs except the single we just wrote
    await Subscription.deleteMany({ userId, _id: { $ne: single._id } });
    updated++;
  }

  console.log(`Migrated ${updated} user subscriptions to single-doc model.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
