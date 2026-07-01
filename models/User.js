const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema - MongoDB Atlas එකට ගැලපෙන විදියට
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    class: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ============================================
// 🔐 Password Hashing (Save කිරීමට පෙර)
// ============================================
userSchema.pre('save', async function(next) {
    // Password එක වෙනස් වෙලා නැත්නම් යන්න දෙන්න
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// 🔑 Password Compare කිරීමේ Method
// ============================================
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// ============================================
// 🎫 JWT Token Generate කිරීම
// ============================================
userSchema.methods.generateAuthToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { 
            id: this._id, 
            username: this.username, 
            role: this.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

module.exports = mongoose.model('User', userSchema);
