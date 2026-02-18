const express = require('express');
const Specialist = require('../models/Specialist');
const Job = require('../models/Job');
const Company = require('../models/Company');

const router = express.Router();

// Public route - Browse all specialists
router.get('/specialists', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      expertise, 
      minExperience, 
      maxExperience,
      skills,
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Filter by expertise
    if (expertise) {
      filter.expertise = new RegExp(expertise, 'i');
    }
    
    // Filter by experience range
    if (minExperience || maxExperience) {
      filter.yearsExperience = {};
      if (minExperience) filter.yearsExperience.$gte = parseInt(minExperience);
      if (maxExperience) filter.yearsExperience.$lte = parseInt(maxExperience);
    }
    
    // Filter by skills/programming languages
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      filter.programmingLanguages = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }
    
    // Search by name or expertise
    if (search) {
      filter.$or = [
        { fullName: new RegExp(search, 'i') },
        { expertise: new RegExp(search, 'i') },
        { education: new RegExp(search, 'i') }
      ];
    }

    const specialists = await Specialist.find(filter)
      .select('-password -email') // Exclude sensitive information
      .sort({ yearsExperience: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Specialist.countDocuments(filter);

    const specialistsData = specialists.map(specialist => ({
      id: specialist._id,
      fullName: specialist.fullName,
      expertise: specialist.expertise,
      yearsExperience: specialist.yearsExperience,
      education: specialist.education,
      portfolio: specialist.portfolio,
      programmingLanguages: specialist.programmingLanguages,
      cvUrl: specialist.cvUrl,
      createdAt: specialist.createdAt
    }));

    res.json({
      success: true,
      specialists: specialistsData,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total: total
    });
  } catch (error) {
    console.error('Error browsing specialists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specialists',
      error: error.message
    });
  }
});

// Public route - Browse all jobs
router.get('/jobs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      location, 
      industry,
      minExperience,
      maxExperience,
      skills,
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Filter by location
    if (location) {
      filter.location = new RegExp(location, 'i');
    }
    
    // Filter by industry (via company)
    if (industry) {
      filter.industry = new RegExp(industry, 'i');
    }
    
    // Filter by experience range
    if (minExperience || maxExperience) {
      filter.experienceYears = {};
      if (minExperience) filter.experienceYears.$gte = parseInt(minExperience);
      if (maxExperience) filter.experienceYears.$lte = parseInt(maxExperience);
    }
    
    // Filter by skills/requirements
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      filter.requirements = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }
    
    // Search by title, description, or company
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'companyId.companyName': new RegExp(search, 'i') }
      ];
    }

    const jobs = await Job.find(filter)
      .populate('companyId', 'companyName industry location website')
      .sort({ createdAt: -1, experienceYears: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(filter);

    const jobsData = jobs.map(job => ({
      id: job._id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      experienceYears: job.experienceYears,
      company: {
        id: job.companyId._id,
        name: job.companyId.companyName,
        industry: job.companyId.industry,
        location: job.companyId.location,
        website: job.companyId.website
      },
      createdAt: job.createdAt
    }));

    res.json({
      success: true,
      jobs: jobsData,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total: total
    });
  } catch (error) {
    console.error('Error browsing jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// Public route - Get specific job details
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'companyName industry location website email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const jobData = {
      id: job._id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      experienceYears: job.experienceYears,
      company: {
        id: job.companyId._id,
        name: job.companyId.companyName,
        industry: job.companyId.industry,
        location: job.companyId.location,
        website: job.companyId.website,
        email: job.companyId.email
      },
      createdAt: job.createdAt
    };

    res.json({
      success: true,
      job: jobData
    });
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job details',
      error: error.message
    });
  }
});

// Public route - Get specific specialist details
router.get('/specialists/:id', async (req, res) => {
  try {
    const specialist = await Specialist.findById(req.params.id)
      .select('-password'); // Exclude password

    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: 'Specialist not found'
      });
    }

    const specialistData = {
      id: specialist._id,
      fullName: specialist.fullName,
      expertise: specialist.expertise,
      yearsExperience: specialist.yearsExperience,
      education: specialist.education,
      portfolio: specialist.portfolio,
      programmingLanguages: specialist.programmingLanguages,
      cvUrl: specialist.cvUrl,
      createdAt: specialist.createdAt
    };

    res.json({
      success: true,
      specialist: specialistData
    });
  } catch (error) {
    console.error('Error fetching specialist details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specialist details',
      error: error.message
    });
  }
});

module.exports = router;