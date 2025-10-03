const express = require('express');
const Interview = require('../models/Interview');
const auth = require('../middleware/auth');

const router = express.Router();

// Get interview by ID
router.get('/:id', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) return res.status(404).json(null);
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get interviews by user ID
router.get('/', async (req, res) => {
    const { userId } = req.query;
    try {
        const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get latest interviews (excluding current user)
router.get('/latest', async (req, res) => {
    const { userId, limit = 20 } = req.query;
    try {
        const interviews = await Interview.find({ finalized: true, userId: { $ne: userId } })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create interview
router.post('/', async (req, res) => {
    const { role, level, questions, techstack, type, userId, coverImage, finalized, createdAt } = req.body;
    try {
        const interview = new Interview({
            role,
            level,
            questions,
            techstack,
            type,
            userId,
            coverImage,
            finalized,
            createdAt,
        });
        await interview.save();
        res.json({ success: true, interviewId: interview._id });
    } catch (error) {
        console.error('Error creating interview:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;