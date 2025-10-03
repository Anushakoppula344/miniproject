const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Verify MongoDB URI
if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
}

console.log('Connecting to MongoDB:', process.env.MONGODB_URI);

// Connect to MongoDB and **start server only if connection succeeds**
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');

        // Routes
        app.use('/auth', require('./routes/auth'));
        app.use('/users', require('./routes/users'));
        app.use('/api/interviews', require('./routes/interviews'));
        app.use('/api/feedback', require('./routes/feedback'));

        // Simple home route
        app.get('/', (req, res) => {
            res.send('🟢 Server is running!');
        });

        // Global error handling middleware
        app.use((err, req, res, next) => {
            console.error('Global error handler:', err.stack);
            res.status(500).json({ success: false, message: err.message });
        });

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('Please check your MONGODB_URI, network, and Atlas IP whitelist.');
        process.exit(1); // Stop server if DB connection fails
    });
