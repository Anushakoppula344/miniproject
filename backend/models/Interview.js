const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    role: { type: String, required: true },
    level: { type: String, required: true },
    questions: [{ type: String }],
    techstack: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    userId: { type: String, required: true }, // Changed to String to match frontend expectation
    type: { type: String, required: true },
    finalized: { type: Boolean, default: false },
    coverImage: { type: String, default: '' },
});

module.exports = mongoose.model('Interview', interviewSchema);