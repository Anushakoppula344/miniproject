const express = require('express');
const Feedback = require('../models/Feedback');

const router = express.Router();

// Create feedback
router.post('/', async (req, res) => {
    const { interviewId, userId, totalScore, categoryScores, strengths, areasForImprovement, finalAssessment, feedbackId } = req.body;

    try {
        const feedbackData = {
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
        };

        let feedback;
        if (feedbackId) {
            feedback = await Feedback.findByIdAndUpdate(feedbackId, feedbackData, { new: true });
        } else {
            feedback = new Feedback(feedbackData);
            await feedback.save();
        }

        res.json({ success: true, feedbackId: feedback._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get feedback by interview ID and user ID
router.get('/', async (req, res) => {
    const { interviewId, userId } = req.query;
    try {
        const feedbacks = await Feedback.find({ interviewId, userId });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;