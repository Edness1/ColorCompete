require('dotenv').config();
const mongoose = require('mongoose');
const EmailAutomation = require('../models/EmailAutomation');
const User = require('../models/User');
const emailService = require('../services/emailService');

async function compareSends() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const user = await User.findOne({ email: 'wizcomputer03@gmail.com' });
    if (!user) {
      console.log('User wizcomputer03@gmail.com not found in DB');
      return;
    }
    
    console.log('Found user:', user.email, user.firstName);
    
    // Test 1: Direct send (this worked)
    console.log('\n--- Test 1: Direct Send (should work) ---');
    const directResult = await emailService.sendEmail({
      to: { userId: user._id, email: user.email },
      subject: 'Direct Test Email',
      htmlContent: '<p>This is a direct test email.</p>'
    });
    console.log('Direct result:', directResult);
    
    // Test 2: Automation-style send
    console.log('\n--- Test 2: Automation-style Send ---');
    const automation = await EmailAutomation.findOne();
    console.log('Using automation:', automation.name);
    
    const testData = {
      challenge_title: 'Test Contest Title',
      user_name: user.firstName || user.username || 'ColorCompeter',
      unsubscribeUrl: `http://localhost:5173/unsubscribe?userId=${user._id}`
    };
    
    const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, testData);
    const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, testData);
    
    console.log('Template processed subject:', subject);
    console.log('Template HTML preview:', htmlContent.substring(0, 100) + '...');
    
    const automationResult = await emailService.sendEmail({
      to: { userId: user._id, email: user.email },
      subject,
      htmlContent,
      automationId: automation._id
    });
    console.log('Automation result:', automationResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

compareSends();