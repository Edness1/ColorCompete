const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Challenge = require('../models/Challenge');

class BadgeService {
  
  // Initialize default badges in the database
  static async initializeDefaultBadges() {
    const defaultBadges = [
      {
        name: "First Win",
        description: "Awarded for your first contest victory",
        icon: "Medal",
        iconColor: "text-yellow-500",
        type: "win",
        criteria: {
          type: "wins",
          threshold: 1,
          timeframe: "all_time"
        }
      },
      {
        name: "Hat Trick",
        description: "Win 3 contests in a row",
        icon: "Trophy",
        iconColor: "text-gold-500",
        type: "win",
        criteria: {
          type: "consecutive_wins",
          threshold: 3,
          timeframe: "consecutive"
        }
      },
      {
        name: "People's Choice",
        description: "Receive the most community votes",
        icon: "Star",
        iconColor: "text-blue-500",
        type: "achievement",
        criteria: {
          type: "top_votes",
          threshold: 1,
          timeframe: "all_time"
        }
      },
      {
        name: "Consistency King",
        description: "Submit to 30 consecutive daily contests",
        icon: "Award",
        iconColor: "text-green-500",
        type: "participation",
        criteria: {
          type: "submission_streak",
          threshold: 30,
          timeframe: "consecutive"
        }
      },
      {
        name: "Master Artist",
        description: "Win 10 total contests",
        icon: "Crown",
        iconColor: "text-purple-500",
        type: "milestone",
        criteria: {
          type: "wins",
          threshold: 10,
          timeframe: "all_time"
        }
      },
      {
        name: "Community Favorite",
        description: "Accumulate 1000 total votes",
        icon: "Sparkles",
        iconColor: "text-pink-500",
        type: "milestone",
        criteria: {
          type: "total_votes",
          threshold: 1000,
          timeframe: "all_time"
        }
      }
    ];

    for (const badgeData of defaultBadges) {
      const existingBadge = await Badge.findOne({ name: badgeData.name });
      if (!existingBadge) {
        await Badge.create(badgeData);
        console.log(`Created badge: ${badgeData.name}`);
      }
    }
  }

  // Check and award badges for a user after a submission or contest end
  static async checkAndAwardBadges(userId, eventType = 'submission', metadata = {}) {
    try {
      const badges = await Badge.find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] });
      const userStats = await this.getUserStats(userId);
      
      for (const badge of badges) {
        const hasAlreadyEarned = await UserBadge.findOne({ userId, badgeId: badge._id });
        if (hasAlreadyEarned) continue;

        const shouldAward = await this.checkBadgeCriteria(badge, userStats, metadata);
        if (shouldAward) {
          await this.awardBadge(userId, badge._id, metadata);
          console.log(`Awarded badge "${badge.name}" to user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
    }
  }

  // Get user statistics for badge checking
  static async getUserStats(userId) {
    try {
      // Get all user submissions
      const submissions = await Submission.find({ user_id: userId }).sort({ created_at: 1 });
      
      // Get contest wins and calculate stats
      let totalWins = 0;
      let consecutiveWins = 0;
      let maxConsecutiveWins = 0;
      let totalVotes = 0;
      let mostVotesInSingleContest = 0;
      let hasWonMostVotes = false;

      // Calculate total votes and wins from submissions
      for (const submission of submissions) {
        const votes = Array.isArray(submission.votes) ? submission.votes.length : (submission.votes || 0);
        totalVotes += votes;
        mostVotesInSingleContest = Math.max(mostVotesInSingleContest, votes);
        
        // Check if this submission won
        if (submission.isWinner === true) {
          totalWins++;
          consecutiveWins++;
          maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
          hasWonMostVotes = true; // If marked as winner, they had most votes
        } else {
          consecutiveWins = 0;
        }
      }

      // Calculate consecutive submissions
      let consecutiveSubmissions = 0;
      let maxConsecutiveSubmissions = 0;
      const submissionDates = submissions.map(s => new Date(s.created_at).toDateString());
      const uniqueDates = [...new Set(submissionDates)].sort();
      
      // Check for consecutive days
      let currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          maxConsecutiveSubmissions = Math.max(maxConsecutiveSubmissions, currentStreak);
          currentStreak = 1;
        }
      }
      maxConsecutiveSubmissions = Math.max(maxConsecutiveSubmissions, currentStreak);

      return {
        totalSubmissions: submissions.length,
        totalWins,
        consecutiveWins: maxConsecutiveWins,
        totalVotes,
        consecutiveSubmissions: maxConsecutiveSubmissions,
        mostVotesInSingleContest,
        hasWonMostVotes
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalSubmissions: 0,
        totalWins: 0,
        consecutiveWins: 0,
        totalVotes: 0,
        consecutiveSubmissions: 0,
        mostVotesInSingleContest: 0,
        hasWonMostVotes: false
      };
    }
  }

  // Check if badge criteria is met
  static async checkBadgeCriteria(badge, userStats, metadata = {}) {
    const { criteria } = badge;
    
    let result = false;
    switch (criteria.type) {
      case 'wins':
        result = userStats.totalWins >= criteria.threshold;
        break;
      
      case 'consecutive_wins':
        result = userStats.consecutiveWins >= criteria.threshold;
        break;
      
      case 'votes':
      case 'total_votes':
        result = userStats.totalVotes >= criteria.threshold;
        break;
        
      case 'top_votes':
        // For People's Choice - user won most votes in a contest
        result = userStats.hasWonMostVotes;
        break;
      
      case 'submissions':
        result = userStats.totalSubmissions >= criteria.threshold;
        break;
      
      case 'consecutive_submissions':
      case 'submission_streak':
        result = userStats.consecutiveSubmissions >= criteria.threshold;
        break;
      
      default:
        console.log(`Unknown criteria type: ${criteria.type}`);
        result = false;
    }
    
    return result;
  }

  // Award a badge to a user
  static async awardBadge(userId, badgeId, metadata = {}) {
    try {
      const userBadge = new UserBadge({
        userId,
        badgeId,
        metadata
      });
      
      await userBadge.save();
      
      // Add to user's badges array
      await User.findByIdAndUpdate(userId, {
        $addToSet: { badges: userBadge._id }
      });
      
      return userBadge;
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  // Get all badges earned by a user
  static async getUserBadges(userId) {
    try {
      const userBadges = await UserBadge.find({ userId })
        .populate('badgeId')
        .sort({ earnedAt: -1 });
      
      return userBadges
        .filter(ub => ub.badgeId) // Filter out null badge references
        .map(ub => ({
          id: ub.badgeId._id,
          name: ub.badgeId.name,
          description: ub.badgeId.description,
          icon: ub.badgeId.icon,
          iconColor: ub.badgeId.iconColor,
          type: ub.badgeId.type,
          earnedAt: ub.earnedAt,
          isVisible: ub.isVisible,
          metadata: ub.metadata
        }));
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }
}

module.exports = BadgeService;
