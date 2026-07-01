const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// 🛡️ Authentication Middleware - Token Verify කරන්න
// ============================================
const auth = async (req, res, next) => {
    try {
        // Header එකෙන් Token එක ගන්න
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Please login.'
            });
        }

        // Token එක Verify කරන්න
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // User එක Database එකෙන් හොයාගන්න (Password එක එපා)
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // User Data එක Request එකට Attach කරන්න
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};

// ============================================
// 👑 Admin Only Middleware
// ============================================
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
};

module.exports = { auth, isAdmin };