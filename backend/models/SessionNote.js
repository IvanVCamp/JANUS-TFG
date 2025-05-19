// backend/models/SessionNote.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionNoteSchema = new Schema({
  patient:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  therapist:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionDate:{ type: Date, default: Date.now },
  content:    { type: String, required: true },
}, {
  timestamps: true // createdAt, updatedAt
});

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
