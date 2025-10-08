const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const Company = require('../models/Company');

// GET /api/workflows - Get all workflows
router.get('/', async (req, res) => {
  try {
    const { search, company, difficulty } = req.query;
    let query = {};

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (company && company !== 'All Companies') {
      query.company = company;
    }

    if (difficulty && difficulty !== 'All Difficulties') {
      query.difficulty = difficulty;
    }

    const workflows = await Workflow.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflows',
      error: error.message
    });
  }
});

// GET /api/workflows/:id - Get workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflow',
      error: error.message
    });
  }
});

// POST /api/workflows - Create new workflow
router.post('/', async (req, res) => {
  try {
    const workflowData = req.body;
    
    // Validate that the company exists
    const company = await Company.findOne({ name: workflowData.company });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Validate stages
    if (!workflowData.stages || workflowData.stages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Workflow must have at least one stage'
      });
    }

    // Set order for stages if not provided
    workflowData.stages.forEach((stage, index) => {
      if (!stage.order) {
        stage.order = index + 1;
      }
    });

    const workflow = new Workflow(workflowData);
    await workflow.save();

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: workflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating workflow',
      error: error.message
    });
  }
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', async (req, res) => {
  try {
    const workflowData = req.body;
    
    // Validate that the company exists (if company is being updated)
    if (workflowData.company) {
      const company = await Company.findOne({ name: workflowData.company });
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        });
      }
    }

    // Validate stages if provided
    if (workflowData.stages) {
      if (workflowData.stages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Workflow must have at least one stage'
        });
      }

      // Set order for stages if not provided
      workflowData.stages.forEach((stage, index) => {
        if (!stage.order) {
          stage.order = index + 1;
        }
      });
    }

    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      workflowData,
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: workflow
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workflow',
      error: error.message
    });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findByIdAndDelete(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting workflow',
      error: error.message
    });
  }
});

// POST /api/workflows/:id/stages - Add stage to workflow
router.post('/:id/stages', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const stageData = req.body;
    await workflow.addStage(stageData);

    res.json({
      success: true,
      message: 'Stage added successfully',
      data: workflow
    });
  } catch (error) {
    console.error('Error adding stage:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding stage',
      error: error.message
    });
  }
});

// DELETE /api/workflows/:id/stages/:order - Remove stage from workflow
router.delete('/:id/stages/:order', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const stageOrder = parseInt(req.params.order);
    await workflow.removeStage(stageOrder);

    res.json({
      success: true,
      message: 'Stage removed successfully',
      data: workflow
    });
  } catch (error) {
    console.error('Error removing stage:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing stage',
      error: error.message
    });
  }
});

// PUT /api/workflows/:id/stages/reorder - Reorder stages
router.put('/:id/stages/reorder', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const { newOrder } = req.body;
    if (!newOrder || !Array.isArray(newOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order array provided'
      });
    }

    await workflow.reorderStages(newOrder);

    res.json({
      success: true,
      message: 'Stages reordered successfully',
      data: workflow
    });
  } catch (error) {
    console.error('Error reordering stages:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering stages',
      error: error.message
    });
  }
});

// GET /api/workflows/company/:companyName - Get workflows by company
router.get('/company/:companyName', async (req, res) => {
  try {
    const workflows = await Workflow.getWorkflowsByCompany(req.params.companyName);
    
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Error fetching workflows by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflows by company',
      error: error.message
    });
  }
});

// GET /api/workflows/difficulty/:difficulty - Get workflows by difficulty
router.get('/difficulty/:difficulty', async (req, res) => {
  try {
    const workflows = await Workflow.getWorkflowsByDifficulty(req.params.difficulty);
    
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Error fetching workflows by difficulty:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflows by difficulty',
      error: error.message
    });
  }
});

// PUT /api/workflows/:id/toggle-status - Toggle workflow active status
router.put('/:id/toggle-status', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    workflow.isActive = !workflow.isActive;
    await workflow.save();

    res.json({
      success: true,
      message: `Workflow ${workflow.isActive ? 'activated' : 'deactivated'} successfully`,
      data: workflow
    });
  } catch (error) {
    console.error('Error toggling workflow status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling workflow status',
      error: error.message
    });
  }
});

module.exports = router;
