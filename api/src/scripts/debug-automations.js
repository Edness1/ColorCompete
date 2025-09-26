require('dotenv').config();
const mongoose = require('mongoose');
const EmailAutomation = require('../models/EmailAutomation');
const User = require('../models/User');
const emailService = require('../services/emailService');

async function debugAutomationEmails() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const automations = await EmailAutomation.find().limit(1);
    const users = await User.find({ email: { $exists: true, $ne: '' } }).select('_id email firstName lastName username').limit(1);
    
    console.log(`Testing with ${users.length} users and ${automations.length} automations`);
    
    for (const automation of automations) {
      console.log(`\n--- Testing Automation: ${automation.name} ---`);
      console.log('Subject template:', automation.emailTemplate.subject);
      console.log('HTML template length:', automation.emailTemplate.htmlContent.length);
      
      for (const user of users) {
        console.log(`\nSending to: ${user.email}`);
        
        const testData = {
          challenge_title: 'Test Contest',
          user_name: user.firstName || user.username || 'ColorCompeter',
          unsubscribeUrl: `http://localhost:5173/unsubscribe?userId=${user._id}`
        };
        
        try {
          const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, testData);
          console.log('Processed subject:', subject);
          
          const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, testData);
          console.log('Processed content length:', htmlContent.length);
          
          const result = await emailService.sendEmail({
            to: { userId: user._id, email: user.email },
            subject,
            htmlContent,
            automationId: automation._id
          });
          
          console.log('Send result:', result);
          
        } catch (error) {
          console.error('Error processing templates or sending:', error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugAutomationEmails();