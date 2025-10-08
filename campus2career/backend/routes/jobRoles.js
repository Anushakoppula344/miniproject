const express = require('express');
const router = express.Router();
const JobRole = require('../models/JobRole');
const Company = require('../models/Company');
const NotificationService = require('../services/notificationService');

// GET /api/job-roles - Get all job roles
router.get('/', async (req, res) => {
  try {
    const { search, company, level } = req.query;
    let query = {};

    // Build search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (company && company !== 'All Companies') {
      query.company = company;
    }

    if (level && level !== 'All Levels') {
      query.level = level;
    }

    const jobRoles = await JobRole.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: jobRoles
    });
  } catch (error) {
    console.error('Error fetching job roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job roles',
      error: error.message
    });
  }
});

// GET /api/job-roles/active - Get active job roles only
router.get('/active', async (req, res) => {
  try {
    const activeJobs = await JobRole.getActiveJobs();
    
    res.json({
      success: true,
      data: activeJobs
    });
  } catch (error) {
    console.error('Error fetching active job roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active job roles',
      error: error.message
    });
  }
});

// GET /api/job-roles/:id - Get job role by ID
router.get('/:id', async (req, res) => {
  try {
    const jobRole = await JobRole.findById(req.params.id);
    
    if (!jobRole) {
      return res.status(404).json({
        success: false,
        message: 'Job role not found'
      });
    }

    res.json({
      success: true,
      data: jobRole
    });
  } catch (error) {
    console.error('Error fetching job role:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job role',
      error: error.message
    });
  }
});

// POST /api/job-roles - Create new job role
router.post('/', async (req, res) => {
  try {
    const jobRoleData = req.body;
    
    // Validate that the company exists - handle both _id and name
    let company;
    if (jobRoleData.company) {
      // Try to find by _id first, then by name
      company = await Company.findById(jobRoleData.company) || 
                await Company.findOne({ name: jobRoleData.company });
      
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        });
      }
      
      // Use company name for the job role
      jobRoleData.company = company.name;
    }

    // Handle salary field - convert string to object if needed
    if (jobRoleData.salary && typeof jobRoleData.salary === 'string') {
      // Parse salary string like "$80,000 - $120,000" or "80000-120000"
      const salaryMatch = jobRoleData.salary.match(/(\d+)/g);
      
      if (salaryMatch && salaryMatch.length >= 2) {
        const min = parseInt(salaryMatch[0]);
        const max = parseInt(salaryMatch[1]);
        jobRoleData.salary = {
          min: min,
          max: max,
          currency: 'USD'
        };
      } else if (salaryMatch && salaryMatch.length === 1) {
        // Single salary value
        const singleSalary = parseInt(salaryMatch[0]);
        jobRoleData.salary = {
          min: singleSalary,
          max: singleSalary + 20000, // Add 20k range
          currency: 'USD'
        };
      } else {
        // Default salary if parsing fails
        jobRoleData.salary = {
          min: 50000,
          max: 100000,
          currency: 'USD'
        };
      }
    }

    // Handle skills - ensure it's an array
    if (jobRoleData.skills && typeof jobRoleData.skills === 'string') {
      jobRoleData.skills = jobRoleData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }

    // Handle requirements - ensure it's an array
    if (jobRoleData.requirements && typeof jobRoleData.requirements === 'string') {
      jobRoleData.requirements = jobRoleData.requirements.split('\n').map(req => req.trim()).filter(req => req);
    }

    // Validate salary range
    if (jobRoleData.salary && jobRoleData.salary.min > jobRoleData.salary.max) {
      return res.status(400).json({
        success: false,
        message: 'Minimum salary cannot be greater than maximum salary'
      });
    }

    const jobRole = new JobRole(jobRoleData);
    await jobRole.save();

    // Notify all students about the new job opportunity
    try {
      await NotificationService.createNotificationsForAllStudents({
        type: 'info',
        title: 'New Job Opportunity! 💼',
        message: `A new ${jobRole.level} ${jobRole.title} position at ${jobRole.company} is now available. Apply now!`,
        entityType: 'job_role',
        entityId: jobRole._id,
        priority: 'high',
        actionUrl: `/opportunities`
      });
      console.log(`Notified students about new job role: ${jobRole.title} at ${jobRole.company}`);
    } catch (notificationError) {
      console.error('Failed to notify students about new job role:', notificationError);
      // Don't fail the job role creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Job role created successfully',
      data: jobRole
    });
  } catch (error) {
    console.error('Error creating job role:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job role',
      error: error.message
    });
  }
});

