const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const EmailAutomation = require('../models/EmailAutomation');
const User = require('../models/User');
const emailService = require('../services/emailService');

async function simulateAutomationRoute() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Simulate exactly what the route does
    const automations = await EmailAutomation.find();
    console.log(`Found ${automations.length} automations`);
    
    for (const a of automations.slice(0, 1)) { // Just test first one
      console.log(`\n=== Testing: ${a.name} ===`);
      
      const users = await User.find({ email: { $exists: true, $ne: '' } }).select('_id email firstName lastName username');
      console.log(`Found ${users.length} users with email`);

      const commonData = {
        challenge_title: 'Test Contest Title',
        challenge_description: 'This is a test description for the latest ColorCompete contest.',
        end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString(),
        prize_amount: '$25 Gift Card',
        contest_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/contests/test-contest`,
        winner_name: 'Alex Artist',
        winning_submission: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/images/winning.png`,
        total_votes: '123',
        results_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/contests/test-contest/results`,
        user_name: 'ColorCompeter',
        dashboard_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
        websiteUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      };

      let sent = 0;
      for (const u of users.slice(0, 2)) { // test 2 users
        const firstName = u.firstName || u.username || 'ColorCompeter';
        const lastName = u.lastName || '';
        const perUserData = {
          ...commonData,
          user_name: firstName,
          userName: firstName,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName}${lastName ? ' ' + lastName : ''}`,
          submissions_count: commonData.user_submissions_count || commonData.submissions_count || '0',
          wins_count: commonData.user_wins_count || commonData.wins_count || '0',
          votes_count: commonData.user_total_votes || commonData.total_votes || '0',
          unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?userId=${u._id}`
        };
        const subject = emailService.replaceTemplateVariables(a.emailTemplate.subject, perUserData);
        const htmlContent = emailService.replaceTemplateVariables(a.emailTemplate.htmlContent, perUserData);
        console.log('Subject:', subject);
        const result = await emailService.sendEmail({
          to: { userId: u._id, email: u.email },
          subject,
          htmlContent,
          automationId: a._id
        });
        console.log('Result:', result);
        if (result.success) sent += 1;
      }
      console.log(`Summary: sent ${sent}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

simulateAutomationRoute();