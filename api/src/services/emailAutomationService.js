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
      case 'weekly_summary':
        // Run weekly on Monday at specified time
        const [wHour, wMinute] = automation.schedule.time.split(':');
        cronExpression = `${wMinute} ${wHour} * * 1`; // Monday = 1
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
      
      switch (automation.triggerType) {      case 'daily_winner':
        await this.sendDailyWinnerEmail(automation);
        break;
      case 'monthly_winner':
        await this.sendMonthlyWinnerEmail(automation);
        break;
      case 'weekly_summary':
        await this.sendWeeklySummaryEmail(automation);
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

  // Send weekly summary email
  async sendWeeklySummaryEmail(automation) {
    try {
      // Get date range for last week
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get all active users
      const users = await User.find({ 
        email: { $exists: true, $ne: '' }
      });

      for (const user of users) {
        // Get user's submissions from last week
        const userSubmissions = await Submission.find({
          user: user._id,
          createdAt: { $gte: lastWeek, $lte: today }
        }).populate('challenge');

        // Get votes received on user's submissions
        const votesReceived = userSubmissions.reduce((total, submission) => total + (submission.votes || 0), 0);

        // Get comments received (this would need a Comment model)
        const commentsReceived = 0; // Placeholder

        // Get user's current ranking (placeholder)
        const rankingPosition = Math.floor(Math.random() * 1000) + 1;

        // Get platform stats
        const newContestsCount = await Challenge.countDocuments({
          createdAt: { $gte: lastWeek, $lte: today }
        });

        const newMembersCount = await User.countDocuments({
          createdAt: { $gte: lastWeek, $lte: today }
        });

        const templateData = {
          userName: user.firstName || user.username,
          weekRange: `${lastWeek.toLocaleDateString()} - ${today.toLocaleDateString()}`,
          submissionsThisWeek: userSubmissions.length,
          votesReceived,
          commentsReceived,
          rankingPosition,
          newContestsCount,
          newMembersCount,
          topPrizeThisWeek: '$100',
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?userId=${user._id}`,
          websiteUrl: process.env.FRONTEND_URL
        };

        const subject = this.replaceTemplateVariables(automation.emailTemplate.subject, templateData);
        const htmlContent = this.replaceTemplateVariables(automation.emailTemplate.htmlContent, templateData);

        await emailService.sendEmail({
          to: { userId: user._id, email: user.email },
          subject,
          htmlContent,
          automationId: automation._id
        });

        automation.totalSent += 1;
      }

      automation.lastTriggered = new Date();
      await automation.save();
      console.log(`Sent weekly summary emails to ${users.length} users`);
      
    } catch (error) {
      console.error('Error sending weekly summary email:', error);
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

  // Trigger contest announcement email
  async sendContestAnnouncement(contestData) {
    try {
      const automation = await EmailAutomation.findOne({
        triggerType: 'contest_announcement',
        isActive: true
      });

      if (!automation) {
        console.log('No active contest announcement automation found');
        return;
      }

      // Get all active users
      const users = await User.find({ 
        email: { $exists: true, $ne: '' }
      });

      const templateData = {
        contestTitle: contestData.title,
        contestDescription: contestData.description,
        contestPrize: contestData.prize || '$25 Gift Card',
        contestDeadline: contestData.deadline,
        votingPeriod: contestData.votingPeriod,
        contestUrl: `${process.env.FRONTEND_URL}/contests/${contestData._id}`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`,
        websiteUrl: process.env.FRONTEND_URL
      };

      for (const user of users) {
        const userTemplateData = {
          ...templateData,
          userName: user.firstName || user.username,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?userId=${user._id}`
        };

        const subject = this.replaceTemplateVariables(automation.emailTemplate.subject, userTemplateData);
        const htmlContent = this.replaceTemplateVariables(automation.emailTemplate.htmlContent, userTemplateData);

        await emailService.sendEmail({
          to: { userId: user._id, email: user.email },
          subject,
          htmlContent,
          automationId: automation._id
        });

        automation.totalSent += 1;
      }

      automation.lastTriggered = new Date();
      await automation.save();
      console.log(`Sent contest announcement emails to ${users.length} users`);
      
    } catch (error) {
      console.error('Error sending contest announcement:', error);
    }
  }

  // Trigger voting results email
  async sendVotingResults(contestData, winners) {
    try {
      const automation = await EmailAutomation.findOne({
        triggerType: 'voting_results',
        isActive: true
      });

      if (!automation) {
        console.log('No active voting results automation found');
        return;
      }

      // Get all users who participated in this contest
      const participants = await User.find({
        _id: { $in: contestData.participantIds }
      });

      const templateData = {
        contestTitle: contestData.title,
        winners: winners.map((winner, index) => ({
          rank: this.getOrdinalNumber(index + 1),
          winnerName: winner.user.firstName || winner.user.username,
          prize: winner.prize,
          voteCount: winner.votes,
          submissionImage: winner.imageUrl
        })),
        totalSubmissions: contestData.totalSubmissions,
        totalVotes: contestData.totalVotes,
        totalParticipants: participants.length,
        contestUrl: `${process.env.FRONTEND_URL}/contests/${contestData._id}/results`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`,
        websiteUrl: process.env.FRONTEND_URL
      };

      for (const user of participants) {
        const userWinner = winners.find(w => w.user._id.toString() === user._id.toString());
        const userTemplateData = {
          ...templateData,
          userName: user.firstName || user.username,
          isWinner: !!userWinner,
          yourRank: userWinner ? this.getOrdinalNumber(winners.indexOf(userWinner) + 1) : null,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?userId=${user._id}`
        };

        const subject = this.replaceTemplateVariables(automation.emailTemplate.subject, userTemplateData);
        const htmlContent = this.replaceTemplateVariables(automation.emailTemplate.htmlContent, userTemplateData);

        await emailService.sendEmail({
          to: { userId: user._id, email: user.email },
          subject,
          htmlContent,
          automationId: automation._id
        });

        automation.totalSent += 1;
      }

      automation.lastTriggered = new Date();
      await automation.save();
      console.log(`Sent voting results emails to ${participants.length} participants`);
      
    } catch (error) {
      console.error('Error sending voting results:', error);
    }
  }

  // Trigger comment notification email
  async sendCommentNotification(commentData) {
    try {
      const automation = await EmailAutomation.findOne({
        triggerType: 'comment_feedback',
        isActive: true
      });

      if (!automation) {
        console.log('No active comment feedback automation found');
        return;
      }

      const submission = await Submission.findById(commentData.submissionId)
        .populate('user')
        .populate('challenge');

      if (!submission || !submission.user.email) {
        console.log('Submission or user email not found');
        return;
      }

      const commenter = await User.findById(commentData.commenterId);

      const templateData = {
        userName: submission.user.firstName || submission.user.username,
        submissionTitle: submission.title || 'Your Submission',
        contestTitle: submission.challenge.title,
        commenterName: commenter.firstName || commenter.username,
        commentText: commentData.text,
        commentDate: new Date().toLocaleDateString(),
        submissionImage: submission.imageUrl,
        submissionUrl: `${process.env.FRONTEND_URL}/submissions/${submission._id}`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?userId=${submission.user._id}`,
        websiteUrl: process.env.FRONTEND_URL
      };

      const subject = this.replaceTemplateVariables(automation.emailTemplate.subject, templateData);
      const htmlContent = this.replaceTemplateVariables(automation.emailTemplate.htmlContent, templateData);

      await emailService.sendEmail({
        to: { userId: submission.user._id, email: submission.user.email },
        subject,
        htmlContent,
        automationId: automation._id
      });

      automation.totalSent += 1;
      automation.lastTriggered = new Date();
      await automation.save();
      console.log(`Sent comment notification to ${submission.user.email}`);
      
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }
  }

  // Helper method to replace template variables
  replaceTemplateVariables(template, data) {
    let result = template;
    
    // Handle simple variables like {{userName}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }

    // Handle array loops like {{#winners}}...{{/winners}}
    result = result.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, arrayName, content) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = content;
        for (const [key, value] of Object.entries(item)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          itemContent = itemContent.replace(regex, value || '');
        }
        return itemContent;
      }).join('');
    });

    // Handle conditional blocks like {{#isWinner}}...{{/isWinner}}
    result = result.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, conditionName, content) => {
      return data[conditionName] ? content : '';
    });

    // Handle negative conditional blocks like {{^isWinner}}...{{/isWinner}}
    result = result.replace(/{{\\^(\w+)}}(.*?){{\/\1}}/gs, (match, conditionName, content) => {
      return !data[conditionName] ? content : '';
    });

    return result;
  }

  // Helper method to get ordinal numbers (1st, 2nd, 3rd, etc.)
  getOrdinalNumber(num) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }
}

module.exports = new EmailAutomationService();
