const express = require('express');
const Match = require('../models/Match');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Protected route - Get match by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const match = await Match.findById(req.params.id).populate('specialistId jobId');
        
        if (!match) {
            return res.status(404).json({ 
                success: false,
                message: 'Match not found' 
            });
        }

        // Check if user has permission to view this match
        if (req.userType === 'company') {
            const Job = require('../models/Job');
            const job = await Job.findById(match.jobId);
            if (job && job.companyId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied to this match' 
                });
            }
        } else if (req.userType === 'specialist') {
            if (match.specialistId && match.specialistId._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied to this match' 
                });
            }
        }

        res.json({ 
            success: true,
            match 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch match',
            error: err.message 
        });
    }
});

module.exports = router;