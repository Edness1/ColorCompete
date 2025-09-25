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
const monthlyDrawingRoutes = require('./routes/monthlyDrawing');
const dbConfig = require('./config/db');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const lineArtRoutes = require('./routes/lineArtRoutes');
const emailAutomationService = require('./services/emailAutomationService');
const BadgeService = require('./services/badgeService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
dbConfig();

// Initialize badges after database connection
setTimeout(async () => {
  try {
    await BadgeService.initializeDefaultBadges();
    console.log('Default badges initialized');
  } catch (error) {
    console.error('Error initializing badges:', error);
  }
}, 2000); // Wait 2 seconds for DB connection

// Routes
app.use('/api/challenges', challengeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/monthly-drawings', monthlyDrawingRoutes);
app.use('/api/line-art', lineArtRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});