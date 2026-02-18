const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const Company = require('../models/Company');
const Specialist = require('../models/Specialist');
const { JWT_SECRET } = require('../middleware/auth');
const { runMatchingForSpecialist } = require('../services/matchService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: path.join(__dirname, '..', '..', 'uploads'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cv') {
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(fileExt)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Company Registration
router.post('/company/register', [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { companyName, email, password, location, website, industry } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create company
    const company = await Company.create({
      companyName,
      email,
      password: hashedPassword,
      location,
      website,
      industry
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: company._id, userType: 'company' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: company._id,
        name: company.companyName,
        email: company.email,
        userType: 'company'
      },
      message: 'Company registered successfully'
    });
  } catch (err) {
    console.error('Company registration error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: err.message 
    });
  }
});

// Specialist Registration with file upload
router.post('/specialist/register', upload.single('cv'), [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      fullName, 
      email, 
      password, 
      expertise, 
      yearsExperience, 
      education, 
      portfolio, 
      programmingLanguages 
    } = req.body;

    // Check if specialist already exists
    const existingSpecialist = await Specialist.findOne({ email });
    if (existingSpecialist) {
      return res.status(400).json({ 
        success: false, 
        message: 'Specialist with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Parse programming languages
    let languages = [];
    if (programmingLanguages) {
      if (typeof programmingLanguages === 'string') {
        try {
          // Try to parse as JSON first (for array format)
          const validJsonString = programmingLanguages.replace(/'/g, '"');
          languages = JSON.parse(validJsonString);
        } catch (parseError) {
          // Fallback to comma-separated string
          languages = programmingLanguages.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      } else if (Array.isArray(programmingLanguages)) {
        languages = programmingLanguages;
      }
    }

    // Handle CV file
    const cvUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Create specialist
    const specialist = await Specialist.create({
      fullName,
      email,
      password: hashedPassword,
      expertise,
      yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      education,
      portfolio,
      programmingLanguages: languages,
      cvUrl
    });

    // Trigger matching against all existing jobs for this new specialist.
    runMatchingForSpecialist(specialist._id).catch(err => console.error('match error', err));

    // Generate JWT token
    const token = jwt.sign(
      { userId: specialist._id, userType: 'specialist' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: specialist._id,
        name: specialist.fullName,
        email: specialist.email,
        userType: 'specialist'
      },
      message: 'Specialist registered successfully'
    });
  } catch (err) {
    console.error('Specialist registration error:', err);
    
    // Handle file upload errors specifically
    if (err.message.includes('file format') || err.message.includes('file size')) {
      return res.status(400).json({ 
        success: false, 
        message: 'File upload error: ' + err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: err.message 
    });
  }
});

// Login endpoint for both companies and specialists
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Check company first
    let user = await Company.findOne({ email });
    let userType = 'company';

    // If not company, check specialist
    if (!user) {
      user = await Specialist.findOne({ email });
      userType = 'specialist';
    }

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.companyName || user.fullName,
        email: user.email,
        userType
      },
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: err.message 
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user;
    if (decoded.userType === 'company') {
      user = await Company.findById(decoded.userId).select('-password');
    } else {
      user = await Specialist.findById(decoded.userId).select('-password');
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.companyName || user.fullName,
        email: user.email,
        userType: decoded.userType
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
});

module.exports = router;
