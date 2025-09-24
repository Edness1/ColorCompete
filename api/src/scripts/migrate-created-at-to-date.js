// Migration: Convert Submission.created_at from string to Date type
// Usage: node src/scripts/migrate-created-at-to-date.js
// Preconditions: Update Submission schema to use Date before running OR run with forceConversion flag first then deploy schema change.

require('dotenv').config();
const mongoose = require('mongoose');

const Submission = require('../models/Submission');

async function run() {
  const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/colorcompete';
  await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

  const dryRun = process.argv.includes('--dry');
  const limit = parseInt(process.argv[process.argv.indexOf('--limit') + 1], 10) || 0;

  console.log(`Starting migration (dryRun=${dryRun})...`);

  // Fetch all with string created_at (heuristic: typeof === 'string')
  const cursor = Submission.find({}).cursor();
  let processed = 0;
  let converted = 0;
  let skipped = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    processed++;
    if (limit && processed > limit) break;

    if (typeof doc.created_at === 'string') {
      const d = new Date(doc.created_at);
      if (!isNaN(d.getTime())) {
        if (!dryRun) {
          // Assign as Date object; schema change must allow Date
          doc.created_at = d;
          try {
            await doc.save();
            converted++;
          } catch (err) {
            console.error(`Failed to save submission ${doc._id}:`, err.message);
            skipped++;
          }
        } else {
          converted++;
        }
      } else {
        console.warn(`Unparseable date string for submission ${doc._id}:`, doc.created_at);
        skipped++;
      }
    } else if (doc.created_at instanceof Date) {
      // Already good
    } else {
      skipped++;
    }

    if (processed % 500 === 0) {
      console.log(`Processed ${processed} docs... (converted=${converted}, skipped=${skipped})`);
    }
  }

  console.log('Migration summary:', { processed, converted, skipped, dryRun });
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
