const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialist',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  coverLetter: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
});

// Compound index to prevent duplicate applications
ApplicationSchema.index({ jobId: 1, specialistId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);