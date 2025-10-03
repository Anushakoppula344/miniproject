const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory storage for development
let memoryUsers = [];
let userIdCounter = 1;

// Sign up
router.post('/sign-up', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const existingUser = memoryUsers.find(u => u.email === email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = {
                _id: userIdCounter++,
                name,
                email,
                password: hashedPassword,
                createdAt: new Date()
            };
            memoryUsers.push(user);

            res.json({ success: true, message: 'Account created successfully' });
        } else {
            // MongoDB logic
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ name, email, password: hashedPassword });
            await user.save();

            res.json({ success: true, message: 'Account created successfully' });
        }
    } catch (error) {
        console.error('Sign-up error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Sign in
router.post('/sign-in', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const user = memoryUsers.find(u => u.email === email);
            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.json({ success: true, token });
        } else {
            // MongoDB logic
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.json({ success: true, token });
        }
    } catch (error) {
        console.error('Sign-in error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const user = memoryUsers.find(u => u._id == req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            // MongoDB logic
            const user = await User.findById(req.user.id).select('-password');
            res.json(user);
        }
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug route to view all users (development only)
router.get('/debug/users', (req, res) => {
    try {
        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const usersWithoutPasswords = memoryUsers.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            res.json({
                message: 'Users from in-memory database',
                count: usersWithoutPasswords.length,
                users: usersWithoutPasswords
            });
        } else {
            // MongoDB logic
            User.find({}, '-password')
                .then(users => {
                    res.json({
                        message: 'Users from MongoDB',
                        count: users.length,
                        users: users
                    });
                })
                .catch(error => {
                    console.error('Error fetching users:', error);
                    res.status(500).json({ message: 'Error fetching users', error: error.message });
                });
        }
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;