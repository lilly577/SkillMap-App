const express = require('express');
const { auth } = require('../middleware/auth');
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Specialist = require('../models/Specialist');
const Company = require('../models/Company');

const router = express.Router();

// Schedule a new interview
router.post('/schedule', auth, async (req, res) => {
  try {
    const {
      applicationId,
      scheduledDate,
      duration = 30,
      meetingTitle,
      meetingDescription = ''
    } = req.body;

    if (!applicationId || !scheduledDate || !meetingTitle) {
      return res.status(400).json({
        success: false,
        message: 'Application ID, scheduled date, and meeting title are required'
      });
    }

    // Check if application exists and user has access
    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('specialistId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify permissions
    if (req.userType === 'company') {
      if (application.jobId.companyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this application'
        });
      }
    } else if (req.userType === 'specialist') {
      if (application.specialistId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this application'
        });
      }
    }

    // Check for scheduling conflicts
    const conflict = await Interview.findOne({
      $or: [
        { companyId: application.jobId.companyId, scheduledDate: new Date(scheduledDate), status: 'scheduled' },
        { specialistId: application.specialistId._id, scheduledDate: new Date(scheduledDate), status: 'scheduled' }
      ]
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Scheduling conflict: One of the participants already has an interview at this time'
      });
    }

    // Generate meeting link (in a real app, this would integrate with Zoom/Google Meet API)
    const meetingId = Math.random().toString(36).substring(2, 15);
    const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/video/${meetingId}`;

    // Create interview
    const interview = await Interview.create({
      jobId: application.jobId._id,
      applicationId: application._id,
      companyId: application.jobId.companyId,
      specialistId: application.specialistId._id,
      scheduledDate: new Date(scheduledDate),
      duration,
      meetingTitle,
      meetingDescription,
      meetingLink,
      createdBy: req.userType
    });

    // Populate with full details
    await interview.populate([
      { path: 'jobId', select: 'title description' },
      { path: 'companyId', select: 'companyName industry' },
      { path: 'specialistId', select: 'fullName expertise email' }
    ]);

    res.json({
      success: true,
      interview,
      message: 'Interview scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule interview',
      error: error.message
    });
  }
});

// Get interviews for a company
router.get('/company', auth, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const interviews = await Interview.find({ companyId: req.user._id })
      .populate([
        { path: 'jobId', select: 'title description' },
        { path: 'specialistId', select: 'fullName expertise email' },
        { path: 'applicationId', select: 'status' }
      ])
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      interviews
    });
  } catch (error) {
    console.error('Error fetching company interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
});

// Get interviews for a specialist
router.get('/specialist', auth, async (req, res) => {
  try {
    if (req.userType !== 'specialist') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const interviews = await Interview.find({ specialistId: req.user._id })
      .populate([
        { path: 'jobId', select: 'title description' },
        { path: 'companyId', select: 'companyName industry' },
        { path: 'applicationId', select: 'status' }
      ])
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      interviews
    });
  } catch (error) {
    console.error('Error fetching specialist interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
});

// Get interview by meeting ID
router.get('/meeting/:meetingId', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Find interview by meetingLink or _id
    const interview = await Interview.findOne({
      $or: [
        { meetingLink: { $regex: meetingId, $options: 'i' } },
        { _id: meetingId }
      ]
    })
    .populate([
      { path: 'jobId', select: 'title description' },
      { path: 'companyId', select: 'companyName industry website' },
      { path: 'specialistId', select: 'fullName expertise email portfolio' },
      { path: 'applicationId', select: 'coverLetter status' }
    ]);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check permissions
    if (req.userType === 'company') {
      if (interview.companyId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this interview'
        });
      }
    } else if (req.userType === 'specialist') {
      if (interview.specialistId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this interview'
        });
      }
    }

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Error fetching interview by meeting ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview details',
      error: error.message
    });
  }
});

// Update interview status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check permissions
    if (req.userType === 'company') {
      if (interview.companyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this interview'
        });
      }
    } else if (req.userType === 'specialist') {
      if (interview.specialistId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this interview'
        });
      }
    }

    interview.status = status;
    interview.updatedAt = new Date();
    await interview.save();

    // Return populated interview
    await interview.populate([
      { path: 'jobId', select: 'title description' },
      { path: 'companyId', select: 'companyName industry' },
      { path: 'specialistId', select: 'fullName expertise email' }
    ]);

    res.json({
      success: true,
      interview,
      message: `Interview ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating interview status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview status',
      error: error.message
    });
  }
});

// Get interview details
router.get('/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate([
        { path: 'jobId', select: 'title description' },
        { path: 'companyId', select: 'companyName industry website' },
        { path: 'specialistId', select: 'fullName expertise email portfolio' },
        { path: 'applicationId', select: 'coverLetter status' }
      ]);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check permissions
    if (req.userType === 'company') {
      if (interview.companyId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this interview'
        });
      }
    } else if (req.userType === 'specialist') {
      if (interview.specialistId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this interview'
        });
      }
    }

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Error fetching interview details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview details',
      error: error.message
    });
  }
});

module.exports = router;