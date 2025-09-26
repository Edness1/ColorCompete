// Normalize placeholders in EmailAutomation templates
// - Maps common variants to canonical keys
// - Fixes malformed placeholders like {{ some text }} without a real key

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const EmailAutomation = require('../models/EmailAutomation');

const CANON = {
  // Names
  user_name: ['userName', 'first_name', 'firstName', 'name'],
  last_name: ['lastName'],
  full_name: ['fullName'],

  // Contest fields
  challenge_title: ['contest_title', 'contestTitle'],
  challenge_description: ['contest_description', 'contestDescription'],
  end_date: ['contest_end_date', 'contestDeadline'],
  prize_amount: ['contest_prize', 'contestPrize'],
  contest_url: ['contestUrl'],
  results_url: ['contestResultsUrl'],

  // Metrics (user)
  submissions_count: ['user_submissions_count', 'submission_count', 'submissionsCount', 'submissionCount'],
  wins_count: ['user_wins_count', 'win_count', 'winsCount', 'winCount'],
  votes_count: ['user_total_votes', 'vote_count', 'votesCount', 'voteCount'],

  // Totals
  total_submissions: ['total_submissions_count', 'totalSubmissions', 'totalSubmissionsCount'],
  total_votes: ['total_votes_count', 'totalVotes', 'totalVotesCount'],
  total_participants: ['total_participants_count', 'totalParticipants', 'totalParticipantsCount'],

  // URLs
  dashboard_url: ['dashboardUrl'],
  unsubscribeUrl: ['unsubscribe_url'],
  websiteUrl: ['website_url']
};

function toSnake(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function normalizePlaceholders(text) {
  if (!text) return text;

  // Build replacement map: variant -> canonical
  const map = new Map();
  for (const [canonical, variants] of Object.entries(CANON)) {
    map.set(canonical, canonical);
    for (const v of variants) {
      map.set(toSnake(v), canonical);
    }
  }

  // Replace placeholders allowing whitespace: {{ key }} or {{key}}
  // Extract all {{...}} tokens and normalize the key inside
  return text.replace(/{{\s*([^}]+?)\s*}}/g, (m, inner) => {
    const key = toSnake(inner);
    if (map.has(key)) {
      return `{{${map.get(key)}}}`;
    }
    // Keep known literals (if someone wrote plain text inside braces)
    // Otherwise, return as-is to avoid unintended changes
    return m;
  });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const autos = await EmailAutomation.find();
  let updated = 0;

  for (const a of autos) {
    const beforeSubj = a.emailTemplate.subject;
    const beforeHtml = a.emailTemplate.htmlContent;

    const afterSubj = normalizePlaceholders(beforeSubj);
    const afterHtml = normalizePlaceholders(beforeHtml);

    if (beforeSubj !== afterSubj || beforeHtml !== afterHtml) {
      a.emailTemplate.subject = afterSubj;
      a.emailTemplate.htmlContent = afterHtml;
      await a.save();
      updated++;
      console.log(`Updated: ${a.name}`);
      if (beforeSubj !== afterSubj) {
        console.log('  Subject:', beforeSubj, '=>', afterSubj);
      }
      if (beforeHtml !== afterHtml) {
        console.log('  HTML content normalized');
      }
    }
  }

  console.log(`\nNormalization complete. Updated ${updated}/${autos.length} automations.`);
  await mongoose.connection.close();
}

run().catch(err => { console.error(err); process.exit(1); });
