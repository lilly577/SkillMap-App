const express = require('express');
const { auth } = require('../middleware/auth');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Specialist = require('../models/Specialist');
const Company = require('../models/Company');

const router = express.Router();

// Apply for a job (specialist only)
router.post('/apply', auth, async (req, res) => {
  try {
    if (req.userType !== 'specialist') {
      return res.status(403).json({
        success: false,
        message: 'Only specialists can apply for jobs'
      });
    }

    const { jobId, coverLetter } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId).populate('companyId');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      specialistId: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create application
    const application = await Application.create({
      jobId,
      specialistId: req.user._id,
      companyId: job.companyId._id,
      coverLetter: coverLetter || ''
    });

    await application.populate('jobId', 'title description');
    await application.populate('specialistId', 'fullName expertise email');
    await application.populate('companyId', 'companyName');

    res.json({
      success: true,
      application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for job',
      error: error.message
    });
  }
});

// Get applications for a specialist
router.get('/my-applications', auth, async (req, res) => {
  try {
    if (req.userType !== 'specialist') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const applications = await Application.find({ specialistId: req.user._id })
      .populate('jobId', 'title description location experienceYears')
      .populate('companyId', 'companyName industry location')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Get applications for a company's jobs
router.get('/company/applications', auth, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find all jobs by this company
    const jobs = await Job.find({ companyId: req.user._id });
    const jobIds = jobs.map(job => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('jobId', 'title')
      .populate('specialistId', 'fullName expertise yearsExperience education programmingLanguages cvUrl')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching company applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Update application status (company only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Only companies can update application status'
      });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await Application.findById(req.params.id)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if the company owns this job
    if (application.jobId.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    application.status = status;
    if (status !== 'pending') {
      application.reviewedAt = new Date();
    }

    await application.save();

    res.json({
      success: true,
      application,
      message: `Application ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
});

module.exports = router;