const cron = require('node-cron');
const EmailAutomation = require('../models/EmailAutomation');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Submission = require('../models/Submission');
const Challenge = require('../models/Challenge');
const MonthlyDrawing = require('../models/MonthlyDrawing');
const emailService = require('./emailService');
const tremendousService = require('./tremendousService');

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
      const existing = this.scheduledJobs.get(jobKey);
      if (existing && typeof existing.stop === 'function') existing.stop();
      this.scheduledJobs.delete(jobKey);
    }

    // Validate schedule data
    if (!automation.schedule) {
      console.log(`No schedule data for automation: ${automation.name}`);
      return;
    }

    let cronExpression;
    
    switch (automation.triggerType) {
      case 'contest_announcement':
        // Run daily at specified time
        if (!automation.schedule.time) {
          console.error(`Missing schedule time for contest_announcement automation: ${automation.name}`);
          return;
        }
        try {
          const [hour, minute] = automation.schedule.time.split(':');
          cronExpression = `${minute} ${hour} * * *`;
        } catch (error) {
          console.error(`Invalid time format for automation ${automation.name}:`, automation.schedule.time);
          return;
        }
        break;
      case 'voting_results':
        // Run daily at specified time
        if (!automation.schedule.time) {
          console.error(`Missing schedule time for voting_results automation: ${automation.name}`);
          return;
        }
        try {
          const [hour, minute] = automation.schedule.time.split(':');
          cronExpression = `${minute} ${hour} * * *`;
        } catch (error) {
          console.error(`Invalid time format for automation ${automation.name}:`, automation.schedule.time);
          return;
        }
        break;
      case 'weekly_summary':
        // Run weekly on specified day at specified time
        if (!automation.schedule.time) {
          console.error(`Missing schedule time for weekly_summary automation: ${automation.name}`);
          return;
        }
        try {
          const [wHour, wMinute] = automation.schedule.time.split(':');
          const dayOfWeek = automation.schedule.dayOfWeek || 0; // Default to Sunday
          cronExpression = `${wMinute} ${wHour} * * ${dayOfWeek}`;
        } catch (error) {
          console.error(`Invalid time format for automation ${automation.name}:`, automation.schedule.time);
          return;
        }
        break;
      case 'monthly_drawing_lite':
      case 'monthly_drawing_pro':
      case 'monthly_drawing_champ':
        // Run monthly on specified day at specified time
        if (!automation.schedule.time || !automation.monthlyDrawingSettings?.drawingDate) {
          console.error(`Missing schedule time or drawing date for monthly drawing automation: ${automation.name}`);
          return;
        }
        try {
          const [mHour, mMinute] = automation.schedule.time.split(':');
          const dayOfMonth = automation.monthlyDrawingSettings.drawingDate;
          cronExpression = `${mMinute} ${mHour} ${dayOfMonth} * *`;
        } catch (error) {
          console.error(`Invalid time format for automation ${automation.name}:`, automation.schedule.time);
          return;
        }
        break;
      case 'admin_broadcast':
        // Event-based only; no cron scheduling
        console.log('Admin broadcast is event-based; no schedule created');
        return;
      default:
        console.log(`Unknown or event-based automation type: ${automation.triggerType}`);
        return; // Event-based automations don't need cron jobs
    }

    if (cronExpression) {
      try {
        const job = cron.schedule(cronExpression, () => {
          this.executeAutomation(automation);
        }, {
          scheduled: false,
          timezone: automation.schedule.timezone || 'America/New_York'
        });

        job.start();
        this.scheduledJobs.set(jobKey, job);
        
        console.log(`Scheduled automation: ${automation.name} with cron: ${cronExpression} (timezone: ${automation.schedule.timezone || 'America/New_York'})`);
      } catch (error) {
        console.error(`Failed to schedule automation ${automation.name}:`, error);
      }
    }
  }

  async executeAutomation(automation) {
    try {
      console.log(`Executing automation: ${automation.name}`);
      
      switch (automation.triggerType) {
        case 'contest_announcement':
          await this.sendContestAnnouncementEmail(automation);
          break;
        case 'voting_results':
          await this.sendVotingResultsEmail(automation);
          break;
        case 'weekly_summary':
          await this.sendWeeklySummaryEmail(automation);
          break;
        case 'monthly_drawing_lite':
          await this.runMonthlyDrawing(automation, 'lite');
          break;
        case 'monthly_drawing_pro':
          await this.runMonthlyDrawing(automation, 'pro');
          break;
        case 'monthly_drawing_champ':
          await this.runMonthlyDrawing(automation, 'champ');
          break;
        default:
          console.error(`Unknown automation type: ${automation.triggerType}`);
          return;
      }

      // Update last triggered time
      automation.lastTriggered = new Date();
      await automation.save();
      
    } catch (error) {
      console.error(`Error executing automation ${automation.name}:`, error);
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

        // Get user's wins this week (submissions that won contests)
        const userWins = await Submission.find({
          user: user._id,
          createdAt: { $gte: lastWeek, $lte: today },
          isWinner: true
        }).countDocuments();

        // Get all user's votes across all submissions (not just this week)
        const allUserSubmissions = await Submission.find({ user: user._id });
        const totalVotes = allUserSubmissions.reduce((total, submission) => total + (submission.votes || 0), 0);

        // Get platform stats
        const activeContests = await Challenge.countDocuments({
          isActive: true
        });

        const newMembersCount = await User.countDocuments({
          createdAt: { $gte: lastWeek, $lte: today }
        });

        const totalSubmissionsThisWeek = await Submission.countDocuments({
          createdAt: { $gte: lastWeek, $lte: today }
        });

        const templateData = {
          user_name: user.firstName || user.username,
          user_submissions_count: userSubmissions.length,
          user_wins_count: userWins,
          user_total_votes: totalVotes,
          active_contests: activeContests,
          new_members: newMembersCount,
          total_submissions: totalSubmissionsThisWeek,
          dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?userId=${user._id}`
        };

        const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, templateData);
        const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, templateData);

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
          const j = this.scheduledJobs.get(jobKey);
          if (j && typeof j.stop === 'function') j.stop();
          this.scheduledJobs.delete(jobKey);
        }
      }
    } catch (error) {
      console.error('Error updating automation:', error);
    }
  }

  // Stop all automations
  stopAllAutomations() {
    this.scheduledJobs.forEach((job) => {
      if (job && typeof job.stop === 'function') job.stop();
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

        const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, userTemplateData);
        const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, userTemplateData);

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

        const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, userTemplateData);
        const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, userTemplateData);

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

      const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, templateData);
      const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, templateData);

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

  // Send contest announcement email (called by cron scheduler)
  async sendContestAnnouncementEmail(automation) {
    try {
      // This method would be triggered by cron scheduler to announce new contests
      // For now, just log since contests are announced when created via the other method
      console.log('Contest announcement automation triggered - checking for new contests to announce');
      
      // Get contests created in the last day
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentContests = await Challenge.find({
        createdAt: { $gte: yesterday },
        isActive: true
      });

      for (const contest of recentContests) {
        await this.sendContestAnnouncement({
          _id: contest._id,
          title: contest.title,
          description: contest.description,
          prize: contest.prize,
          deadline: contest.endDate,
          votingPeriod: contest.votingEndDate
        });
      }
      
    } catch (error) {
      console.error('Error in contest announcement email automation:', error);
    }
  }

  // Send voting results email (called by cron scheduler)
  async sendVotingResultsEmail(automation) {
    try {
      console.log('Voting results automation triggered - checking for contests with results to announce');
      
      // Get contests that ended in the last day and have winners
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const contestsWithResults = await Challenge.find({
        votingEndDate: { $gte: yesterday, $lte: new Date() },
        isActive: false, // Contest has ended
        winners: { $exists: true, $ne: [] }
      }).populate('winners.user');

      for (const contest of contestsWithResults) {
        if (contest.winners && contest.winners.length > 0) {
          await this.sendVotingResults(contest, contest.winners);
        }
      }
      
    } catch (error) {
      console.error('Error in voting results email automation:', error);
    }
  }

  // Run monthly drawing for specified tier
  async runMonthlyDrawing(automation, tier) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = now.getFullYear();

      console.log(`Running monthly drawing for ${tier} tier - ${currentMonth}/${currentYear}`);

      // Check if drawing already exists for this month/year/tier
      const existingDrawing = await MonthlyDrawing.findOne({
        month: currentMonth,
        year: currentYear,
        subscriptionTier: tier,
        isCompleted: true
      });

      if (existingDrawing) {
        console.log(`Monthly drawing for ${tier} tier already completed for ${currentMonth}/${currentYear}`);
        return;
      }

      // Get all active subscribers for this tier
      // First get current active subscriptions for this tier and month/year
      const activeSubscriptions = await Subscription.find({
        tier: tier,
        month: currentMonth,
        year: currentYear,
        remaining_submissions: { $gt: 0 } // Only include active subscriptions
      });

      if (activeSubscriptions.length === 0) {
        console.log(`No active subscriptions found for ${tier} tier in ${currentMonth}/${currentYear}`);
        return;
      }

      // Get user details for participants
      const userIds = activeSubscriptions.map(sub => sub.userId);
      const participants = await User.find({
        _id: { $in: userIds },
        email: { $exists: true, $ne: '' },
        'emailPreferences.rewardNotifications': { $ne: false }
      });

      if (participants.length === 0) {
        console.log(`No participants found for ${tier} tier monthly drawing`);
        return;
      }

      // Select random winner
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];

      // Determine prize amount based on tier
      const prizeAmounts = { lite: 25, pro: 50, champ: 100 };
      const prizeAmount = automation.monthlyDrawingSettings?.prizeAmount || prizeAmounts[tier];

      // Create or update the monthly drawing record
      let monthlyDrawing = await MonthlyDrawing.findOne({
        month: currentMonth,
        year: currentYear,
        subscriptionTier: tier
      });

      if (!monthlyDrawing) {
        monthlyDrawing = new MonthlyDrawing({
          month: currentMonth,
          year: currentYear,
          subscriptionTier: tier,
          prizeAmount,
          drawingDate: now,
          automationId: automation._id,
          participants: participants.map(p => ({
            userId: p._id,
            email: p.email,
            name: `${p.firstName} ${p.lastName}`
          }))
        });
      }

      // Set the winner
      monthlyDrawing.winner = {
        userId: winner._id,
        email: winner.email,
        name: `${winner.firstName} ${winner.lastName}`
      };

      // Send gift card via Tremendous
      const giftCardResult = await tremendousService.sendGiftCard({
        recipientEmail: winner.email,
        recipientName: `${winner.firstName} ${winner.lastName}`,
        amount: prizeAmount,
        message: `Congratulations! You've won $${prizeAmount} in the ColorCompete ${tier.charAt(0).toUpperCase() + tier.slice(1)} monthly drawing!`
      });

      if (giftCardResult.success) {
        // Update drawing with gift card details
        monthlyDrawing.giftCardDetails = {
          giftCardId: giftCardResult.giftCardId,
          giftCardCode: giftCardResult.giftCardCode,
          redeemUrl: giftCardResult.redeemUrl,
          sentAt: new Date()
        };
        monthlyDrawing.isCompleted = true;

        await monthlyDrawing.save();

        // Send winner notification email
        await this.sendMonthlyDrawingWinnerEmail(automation, winner, tier, prizeAmount, giftCardResult);

        // Send participant notification emails (non-winners)
        await this.sendMonthlyDrawingParticipantEmails(automation, participants, winner, tier, prizeAmount);

        automation.totalSent += participants.length;
        automation.lastTriggered = new Date();
        await automation.save();

        console.log(`Monthly drawing completed for ${tier} tier. Winner: ${winner.email}, Prize: $${prizeAmount}`);
      } else {
        console.error(`Failed to send gift card for ${tier} monthly drawing:`, giftCardResult.error);
        monthlyDrawing.isCompleted = false;
        await monthlyDrawing.save();
      }

    } catch (error) {
      console.error(`Error running monthly drawing for ${tier} tier:`, error);
    }
  }

  // Send winner notification email
  async sendMonthlyDrawingWinnerEmail(automation, winner, tier, prizeAmount, giftCardResult) {
    try {
      const templateData = {
        winner_name: winner.firstName || winner.username,
        tier_name: tier.charAt(0).toUpperCase() + tier.slice(1),
        prize_amount: prizeAmount,
        gift_card_code: giftCardResult.giftCardCode,
        redeem_url: giftCardResult.redeemUrl,
        month_year: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
        unsubscribe_url: `${process.env.FRONTEND_URL}/unsubscribe?userId=${winner._id}`,
        website_url: process.env.FRONTEND_URL
      };

      const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, templateData);
      const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, templateData);

      await emailService.sendEmail({
        to: { userId: winner._id, email: winner.email },
        subject,
        htmlContent,
        automationId: automation._id
      });

      console.log(`Sent monthly drawing winner email to ${winner.email}`);
    } catch (error) {
      console.error('Error sending monthly drawing winner email:', error);
    }
  }

  // Send participant notification emails (for non-winners)
  async sendMonthlyDrawingParticipantEmails(automation, participants, winner, tier, prizeAmount) {
    try {
      // Find automation for participant notifications (different template)
      const participantAutomation = await EmailAutomation.findOne({
        triggerType: `monthly_drawing_${tier}_participant`,
        isActive: true
      });

      if (!participantAutomation) {
        console.log(`No participant notification automation found for ${tier} tier`);
        return;
      }

      const nonWinners = participants.filter(p => p._id.toString() !== winner._id.toString());
      
      for (const participant of nonWinners) {
        const templateData = {
          participant_name: participant.firstName || participant.username,
          tier_name: tier.charAt(0).toUpperCase() + tier.slice(1),
          winner_name: winner.firstName || winner.username,
          prize_amount: prizeAmount,
          month_year: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          total_participants: participants.length,
          dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
          unsubscribe_url: `${process.env.FRONTEND_URL}/unsubscribe?userId=${participant._id}`,
          website_url: process.env.FRONTEND_URL
        };

        const subject = emailService.replaceTemplateVariables(participantAutomation.emailTemplate.subject, templateData);
        const htmlContent = emailService.replaceTemplateVariables(participantAutomation.emailTemplate.htmlContent, templateData);

        await emailService.sendEmail({
          to: { userId: participant._id, email: participant.email },
          subject,
          htmlContent,
          automationId: participantAutomation._id
        });

        // Add delay to respect rate limits
        await this.delay(100);
      }

      console.log(`Sent monthly drawing participant emails to ${nonWinners.length} non-winners`);
    } catch (error) {
      console.error('Error sending monthly drawing participant emails:', error);
    }
  }

  // Helper method to add delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
