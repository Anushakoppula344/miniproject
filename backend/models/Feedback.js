const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalScore: { type: Number, required: true },
    categoryScores: [{
        name: { type: String },
        score: { type: Number },
        comment: { type: String },
    }],
    strengths: [{ type: String }],
    areasForImprovement: [{ type: String }],
    finalAssessment: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', feedbackSchema);