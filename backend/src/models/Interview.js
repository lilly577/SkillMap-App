const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialist',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  meetingTitle: {
    type: String,
    required: true
  },
  meetingDescription: {
    type: String,
    default: ''
  },
  meetingLink: {
    type: String,
    default: '' // Will be generated when scheduled
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  createdBy: {
    type: String,
    enum: ['company', 'specialist'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
InterviewSchema.index({ companyId: 1, scheduledDate: 1 });
InterviewSchema.index({ specialistId: 1, scheduledDate: 1 });
InterviewSchema.index({ applicationId: 1 });

module.exports = mongoose.model('Interview', InterviewSchema);