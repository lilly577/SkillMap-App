const express = require('express');
const Company = require('../models/Company');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Protected route - Get current company profile
router.get('/profile', auth, async (req, res) => {
    try {
        if (req.userType !== 'company') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Company account required.'
            });
        }

        const company = await Company.findById(req.user._id).select('-password');
        res.json({
            success: true,
            company
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: err.message
        });
    }
});

// Protected route - Get company's jobs
router.get('/jobs', auth, async (req, res) => {
    const Job = require('../models/Job');
    try {
        if (req.userType !== 'company') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Company account required.'
            });
        }

        const jobs = await Job.find({ companyId: req.user._id });
        res.json({
            success: true,
            jobs
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs',
            error: err.message
        });
    }
});

// Protected route - Get company's matches
router.get('/matches', auth, async (req, res) => {
  const Match = require('../models/Match');
  const Job = require('../models/Job');
  const Specialist = require('../models/Specialist');

  try {
    if (req.userType !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Company account required.'
      });
    }

    const jobs = await Job.find({ companyId: req.user._id });
    const jobIds = jobs.map(j => j._id);
    const matches = await Match.find({ jobId: { $in: jobIds } })
      .sort({ matchScore: -1, createdAt: -1 })
      .populate('specialistId'); // Remove field selection to get ALL fields

    const out = matches.map(m => ({
      id: m._id,
      name: m.specialistId ? m.specialistId.fullName : null,
      specialistId: m.specialistId ? m.specialistId._id : null,
      email: m.specialistId ? m.specialistId.email : null,
      expertise: m.specialistId ? m.specialistId.expertise : null,
      yearsExperience: m.specialistId ? m.specialistId.yearsExperience : null,
      education: m.specialistId ? m.specialistId.education : null,
      portfolio: m.specialistId ? m.specialistId.portfolio : null,
      programmingLanguages: m.specialistId ? m.specialistId.programmingLanguages : [],
      cvUrl: m.specialistId ? m.specialistId.cvUrl : null,
      matchScore: Math.round((m.matchScore || 0) * 100),
      skills: m.specialistId ? m.specialistId.programmingLanguages : [], // Keep for backward compatibility
      experience: m.specialistId ? m.specialistId.yearsExperience : null, // Keep for backward compatibility
      jobId: m.jobId,
      status: m.status,
      createdAt: m.specialistId ? m.specialistId.createdAt : null
    }));

    console.log('Matches with full specialist data:', out.length, 'matches found');

    res.json({
      success: true,
      candidates: out
    });
  } catch (err) {
    console.error('Error fetching company matches:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: err.message
    });
  }
});

module.exports = router;
