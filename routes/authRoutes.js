const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// ============================================
// 📝 REGISTER - නව පරිශීලක ලියාපදිංචි කරන්න
// ============================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName, class: className } = req.body;

        // 1. Input Validation
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: username, email, password, fullName'
            });
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username or email already exists. Please use different credentials.'
            });
        }

        // 3. Create new user
        const user = new User({
            username,
            email,
            password,
            fullName,
            class: className || ''
        });

        await user.save();

        // 4. Generate JWT Token
        const token = user.generateAuthToken();

        // 5. Send response (without password)
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            class: user.class,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            user: userData,
            token: token
        });

    } catch (error) {
        console.error('Registration Error:', error);
        
        // Mongoose Validation Error
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration. Please try again.'
        });
    }
});

// ============================================
// 🔑 LOGIN - පරිශීලක පිවිසුම
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Input Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both username and password'
            });
        }

        // 2. Find user by username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // 3. Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // 4. Generate JWT Token
        const token = user.generateAuthToken();

        // 5. Send user data (without password)
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            class: user.class
        };

        res.json({
            success: true,
            message: 'Login successful!',
            user: userData,
            token: token
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login. Please try again.'
        });
    }
});

// ============================================
// 👤 GET CURRENT USER - දැනට Login වී ඇති පරිශීලකයා
// ============================================
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// ============================================
// 🚪 LOGOUT - Frontend එකෙන් Token එක Delete කරන්න
// ============================================
router.post('/logout', auth, async (req, res) => {
    try {
        // JWT Stateless නිසා Server-side එකේ කිසිම දෙයක් කරන්න අවශ්‍ය නැහැ.
        // Frontend එකෙන් Token එක Remove කිරීම ප්‍රමාණවත්.
        res.json({
            success: true,
            message: 'Logged out successfully. Please remove token from client.'
        });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout.'
        });
    }
});

// ============================================
// 👑 ADMIN ONLY - All Users List
// ============================================
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

module.exports = router;