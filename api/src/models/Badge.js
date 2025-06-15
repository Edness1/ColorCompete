const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  label: { type: String, required: true }
});

module.exports = mongoose.model('Badge', BadgeSchema);