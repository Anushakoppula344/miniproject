const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const JobRole = require('../models/JobRole');
const Workflow = require('../models/Workflow');
const NotificationService = require('../services/notificationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/companies';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/companies - Get all companies
router.get('/', async (req, res) => {
  try {
    const { search, industry, companySize } = req.query;
    let query = {};

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (industry && industry !== 'All Industries') {
      query.industry = industry;
    }

    if (companySize && companySize !== 'All Sizes') {
      query.companySize = companySize;
    }

    const companies = await Company.find(query).sort({ createdAt: -1 });
    
    // Update stats for each company
    for (let company of companies) {
      const roleCount = await JobRole.countDocuments({ company: company.name });
      const workflowCount = await Workflow.countDocuments({ company: company.name });
      
      company.roles = roleCount;
      company.workflows = workflowCount;
      await company.save();
    }

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
});

// GET /api/companies/:id - Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Update stats
    const roleCount = await JobRole.countDocuments({ company: company.name });
    const workflowCount = await Workflow.countDocuments({ company: company.name });
    
    company.roles = roleCount;
    company.workflows = workflowCount;
    await company.save();

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company',
      error: error.message
    });
  }
});

// POST /api/companies - Create new company
router.post('/', async (req, res) => {
  try {
    const companyData = req.body;
    
    // Check if company with same name already exists
    const existingCompany = await Company.findOne({ name: companyData.name });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    const company = new Company({
      name: companyData.name,
      industry: companyData.industry,
      location: companyData.location,
      website: companyData.website,
      companySize: companyData.companySize,
      description: companyData.description,
      hiringStatus: companyData.hiringStatus || 'Active'
    });
    await company.save();

    // Notify all students about the new company
    try {
      await NotificationService.createNotificationsForAllStudents({
        type: 'info',
        title: 'New Company Added! 🏢',
        message: `A new company "${company.name}" in ${company.industry} has been added to the opportunities list. Check it out!`,
        entityType: 'company',
        entityId: company._id,
        priority: 'medium',
        actionUrl: `/company/${company._id}`
      });
      console.log(`Notified students about new company: ${company.name}`);
    } catch (notificationError) {
      console.error('Failed to notify students about new company:', notificationError);
      // Don't fail the company creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company',
      error: error.message
    });
  }
});

// PUT /api/companies/:id - Update company
router.put('/:id', async (req, res) => {
  try {
    const companyData = req.body;
    
    // Check if another company with same name exists (excluding current one)
    if (companyData.name) {
      const existingCompany = await Company.findOne({ 
        name: companyData.name, 
        _id: { $ne: req.params.id } 
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this name already exists'
        });
      }
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      companyData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Notify students about company updates (if important changes)
    try {
      await NotificationService.createNotificationsForAllStudents({
        type: 'info',
        title: 'Company Information Updated! 📝',
        message: `Company "${company.name}" has updated their information. Check out the latest details!`,
        entityType: 'company',
        entityId: company._id,
        priority: 'low',
        actionUrl: `/company/${company._id}`
      });
      console.log(`Notified students about company update: ${company.name}`);
    } catch (notificationError) {
      console.error('Failed to notify students about company update:', notificationError);
      // Don't fail the company update if notification fails
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company',
      error: error.message
    });
  }
});

// DELETE /api/companies/:id - Delete company
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Delete associated job roles and workflows
    await JobRole.deleteMany({ company: company.name });
    await Workflow.deleteMany({ company: company.name });

    // Delete uploaded documents
    if (company.documents && company.documents.length > 0) {
      company.documents.forEach(doc => {
        const filePath = path.join('uploads/companies', doc.name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Notify students about company deletion
    try {
      await NotificationService.createNotificationsForAllStudents({
        type: 'warning',
        title: 'Company Removed! ⚠️',
        message: `Company "${company.name}" has been removed from the opportunities list.`,
        entityType: 'company',
        entityId: company._id,
        priority: 'medium'
      });
      console.log(`Notified students about company deletion: ${company.name}`);
    } catch (notificationError) {
      console.error('Failed to notify students about company deletion:', notificationError);
      // Don't fail the company deletion if notification fails
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company',
      error: error.message
    });
  }
});

// GET /api/companies/:id/documents - Get all documents for a company
router.get('/:id/documents', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: {
        documents: company.documents || []
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
});

// POST /api/companies/:id/documents - Upload document
router.post('/:id/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const documentData = {
      id: Date.now().toString(),
      name: req.file.originalname,
      type: req.body.type || 'Other',
      size: (req.file.size / (1024 * 1024)).toFixed(1) + ' MB',
      filename: req.file.filename
    };

    await company.addDocument(documentData);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: documentData
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
});

// DELETE /api/companies/:id/documents/:docId - Delete document
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const document = company.documents.find(doc => doc.id === req.params.docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
    const filePath = path.join('uploads/companies', document.filename || document.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await company.removeDocument(req.params.docId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
});

// GET /api/companies/:id/documents/:docId/view - View document
router.get('/:id/documents/:docId/view', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const document = company.documents.find(doc => doc.id === req.params.docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const filePath = path.join('uploads/companies', document.filename || document.name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + document.name + '"');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({
      success: false,
      message: 'Error viewing document',
      error: error.message
    });
  }
});

// GET /api/companies/:id/documents/:docId/download - Download document
router.get('/:id/documents/:docId/download', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const document = company.documents.find(doc => doc.id === req.params.docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const filePath = path.join('uploads/companies', document.filename || document.name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(filePath, document.name);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
});

module.exports = router;
