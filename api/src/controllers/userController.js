const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Submission = require('../models/Submission');

// Create a new user
exports.createUser = async (req, res) => {
  try {
    // Hash the password before saving the user
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    req.body.emailVerificationToken = emailVerificationToken;
    req.body.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    req.body.emailVerified = false;

    const user = new User(req.body);
    await user.save();

    // Send verification email
    try {
      const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      const verificationLink = `${frontendBase}/verify-email/${emailVerificationToken}`;

      const { subject, html } = emailTemplateService.render('email_verification', {
        verificationLink,
        firstName: user.firstName || user.username || 'there',
        year: new Date().getFullYear()
      });

      await emailService.sendEmail({ 
        to: { email: user.email, userId: user._id }, 
        subject, 
        htmlContent: html 
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Return user without sensitive data
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    
    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: userResponse
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Retrieve all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve a user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password (sends email with token)
const emailService = require('../services/emailService');
const emailTemplateService = require('../services/emailTemplateService');
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    // For security, respond with success even if user not found, but do not send email
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const resetLink = `${frontendBase}/reset-password/${token}`;

    const { subject, html } = emailTemplateService.render('reset_password', {
      resetLink,
      firstName: user.firstName || user.username || 'there'
    });

    await emailService.sendEmail({ to: { email: user.email, userId: user._id }, subject, htmlContent: html });

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now sign in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend Email Verification
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If that email exists, a verification email has been sent' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    try {
      const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      const verificationLink = `${frontendBase}/verify-email/${emailVerificationToken}`;

      const { subject, html } = emailTemplateService.render('email_verification', {
        verificationLink,
        firstName: user.firstName || user.username || 'there',
        year: new Date().getFullYear()
      });

      await emailService.sendEmail({ 
        to: { email: user.email, userId: user._id }, 
        subject, 
        htmlContent: html 
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'If that email exists, a verification email has been sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email address before signing in. Check your inbox for a verification email.',
        emailNotVerified: true
      });
    }
    
    // Return user without sensitive data
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.resetPasswordToken;
    
    res.status(200).json({ message: 'Login successful', user: userResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user stats
exports.getUserStats = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ message: "Missing user_id" });
    }

    // Count total submissions
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: 'Invalid user_id' });
    }
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    const totalSubmissions = await Submission.countDocuments({ user_id: userObjectId });
    const winCount = await Submission.countDocuments({ user_id: userObjectId, isWinner: true });
    const contestsParticipated = await Submission.distinct("challenge_id", { user_id: userObjectId }).then(arr => arr.length);
    const voteAggregation = await Submission.aggregate([
      { $match: { user_id: userObjectId } },
      { $project: { voteCount: { $size: { $ifNull: ["$votes", []] } } } },
      { $group: { _id: null, totalVotes: { $sum: "$voteCount" } } }
    ]).catch(() => []);
    const totalVotes = voteAggregation.length ? voteAggregation[0].totalVotes : 0;

    res.json({
      totalSubmissions,
      winCount,
      contestsParticipated,
      totalVotes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get subscriber statistics for admin dashboard
exports.getSubscriberStats = async (req, res) => {
  try {
    // TODO: Add admin check back after debugging
    // const userId = req.headers['user-id'];
    // if (!userId) {
    //   return res.status(401).json({ message: 'User ID required' });
    // }

    // const requestingUser = await User.findById(userId);
    // if (!requestingUser || !requestingUser.isAdmin) {
    //   return res.status(403).json({ message: 'Admin access required' });
    // }

    // Get all users with subscription data
    const users = await User.find({})
      .select('firstName lastName email createdDate subscription emailPreferences')
      .sort({ createdDate: -1 });

    // Calculate statistics
    const totalUsers = users.length;
    const freeUsers = users.filter(user => !user.subscription?.type || user.subscription.type === 'free').length;
    const liteUsers = users.filter(user => user.subscription?.type === 'lite').length;
    const proUsers = users.filter(user => user.subscription?.type === 'pro').length;
    const champUsers = users.filter(user => user.subscription?.type === 'champ').length;

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users
      .filter(user => new Date(user.createdDate) > thirtyDaysAgo)
      .slice(0, 10);

    // Email preference statistics
    const marketingOptIn = users.filter(user => user.emailPreferences?.marketingEmails).length;
    const contestOptIn = users.filter(user => user.emailPreferences?.contestNotifications).length;
    const winnerOptIn = users.filter(user => user.emailPreferences?.winnerAnnouncements).length;
    const rewardOptIn = users.filter(user => user.emailPreferences?.rewardNotifications).length;

    const stats = {
      totalUsers,
      freeUsers,
      liteUsers,
      proUsers,
      champUsers,
      recentUsers,
      marketingOptIn,
      contestOptIn,
      winnerOptIn,
      rewardOptIn,
      paidSubscribers: liteUsers + proUsers + champUsers,
      growthRate: totalUsers > 0 ? ((recentUsers.length / totalUsers) * 100).toFixed(1) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching subscriber stats:', error);
    res.status(500).json({ message: error.message });
  }
};