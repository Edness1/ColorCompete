const cron = require('node-cron');
const EmailAutomation = require('../models/EmailAutomation');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Challenge = require('../models/Challenge');
const emailService = require('./emailService');

class EmailAutomationService {
  constructor() {
    this.scheduledJobs = new Map();
    this.initializeAutomations();
  }

  async initializeAutomations() {
    try {
      const automations = await EmailAutomation.find({ isActive: true });
      
      for (const automation of automations) {
        this.scheduleAutomation(automation);
      }
      
      console.log(`Initialized ${automations.length} email automations`);
    } catch (error) {
      console.error('Error initializing email automations:', error);
    }
  }

  scheduleAutomation(automation) {
    const jobKey = automation._id.toString();
    
    // Cancel existing job if it exists
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).destroy();
    }

    let cronExpression;
    
    switch (automation.triggerType) {
      case 'daily_winner':
        // Run daily at specified time
        const [hour, minute] = automation.schedule.time.split(':');
        cronExpression = `${minute} ${hour} * * *`;
        break;
      case 'monthly_winner':
        // Run on specified day of month at specified time
        const [mHour, mMinute] = automation.schedule.time.split(':');
        cronExpression = `${mMinute} ${mHour} ${automation.schedule.dayOfMonth} * *`;
        break;
      default:
        return; // Event-based automations don't need cron jobs
    }

    if (cronExpression) {
      const job = cron.schedule(cronExpression, () => {
        this.executeAutomation(automation);
      }, {
        scheduled: false,
        timezone: automation.schedule.timezone
      });

      job.start();
      this.scheduledJobs.set(jobKey, job);
      
      console.log(`Scheduled automation: ${automation.name} with cron: ${cronExpression}`);
    }
  }

  async executeAutomation(automation) {
    try {
      console.log(`Executing automation: ${automation.name}`);
      
      switch (automation.triggerType) {
        case 'daily_winner':
          await this.sendDailyWinnerEmail(automation);
          break;
        case 'monthly_winner':
          await this.sendMonthlyWinnerEmail(automation);
          break;
        default:
          console.log(`Unknown automation trigger type: ${automation.triggerType}`);
      }

      // Update last triggered time
      automation.lastTriggered = new Date();
      await automation.save();
      
    } catch (error) {
      console.error(`Error executing automation ${automation.name}:`, error);
    }
  }

  async sendDailyWinnerEmail(automation) {
    try {
      // Get yesterday's winner
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // Find the winning submission from yesterday
      const winningSubmission = await Submission.findOne({
        createdAt: { $gte: yesterday, $lte: endOfYesterday },
        // Add your winning criteria here (highest votes, etc.)
      }).populate('user').populate('challenge').sort({ votes: -1 });

      if (!winningSubmission) {
        console.log('No winning submission found for yesterday');
        return;
      }

      // Get all active users
      const users = await User.find({ 
        email: { $exists: true, $ne: '' }
      });

      const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, {
        winner_name: winningSubmission.user.firstName,
        date: yesterday.toLocaleDateString()
      });

      const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, {
        winner_name: winningSubmission.user.firstName,
        winner_username: winningSubmission.user.username,
        challenge_title: winningSubmission.challenge.title,
        submission_image: winningSubmission.imageUrl,
        date: yesterday.toLocaleDateString()
      });

      // Send emails to all users
      for (const user of users) {
        await emailService.sendEmail({
          to: { userId: user._id, email: user.email },
          subject,
          htmlContent,
          automationId: automation._id
        });
        
        automation.totalSent += 1;
      }

      await automation.save();
      console.log(`Sent daily winner emails to ${users.length} users`);
      
    } catch (error) {
      console.error('Error sending daily winner email:', error);
    }
  }

  async sendMonthlyWinnerEmail(automation) {
    try {
      // Get last month's date range
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);

      // Find the winning submission from last month
      const winningSubmission = await Submission.findOne({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }).populate('user').populate('challenge').sort({ votes: -1 });

      if (!winningSubmission) {
        console.log('No winning submission found for last month');
        return;
      }

      // Get all active users
      const users = await User.find({ 
        email: { $exists: true, $ne: '' }
      });

      const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, {
        winner_name: winningSubmission.user.firstName,
        month: lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });

      const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, {
        winner_name: winningSubmission.user.firstName,
        winner_username: winningSubmission.user.username,
        challenge_title: winningSubmission.challenge.title,
        submission_image: winningSubmission.imageUrl,
        month: lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });

      // Send emails to all users
      for (const user of users) {
        await emailService.sendEmail({
          to: { userId: user._id, email: user.email },
          subject,
          htmlContent,
          automationId: automation._id
        });
        
        automation.totalSent += 1;
      }

      await automation.save();
      console.log(`Sent monthly winner emails to ${users.length} users`);
      
    } catch (error) {
      console.error('Error sending monthly winner email:', error);
    }
  }

  // Trigger winner reward (called when a contest ends)
  async sendWinnerReward(winnerUserId, challengeTitle, submissionImage) {
    try {
      const automation = await EmailAutomation.findOne({
        triggerType: 'winner_reward',
        isActive: true
      });

      if (!automation) {
        console.log('No active winner reward automation found');
        return;
      }

      const winner = await User.findById(winnerUserId);
      if (!winner) {
        console.log('Winner user not found');
        return;
      }

      // Send gift card
      const giftCardResult = await emailService.sendGiftCard({
        recipientEmail: winner.email,
        recipientName: `${winner.firstName} ${winner.lastName}`,
        amount: automation.rewardSettings.giftCardAmount,
        message: automation.rewardSettings.giftCardMessage,
        automationId: automation._id
      });

      if (giftCardResult.success) {
        // Send notification email to winner
        const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, {
          winner_name: winner.firstName,
          challenge_title: challengeTitle,
          reward_amount: automation.rewardSettings.giftCardAmount
        });

        const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, {
          winner_name: winner.firstName,
          winner_username: winner.username,
          challenge_title: challengeTitle,
          submission_image: submissionImage,
          reward_amount: automation.rewardSettings.giftCardAmount
        });

        await emailService.sendEmail({
          to: { userId: winner._id, email: winner.email },
          subject,
          htmlContent,
          automationId: automation._id
        });

        automation.totalSent += 1;
        automation.lastTriggered = new Date();
        await automation.save();

        console.log(`Sent winner reward to ${winner.email}: $${automation.rewardSettings.giftCardAmount} gift card`);
      } else {
        console.error('Failed to send gift card:', giftCardResult.error);
      }
      
    } catch (error) {
      console.error('Error sending winner reward:', error);
    }
  }

  // Update automation schedule
  async updateAutomation(automationId) {
    try {
      const automation = await EmailAutomation.findById(automationId);
      
      if (automation && automation.isActive) {
        this.scheduleAutomation(automation);
      } else {
        // Remove from scheduled jobs if deactivated
        const jobKey = automationId.toString();
        if (this.scheduledJobs.has(jobKey)) {
          this.scheduledJobs.get(jobKey).destroy();
          this.scheduledJobs.delete(jobKey);
        }
      }
    } catch (error) {
      console.error('Error updating automation:', error);
    }
  }

  // Stop all automations
  stopAllAutomations() {
    this.scheduledJobs.forEach((job, key) => {
      job.destroy();
    });
    this.scheduledJobs.clear();
    console.log('Stopped all email automations');
  }
}

module.exports = new EmailAutomationService();
