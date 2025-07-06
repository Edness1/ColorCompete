require('dotenv').config();
const mongoose = require('mongoose');
const EmailAutomation = require('./src/models/EmailAutomation');
const User = require('./src/models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/colorcompete');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Email template definitions
const emailTemplates = [
  {
    name: 'Contest Announcements',
    description: 'Notify users about new daily contests and challenges',
    triggerType: 'contest_announcement',
    isActive: true,
    emailTemplate: {
      subject: '🎨 New Contest Alert: {{contestTitle}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contest - ColorCompete</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .contest-card { border: 2px solid #667eea; border-radius: 12px; padding: 20px; margin: 20px 0; background: #f8f9ff; }
            .contest-title { font-size: 24px; color: #333; margin-bottom: 10px; font-weight: bold; }
            .contest-description { color: #666; line-height: 1.6; margin-bottom: 20px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 New Contest Alert!</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>A brand new coloring contest is now live on ColorCompete! Get your creative juices flowing and show off your artistic skills.</p>
              
              <div class="contest-card">
                <div class="contest-title">{{contestTitle}}</div>
                <div class="contest-description">{{contestDescription}}</div>
                <p><strong>Prize:</strong> {{contestPrize}}</p>
                <p><strong>Deadline:</strong> {{contestDeadline}}</p>
                <p><strong>Voting Period:</strong> {{votingPeriod}}</p>
              </div>

              <p>Don't miss your chance to win amazing prizes and showcase your creativity to the ColorCompete community!</p>
              
              <a href="{{contestUrl}}" class="cta-button">Join Contest Now</a>
              
              <p>Good luck and happy coloring!</p>
              <p>The ColorCompete Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you've subscribed to contest notifications.</p>
              <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{websiteUrl}}">Visit ColorCompete</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
Hi {{userName}},

A brand new coloring contest is now live on ColorCompete!

Contest: {{contestTitle}}
Description: {{contestDescription}}
Prize: {{contestPrize}}
Deadline: {{contestDeadline}}
Voting Period: {{votingPeriod}}

Join the contest now: {{contestUrl}}

Good luck and happy coloring!
The ColorCompete Team

Unsubscribe: {{unsubscribeUrl}}
      `
    }
  },
  {
    name: 'Voting Results',
    description: 'Announce when voting ends and winners are declared',
    triggerType: 'voting_results',
    isActive: true,
    emailTemplate: {
      subject: '🏆 Contest Results: {{contestTitle}} Winners Announced!',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contest Results - ColorCompete</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .winner-card { border: 3px solid #f5576c; border-radius: 12px; padding: 20px; margin: 20px 0; background: linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%); }
            .winner-rank { font-size: 18px; color: #f5576c; font-weight: bold; margin-bottom: 10px; }
            .winner-name { font-size: 22px; color: #333; margin-bottom: 5px; font-weight: bold; }
            .winner-prize { color: #f5576c; font-weight: bold; margin-bottom: 15px; }
            .submission-image { max-width: 100%; border-radius: 8px; margin: 10px 0; }
            .stats { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Contest Results!</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>The voting has ended for "<strong>{{contestTitle}}</strong>" and we're excited to announce the winners!</p>
              
              {{#winners}}
              <div class="winner-card">
                <div class="winner-rank">{{rank}}</div>
                <div class="winner-name">{{winnerName}}</div>
                <div class="winner-prize">Prize: {{prize}}</div>
                {{#submissionImage}}
                <img src="{{submissionImage}}" alt="Winning submission" class="submission-image">
                {{/submissionImage}}
                <p>Votes: {{voteCount}}</p>
              </div>
              {{/winners}}

              <div class="stats">
                <p><strong>Contest Statistics:</strong></p>
                <p>Total Submissions: {{totalSubmissions}}</p>
                <p>Total Votes: {{totalVotes}}</p>
                <p>Participants: {{totalParticipants}}</p>
              </div>

              {{#isWinner}}
              <p style="color: #f5576c; font-weight: bold; font-size: 18px;">🎉 Congratulations! You won {{yourRank}} place!</p>
              {{/isWinner}}

              {{^isWinner}}
              <p>Thank you for participating! Keep practicing and join our next contest.</p>
              {{/isWinner}}
              
              <a href="{{contestUrl}}" class="cta-button">View Full Results</a>
              
              <p>Stay tuned for more exciting contests!</p>
              <p>The ColorCompete Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you participated in this contest.</p>
              <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{websiteUrl}}">Visit ColorCompete</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
Hi {{userName}},

The voting has ended for "{{contestTitle}}" and we're excited to announce the winners!

{{#winners}}
{{rank}}: {{winnerName}} - {{prize}}
Votes: {{voteCount}}
{{/winners}}

Contest Statistics:
- Total Submissions: {{totalSubmissions}}
- Total Votes: {{totalVotes}}
- Participants: {{totalParticipants}}

{{#isWinner}}
🎉 Congratulations! You won {{yourRank}} place!
{{/isWinner}}

{{^isWinner}}
Thank you for participating! Keep practicing and join our next contest.
{{/isWinner}}

View full results: {{contestUrl}}

Stay tuned for more exciting contests!
The ColorCompete Team

Unsubscribe: {{unsubscribeUrl}}
      `
    }
  },
  {
    name: 'Comments & Feedback',
    description: 'Notify users when someone comments on their submissions',
    triggerType: 'comment_feedback',
    isActive: true,
    emailTemplate: {
      subject: '💬 New Comment on Your Submission: {{submissionTitle}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Comment - ColorCompete</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .submission-card { border: 2px solid #4facfe; border-radius: 12px; padding: 20px; margin: 20px 0; background: #f0f9ff; }
            .submission-title { font-size: 20px; color: #333; margin-bottom: 10px; font-weight: bold; }
            .submission-image { max-width: 100%; border-radius: 8px; margin: 15px 0; }
            .comment-card { background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .commenter-name { font-weight: bold; color: #4facfe; margin-bottom: 5px; }
            .comment-text { color: #333; line-height: 1.6; margin-bottom: 10px; }
            .comment-date { color: #666; font-size: 14px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Comment!</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>Great news! Someone just left a comment on your submission.</p>
              
              <div class="submission-card">
                <div class="submission-title">{{submissionTitle}}</div>
                <p>Contest: {{contestTitle}}</p>
                {{#submissionImage}}
                <img src="{{submissionImage}}" alt="Your submission" class="submission-image">
                {{/submissionImage}}
              </div>

              <div class="comment-card">
                <div class="commenter-name">{{commenterName}}</div>
                <div class="comment-text">{{commentText}}</div>
                <div class="comment-date">{{commentDate}}</div>
              </div>

              <p>Engagement from the community is what makes ColorCompete special! Check out the comment and consider replying to build connections with fellow artists.</p>
              
              <a href="{{submissionUrl}}" class="cta-button">View & Reply</a>
              
              <p>Keep creating amazing art!</p>
              <p>The ColorCompete Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because someone commented on your submission.</p>
              <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{websiteUrl}}">Visit ColorCompete</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
Hi {{userName}},

Great news! Someone just left a comment on your submission.

Submission: {{submissionTitle}}
Contest: {{contestTitle}}

New Comment from {{commenterName}}:
"{{commentText}}"
Posted on: {{commentDate}}

View and reply: {{submissionUrl}}

Keep creating amazing art!
The ColorCompete Team

Unsubscribe: {{unsubscribeUrl}}
      `
    }
  },
  {
    name: 'Weekly Summary',
    description: 'Weekly digest of user activity and platform updates',
    triggerType: 'weekly_summary',
    isActive: true,
    schedule: {
      time: '10:00',
      timezone: 'America/New_York'
    },
    emailTemplate: {
      subject: '📊 Your Weekly ColorCompete Summary',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Summary - ColorCompete</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px 20px; text-align: center; }
            .header h1 { color: #333; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e0e0e0; }
            .stat-number { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px; }
            .stat-label { color: #666; font-size: 14px; }
            .section { margin: 30px 0; }
            .section-title { font-size: 20px; color: #333; border-bottom: 2px solid #a8edea; padding-bottom: 10px; margin-bottom: 15px; }
            .contest-item { background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid #4facfe; }
            .contest-title { font-weight: bold; color: #333; margin-bottom: 5px; }
            .contest-status { color: #666; font-size: 14px; }
            .achievement-badge { display: inline-block; background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 2px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Your Weekly Summary</h1>
              <p style="margin: 10px 0; color: #666;">{{weekRange}}</p>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>Here's a recap of your ColorCompete activity this week!</p>
              
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-number">{{submissionsThisWeek}}</div>
                  <div class="stat-label">Submissions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{votesReceived}}</div>
                  <div class="stat-label">Votes Received</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{commentsReceived}}</div>
                  <div class="stat-label">Comments</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{rankingPosition}}</div>
                  <div class="stat-label">Global Rank</div>
                </div>
              </div>

              {{#hasActiveContests}}
              <div class="section">
                <div class="section-title">Your Active Contests</div>
                {{#activeContests}}
                <div class="contest-item">
                  <div class="contest-title">{{title}}</div>
                  <div class="contest-status">{{status}} • Ends {{endDate}}</div>
                </div>
                {{/activeContests}}
              </div>
              {{/hasActiveContests}}

              {{#hasAchievements}}
              <div class="section">
                <div class="section-title">This Week's Achievements</div>
                {{#achievements}}
                <span class="achievement-badge">{{name}}</span>
                {{/achievements}}
              </div>
              {{/hasAchievements}}

              <div class="section">
                <div class="section-title">Platform Highlights</div>
                <div style="background: #fff8f0; border-radius: 8px; padding: 15px; border-left: 4px solid #ff9500;">
                  <p><strong>🎯 New Contests:</strong> {{newContestsCount}} new contests launched</p>
                  <p><strong>👥 Community:</strong> {{newMembersCount}} new artists joined</p>
                  <p><strong>🏆 Top Prize:</strong> {{topPrizeThisWeek}} awarded</p>
                </div>
              </div>

              <p>Ready to create more amazing art? Join the latest contests and connect with fellow artists!</p>
              
              <a href="{{dashboardUrl}}" class="cta-button">View Dashboard</a>
              
              <p>Keep up the great work!</p>
              <p>The ColorCompete Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this weekly summary because you're an active ColorCompete member.</p>
              <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{websiteUrl}}">Visit ColorCompete</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
Your Weekly ColorCompete Summary
{{weekRange}}

Hi {{userName}},

Here's a recap of your ColorCompete activity this week!

Your Stats:
- Submissions: {{submissionsThisWeek}}
- Votes Received: {{votesReceived}}
- Comments: {{commentsReceived}}
- Global Rank: {{rankingPosition}}

{{#hasActiveContests}}
Your Active Contests:
{{#activeContests}}
- {{title}} ({{status}} • Ends {{endDate}})
{{/activeContests}}
{{/hasActiveContests}}

{{#hasAchievements}}
This Week's Achievements:
{{#achievements}}
- {{name}}
{{/achievements}}
{{/hasAchievements}}

Platform Highlights:
🎯 New Contests: {{newContestsCount}} new contests launched
👥 Community: {{newMembersCount}} new artists joined
🏆 Top Prize: {{topPrizeThisWeek}} awarded

View your dashboard: {{dashboardUrl}}

Keep up the great work!
The ColorCompete Team

Unsubscribe: {{unsubscribeUrl}}
      `
    }
  }
];

// Initialize the email templates
const initializeEmailTemplates = async () => {
  try {
    // Find an admin user (you might need to create one first)
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.username);

    // Create or update each template
    for (const template of emailTemplates) {
      const existingTemplate = await EmailAutomation.findOne({ 
        triggerType: template.triggerType 
      });

      if (existingTemplate) {
        console.log(`Updating existing template: ${template.name}`);
        await EmailAutomation.findByIdAndUpdate(existingTemplate._id, {
          ...template,
          createdBy: adminUser._id
        });
      } else {
        console.log(`Creating new template: ${template.name}`);
        const newTemplate = new EmailAutomation({
          ...template,
          createdBy: adminUser._id
        });
        await newTemplate.save();
      }
    }

    console.log('All email templates initialized successfully!');
    console.log('\nCreated/Updated templates:');
    emailTemplates.forEach(template => {
      console.log(`- ${template.name} (${template.triggerType})`);
    });

  } catch (error) {
    console.error('Error initializing email templates:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the initialization
connectDB().then(() => {
  initializeEmailTemplates();
});
