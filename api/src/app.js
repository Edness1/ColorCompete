require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const challengeRoutes = require('./routes/challengeRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const userRoutes = require('./routes/userRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const emailRoutes = require('./routes/emailRoutes');
const dbConfig = require('./config/db');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const emailAutomationService = require('./services/emailAutomationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
dbConfig();

// Routes
app.use('/api/challenges', challengeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/email', emailRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});