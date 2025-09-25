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
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
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
    // Optionally, generate a JWT token here for session management
    res.status(200).json({ message: 'Login successful', user });
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