const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const emailService = require('../services/emailService');

function waitForConnection() {
  return new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('open', resolve);
    mongoose.connection.once('error', reject);
  });
}

async function main() {
  const recipient = process.argv[2] || 'wizcomputer03@gmail.com';
  const subject = 'ColorCompete Test Email';
  const html = '<p>This is a simple test email from ColorCompete API.</p>';

  try {
    await connectDB();
    await waitForConnection();

    const fakeUserId = new mongoose.Types.ObjectId();
    const result = await emailService.sendEmail({
      to: { userId: fakeUserId, email: recipient },
      subject,
      htmlContent: html,
    });

    console.log('Send result:', result);
  } catch (err) {
    console.error('Test send failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

main();
