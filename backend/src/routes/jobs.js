const express = require('express');
const Job = require('../models/Job');
const { runMatchingForJob } = require('../services/matchService');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Protected route - Create job (company only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.userType !== 'company') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Company account required.' 
            });
        }

        const { title, description, requirements, location, experienceYears } = req.body;
        const reqs = Array.isArray(requirements)
            ? requirements
            : requirements
            ? requirements.split(',').map(s => s.trim())
            : [];

        const job = await Job.create({
            companyId: req.user._id,
            title,
            description,
            requirements: reqs,
            location,
            experienceYears,
        });

        // trigger match run (background)
        runMatchingForJob(job._id).catch(err => console.error('match error', err));

        res.json({ 
            success: true, 
            jobId: job._id, 
            message: 'Job posted successfully' 
        });
    } catch (err) {
        console.error('Error posting job:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to post job', 
            error: err.message 
        });
    }
});

// Protected route - Get company's jobs
router.get('/my-jobs', auth, async (req, res) => {
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
        console.error('Error fetching jobs:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch jobs',
            error: err.message 
        });
    }
});

// Public route - Get all jobs (for specialists to browse)
router.get('/', async (req, res) => {
    try {
        const jobs = await Job.find().populate('companyId', 'companyName industry location');
        res.json({ 
            success: true,
            jobs 
        });
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch jobs',
            error: err.message 
        });
    }
});

// Public route - Get specific job by ID
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('companyId', 'companyName industry location website');
        if (!job) {
            return res.status(404).json({ 
                success: false,
                message: 'Job not found' 
            });
        }
        
        res.json({ 
            success: true,
            job 
        });
    } catch (err) {
        console.error('Error fetching job:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch job',
            error: err.message 
        });
    }
});

module.exports = router;