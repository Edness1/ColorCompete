const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/colorcompete';
const collectionName = process.env.EMAIL_AUTOMATIONS_COLLECTION || 'email_automations';
console.log(`[init-email-automations] Using MongoDB URI: ${mongoUri}`);
console.log(`[init-email-automations] Target collection: ${collectionName}`);

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define EmailAutomation schema (matching the model)
const emailAutomationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: false },
  triggerType: {
    type: String,
    enum: ['daily_winner', 'monthly_winner', 'winner_reward', 'welcome', 'subscription_expired', 'contest_announcement', 'voting_results', 'comments_feedback', 'weekly_summary'],
    required: true,
    index: true,
    unique: true
  },
  emailTemplate: {
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    textContent: String
  },
  schedule: {
    time: String,
    dayOfMonth: Number,
    dayOfWeek: Number,
    timezone: { type: String, default: 'America/New_York' }
  },
  rewardSettings: {
    giftCardAmount: Number,
    giftCardMessage: String
  },
  totalSent: { type: Number, default: 0 },
  lastTriggered: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: collectionName
});

const EmailAutomation = mongoose.model('EmailAutomation', emailAutomationSchema);

// Email automation templates
const emailAutomations = [
  {
    name: 'Contest Announcements',
    description: 'Automatically notify users about new daily contests and challenges',
    isActive: true,
    triggerType: 'contest_announcement',
    schedule: {
      time: '11:00',
      timezone: 'UTC'
    },
    emailTemplate: {
      subject: '🎨 New Contest Alert: {{challenge_title}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #007bff; text-align: center;">🎨 New ColorCompete Contest!</h1>
          <p>A fresh contest is now live and waiting for your creativity!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">{{challenge_title}}</h2>
            <p>{{challenge_description}}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
              <div>
                <strong>Contest ends:</strong> {{end_date}}
              </div>
              <div>
                <strong>Prize:</strong> {{prize_amount}}
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{contest_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Contest Now</a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            Get ready to showcase your artistic skills and compete with talented artists worldwide!
          </p>
        </div>
      `,
      textContent: `New ColorCompete Contest: {{challenge_title}}\n\n{{challenge_description}}\n\nContest ends: {{end_date}}\nPrize: {{prize_amount}}\n\nJoin now: {{contest_url}}`
    }
  },
  {
    name: 'Voting Results',
    description: 'Announce when voting ends and winners are declared',
    isActive: false,
    triggerType: 'voting_results',
    emailTemplate: {
      subject: '📊 Voting Complete: {{challenge_title}} Results',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745; text-align: center;">📊 Contest Results Are In!</h1>
          <p>The voting has ended for <strong>{{challenge_title}}</strong> and we have our winner!</p>
          
          <div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="margin-top: 0; color: #28a745;">🥇 Winner: {{winner_name}}</h2>
            <img src="{{winning_submission}}" alt="Winning submission" style="max-width: 400px; width: 100%; border-radius: 8px; margin: 15px 0;" />
            <p style="font-size: 18px; color: #333;"><strong>Total votes:</strong> {{total_votes}}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Top 3 Submissions:</h3>
            <ol>
              <li><strong>{{winner_name}}</strong> - {{winner_votes}} votes</li>
              <li><strong>{{second_place}}</strong> - {{second_votes}} votes</li>
              <li><strong>{{third_place}}</strong> - {{third_votes}} votes</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{results_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Results</a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            Thank you to everyone who participated and voted! The next contest is just around the corner.
          </p>
        </div>
      `,
      textContent: `Contest Results: {{challenge_title}}\n\nWinner: {{winner_name}}\nTotal votes: {{total_votes}}\n\nView full results: {{results_url}}`
    }
  },
  {
    name: 'Comments & Feedback',
    description: 'Notify users when someone comments on their submissions',
    isActive: false,
    triggerType: 'comments_feedback',
    emailTemplate: {
      subject: '💬 New Comment on Your Submission: {{challenge_title}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #007bff; text-align: center;">💬 You've Got Feedback!</h1>
          <p>Someone left a comment on your submission for <strong>{{challenge_title}}</strong>!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <img src="{{commenter_avatar}}" alt="{{commenter_name}}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;" />
              <strong>{{commenter_name}}</strong>
            </div>
            <p style="font-style: italic; margin: 0; color: #444;">"{{comment_text}}"</p>
            <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">{{comment_date}}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <img src="{{submission_image}}" alt="Your submission" style="max-width: 300px; width: 100%; border-radius: 8px;" />
            <p style="font-size: 14px; color: #666; margin: 10px 0;">Your submission</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{submission_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Reply</a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            Keep the conversation going! Engage with the community and share your artistic journey.
          </p>
        </div>
      `,
      textContent: `New comment on your submission: {{challenge_title}}\n\n{{commenter_name}} said: "{{comment_text}}"\n\nView and reply: {{submission_url}}`
    }
  },
  {
    name: 'Weekly Summary',
    description: 'Weekly digest of user activity and platform highlights',
    isActive: false,
    triggerType: 'weekly_summary',
    schedule: {
      time: '09:00',
      dayOfWeek: 1, // Monday
      timezone: 'America/New_York'
    },
    emailTemplate: {
      subject: '📈 Your Weekly ColorCompete Summary',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #007bff; text-align: center;">📈 Your Week in ColorCompete</h1>
          <p>Here's what happened in your creative journey this week:</p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">🎨 Your Personal Stats</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #007bff;">{{submissions_count}}</div>
                <div style="color: #666;">Submissions Created</div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #28a745;">{{votes_received}}</div>
                <div style="color: #666;">Votes Received</div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #ffc107;">{{comments_received}}</div>
                <div style="color: #666;">Comments Received</div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #dc3545;">{{contests_won}}</div>
                <div style="color: #666;">Contests Won</div>
              </div>
            </div>
          </div>
          
          <div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">🌟 This Week's Platform Highlights</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;">🎯 <strong>{{active_contests}}</strong> active contests running</li>
              <li style="margin: 10px 0;">👥 <strong>{{new_members}}</strong> new community members joined</li>
              <li style="margin: 10px 0;">🎨 <strong>{{total_submissions}}</strong> amazing submissions created</li>
              <li style="margin: 10px 0;">⭐ <strong>{{featured_artist}}</strong> was featured as Artist of the Week</li>
            </ul>
          </div>
          
          {{#if best_submission}}
          <div style="background: #fff3cd; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #856404; margin-top: 0;">🏆 Your Best Performing Submission</h3>
            <img src="{{best_submission_image}}" alt="Your best submission" style="max-width: 300px; width: 100%; border-radius: 8px; margin: 15px 0;" />
            <p><strong>{{best_submission_title}}</strong></p>
            <p>{{best_submission_votes}} votes • {{best_submission_comments}} comments</p>
          </div>
          {{/if}}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px;">View Dashboard</a>
            <a href="{{contests_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px;">Join New Contest</a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            Keep creating, keep inspiring! We can't wait to see what you'll create this week.
          </p>
        </div>
      `,
      textContent: `Your Weekly ColorCompete Summary\n\nYour Stats:\n- {{submissions_count}} submissions created\n- {{votes_received}} votes received\n- {{comments_received}} comments received\n- {{contests_won}} contests won\n\nPlatform Highlights:\n- {{active_contests}} active contests\n- {{new_members}} new members\n- {{total_submissions}} total submissions\n\nView your dashboard: {{dashboard_url}}`
    }
  }
];

async function initializeEmailAutomations() {
  try {
    console.log('Connecting to database...');
    await mongoose.connection.asPromise();
    console.log(`Connected to DB: ${mongoose.connection.name}`);

    // Upsert by triggerType to avoid duplicates across runs
    for (const automation of emailAutomations) {
      const res = await EmailAutomation.findOneAndUpdate(
        { triggerType: automation.triggerType },
        { $set: automation, $currentDate: { updatedAt: true } },
        { upsert: true, new: true }
      );
      console.log(`✓ Ensured email automation: "${res.name}" (active: ${res.isActive})`);
    }

    const count = await EmailAutomation.countDocuments({});
    console.log(`\nTotal automations in ${collectionName}: ${count}`);
    const sample = await EmailAutomation.find({}, { name: 1, triggerType: 1, isActive: 1, schedule: 1 }).lean();
    console.table(sample);

    console.log('\n🎉 Email automation initialization complete!');
  } catch (error) {
    console.error('Error initializing email automations:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the initialization
initializeEmailAutomations();
