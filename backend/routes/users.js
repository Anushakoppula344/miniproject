const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory storage for development
let memoryUsers = [];
let userIdCounter = 1;

// GET /users - Get all users
router.get('/', async (req, res) => {
    try {
        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const usersWithoutPasswords = memoryUsers.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            res.json({
                success: true,
                count: usersWithoutPasswords.length,
                data: usersWithoutPasswords
            });
        } else {
            // MongoDB logic
            const users = await User.find({}).select('-password');
            res.json({
                success: true,
                count: users.length,
                data: users
            });
        }
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const user = memoryUsers.find(u => u._id == id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            const { password, ...userWithoutPassword } = user;
            res.json({
                success: true,
                data: userWithoutPassword
            });
        } else {
            // MongoDB logic
            const user = await User.findById(id).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        }
    } catch (error) {
        console.error('Get user by ID error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// POST /users - Create a new user
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role = 'student' } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Validate role
        if (role && !['student', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "student" or "admin"'
            });
        }

        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const existingUser = memoryUsers.find(u => u.email === email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = {
                _id: userIdCounter++,
                name,
                email,
                password: hashedPassword,
                role,
                createdAt: new Date()
            };
            memoryUsers.push(user);

            const { password: _, ...userWithoutPassword } = user;
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userWithoutPassword
            });
        } else {
            // MongoDB logic
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                name,
                email,
                password: hashedPassword,
                role
            });
            
            const savedUser = await user.save();
            const { password: _, ...userWithoutPassword } = savedUser.toObject();
            
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userWithoutPassword
            });
        }
    } catch (error) {
        console.error('Create user error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// PUT /users/:id - Update user by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        // Validate role if provided
        if (role && !['student', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "student" or "admin"'
            });
        }

        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const userIndex = memoryUsers.findIndex(u => u._id == id);
            if (userIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if email is being changed and if it already exists
            if (email && email !== memoryUsers[userIndex].email) {
                const existingUser = memoryUsers.find(u => u.email === email && u._id != id);
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'User with this email already exists'
                    });
                }
            }

            // Update user fields
            if (name) memoryUsers[userIndex].name = name;
            if (email) memoryUsers[userIndex].email = email;
            if (role) memoryUsers[userIndex].role = role;
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                memoryUsers[userIndex].password = hashedPassword;
            }

            const { password: _, ...userWithoutPassword } = memoryUsers[userIndex];
            res.json({
                success: true,
                message: 'User updated successfully',
                data: userWithoutPassword
            });
        } else {
            // MongoDB logic
            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (role) updateData.role = role;
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateData.password = hashedPassword;
            }

            const user = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        }
    } catch (error) {
        console.error('Update user error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// DELETE /users/:id - Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (process.env.USE_MEMORY_DB === 'true') {
            // In-memory database logic
            const userIndex = memoryUsers.findIndex(u => u._id == id);
            if (userIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const deletedUser = memoryUsers.splice(userIndex, 1)[0];
            const { password, ...userWithoutPassword } = deletedUser;
            
            res.json({
                success: true,
                message: 'User deleted successfully',
                data: userWithoutPassword
            });
        } else {
            // MongoDB logic
            const user = await User.findByIdAndDelete(id).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully',
                data: user
            });
        }
    } catch (error) {
        console.error('Delete user error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;