// PUT /api/job-roles/:id - Update job role
router.put('/:id', async (req, res) => {
  try {
    const jobRoleData = req.body;
    
    // Validate that the company exists (if company is being updated) - handle both _id and name
    if (jobRoleData.company) {
      let company;
      // Try to find by _id first, then by name
      company = await Company.findById(jobRoleData.company) || 
                await Company.findOne({ name: jobRoleData.company });
      
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        });
      }
      
      // Use company name for the job role
      jobRoleData.company = company.name;
    }

    // Handle salary field - convert string to object if needed
    if (jobRoleData.salary && typeof jobRoleData.salary === 'string') {
      // Parse salary string like "$80,000 - $120,000" or "80000-120000"
      const salaryMatch = jobRoleData.salary.match(/(\d+)/g);
      
      if (salaryMatch && salaryMatch.length >= 2) {
        const min = parseInt(salaryMatch[0]);
        const max = parseInt(salaryMatch[1]);
        jobRoleData.salary = {
          min: min,
          max: max,
          currency: 'USD'
        };
      } else if (salaryMatch && salaryMatch.length === 1) {
        // Single salary value
        const singleSalary = parseInt(salaryMatch[0]);
        jobRoleData.salary = {
          min: singleSalary,
          max: singleSalary + 20000, // Add 20k range
          currency: 'USD'
        };
      } else {
        // Default salary if parsing fails
        jobRoleData.salary = {
          min: 50000,
          max: 100000,
          currency: 'USD'
        };
      }
    }

    // Handle skills - ensure it's an array
    if (jobRoleData.skills && typeof jobRoleData.skills === 'string') {
      jobRoleData.skills = jobRoleData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }

    // Handle requirements - ensure it's an array
    if (jobRoleData.requirements && typeof jobRoleData.requirements === 'string') {
      jobRoleData.requirements = jobRoleData.requirements.split('\n').map(req => req.trim()).filter(req => req);
    }

    // Validate salary range
    if (jobRoleData.salary && jobRoleData.salary.min > jobRoleData.salary.max) {
      return res.status(400).json({
        success: false,
        message: 'Minimum salary cannot be greater than maximum salary'
      });
    }

    const jobRole = await JobRole.findByIdAndUpdate(
      req.params.id,
      jobRoleData,
      { new: true, runValidators: true }
    );

    if (!jobRole) {
      return res.status(404).json({
        success: false,
        message: 'Job role not found'
      });
    }

    // Notify students about job role updates (if important changes)
    try {
      await NotificationService.createNotificationsForAllStudents({
        type: 'info',
        title: 'Job Opportunity Updated! 🔄',
        message: `The ${jobRole.title} position at ${jobRole.company} has been updated with new information. Check it out!`,
        entityType: 'job_role',
        entityId: jobRole._id,
        priority: 'medium',
        actionUrl: `/opportunities`
      });
      console.log(`Notified students about job role update: ${jobRole.title} at ${jobRole.company}`);
    } catch (notificationError) {
      console.error('Failed to notify students about job role update:', notificationError);
      // Don't fail the job role update if notification fails
    }

    res.json({
      success: true,
      message: 'Job role updated successfully',
      data: jobRole
    });
  } catch (error) {
    console.error('Error updating job role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job role',
      error: error.message
    });
  }
});

// DELETE /api/job-roles/:id - Delete job role
router.delete('/:id', async (req, res) => {
  try {
    const jobRole = await JobRole.findByIdAndDelete(req.params.id);
    
    if (!jobRole) {
      return res.status(404).json({
        success: false,
        message: 'Job role not found'
      });
    }

    res.json({
      success: true,
      message: 'Job role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job role:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job role',
      error: error.message
    });
  }
});

// GET /api/job-roles/company/:companyName - Get job roles by company
router.get('/company/:companyName', async (req, res) => {
  try {
    const jobRoles = await JobRole.getJobsByCompany(req.params.companyName);
    
    res.json({
      success: true,
      data: jobRoles
    });
  } catch (error) {
    console.error('Error fetching job roles by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job roles by company',
      error: error.message
    });
  }
});

// PUT /api/job-roles/:id/status - Update job role status
router.put('/:id/status', async (req, res) => {
  try {
    const jobRole = await JobRole.findById(req.params.id);
    
    if (!jobRole) {
      return res.status(404).json({
        success: false,
        message: 'Job role not found'
      });
    }

    await jobRole.updateStatus();

    // Notify students about job status changes (if job becomes active)
    try {
      if (jobRole.status === 'Active') {
        await NotificationService.createNotificationsForAllStudents({
          type: 'success',
          title: 'Job Opportunity Available! ✅',
          message: `The ${jobRole.title} position at ${jobRole.company} is now actively hiring. Apply today!`,
          entityType: 'job_role',
          entityId: jobRole._id,
          priority: 'high',
          actionUrl: `/opportunities`
        });
        console.log(`Notified students about job becoming active: ${jobRole.title} at ${jobRole.company}`);
      } else if (jobRole.status === 'Inactive') {
        await NotificationService.createNotificationsForAllStudents({
          type: 'warning',
          title: 'Job Opportunity Closed ⏸️',
          message: `The ${jobRole.title} position at ${jobRole.company} is no longer accepting applications.`,
          entityType: 'job_role',
          entityId: jobRole._id,
          priority: 'medium',
          actionUrl: `/opportunities`
        });
        console.log(`Notified students about job becoming inactive: ${jobRole.title} at ${jobRole.company}`);
      }
    } catch (notificationError) {
      console.error('Failed to notify students about job status change:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.json({
      success: true,
      message: 'Job role status updated successfully',
      data: jobRole
    });
  } catch (error) {
    console.error('Error updating job role status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job role status',
      error: error.message
    });
  }
});

// POST /api/job-roles/bulk-status-update - Update status for all job roles
router.post('/bulk-status-update', async (req, res) => {
  try {
    const jobRoles = await JobRole.find({});
    
    for (let jobRole of jobRoles) {
      await jobRole.updateStatus();
    }

    res.json({
      success: true,
      message: 'All job role statuses updated successfully'
    });
  } catch (error) {
    console.error('Error updating job role statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job role statuses',
      error: error.message
    });
  }
});

module.exports = router;
