// models/Invitation.js
const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', InvitationSchema);
