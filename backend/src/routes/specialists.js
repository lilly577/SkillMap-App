const express = require('express');
const multer = require('multer');
const path = require('path');
const Specialist = require('../models/Specialist');
const { auth } = require('../middleware/auth');
const { runMatchingForSpecialist } = require('../services/matchService');

const router = express.Router();

const upload = multer({ dest: path.join(__dirname, '..', '..', 'uploads') });

// Protected route - Get current specialist profile
router.get('/profile', auth, async (req, res) => {
    try {
        if (req.userType !== 'specialist') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Specialist account required.'
            });
        }

        const specialist = await Specialist.findById(req.user._id).select('-password');
        res.json({
            success: true,
            specialist
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

// Protected route - Get specialist's matches
router.get('/matches', auth, async (req, res) => {
    const Match = require('../models/Match');
    const Job = require('../models/Job');
    const Company = require('../models/Company');

    try {
        if (req.userType !== 'specialist') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Specialist account required.'
            });
        }

        const matches = await Match.find({ specialistId: req.user._id })
            .sort({ matchScore: -1, createdAt: -1 })
            .populate({
                path: 'jobId',
                populate: {
                    path: 'companyId',
                    select: 'companyName email _id' // Include the company ID
                }
            });

        const out = matches.map(m => {
            const company = m.jobId?.companyId;
            return {
                id: m._id,
                company: company ? company.companyName : 'Unknown Company',
                companyId: company ? company._id : null, // Include the company user ID
                position: m.jobId ? m.jobId.title : null,
                jobId: m.jobId._id,
                matchScore: Math.round((m.matchScore || 0) * 100),
                requirements: m.jobId ? m.jobId.requirements : [],
                location: m.jobId ? m.jobId.location : null,
                status: m.status
            };
        });

        res.json({
            success: true,
            matches: out
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
            error: err.message
        });
    }
});

// Protected route - Get specialist's notifications
router.get('/notifications', auth, async (req, res) => {
    try {
        if (req.userType !== 'specialist') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Specialist account required.'
            });
        }

        // Simple static response for now - can be enhanced with real notifications
        res.json({
            success: true,
            notifications: [{
                id: '1',
                message: 'New match found',
                time: '2 hours ago',
                read: false
            }]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: err.message
        });
    }
});

// Public route - Get all specialists (for companies to browse)
router.get('/', async (req, res) => {
    console.log("Fetching Specialists.");
    try {
        const candidates = await Specialist.find().select('-password -email');
        res.json({
            success: true,
            candidates
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch specialists',
            error: err.message
        });
    }
});

// Protected route - Update specialist profile with CV upload
router.put('/profile', auth, upload.single('cv'), async (req, res) => {
    try {
        if (req.userType !== 'specialist') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Specialist account required.'
            });
        }

        const updates = { ...req.body };
        if (req.file) {
            updates.cvUrl = `/uploads/${req.file.filename}`;
        }

        // Handle programming languages parsing
        if (updates.programmingLanguages && typeof updates.programmingLanguages === 'string') {
            try {
                const validJsonString = updates.programmingLanguages.replace(/'/g, '"');
                updates.programmingLanguages = JSON.parse(validJsonString);
            } catch (parseError) {
                updates.programmingLanguages = updates.programmingLanguages.split(',').map(s => s.trim());
            }
        }

        const specialist = await Specialist.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (specialist) {
            // Recompute matches because skills/profile may have changed.
            runMatchingForSpecialist(specialist._id).catch(err => console.error('match error', err));
        }

        res.json({
            success: true,
            specialist,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: err.message
        });
    }
});

module.exports = router;
