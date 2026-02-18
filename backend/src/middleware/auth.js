const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const Specialist = require('../models/Specialist');

const JWT_SECRET = process.env.JWT_SECRET || 'idhdlldjljdlnfvnldlsjlndfhnvnlsdnldn';

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided, authorization denied' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if user is a company
        let user = await Company.findById(decoded.userId);
        if (user) {
            req.user = user;
            req.userType = 'company';
            return next();
        }

        // Check if user is a specialist
        user = await Specialist.findById(decoded.userId);
        if (user) {
            req.user = user;
            req.userType = 'specialist';
            return next();
        }

        return res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

module.exports = { auth, JWT_SECRET };