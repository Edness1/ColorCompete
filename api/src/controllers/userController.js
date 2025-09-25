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

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset link containing the token
    // e.g., https://yourdomain.com/reset-password/${token}

    res.json({ message: 'Password reset link sent' });
  } catch (error) {
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
    const totalSubmissions = await Submission.countDocuments({ user_id });
    // Count wins
    const winCount = await Submission.countDocuments({ user_id, isWinner: true });

    // Distinct contests (schema uses challenge_id)
    const contestsParticipated = await Submission.distinct("challenge_id", { user_id }).then(arr => arr.length);

    // Aggregate total votes across user's submissions (votes is an array on each submission)
    const voteAggregation = await Submission.aggregate([
      { $match: { user_id: typeof user_id === 'string' ? new (require('mongoose').Types.ObjectId)(user_id) : user_id } },
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