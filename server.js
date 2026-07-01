const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// 📦 MIDDLEWARE
// ============================================

// CORS - Frontend එකට Backend එකෙන් Data ගන්න ඉඩ දෙන්න
app.use(cors({
    origin: '*', // Development සඳහා (Production වලදී specific domain දාන්න)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development සඳහා)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ============================================
// 🛣️ ROUTES
// ============================================

// Auth Routes
app.use('/api/auth', authRoutes);

// Health Check Route - Server එක වැඩ කරනවදැයි බලන්න
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '🚀 Server is running!',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'
    });
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: '🔬 Denuka Thennakoon - Science Exam System API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            register: '/api/auth/register [POST]',
            login: '/api/auth/login [POST]',
            profile: '/api/auth/me [GET] (Protected)',
            users: '/api/auth/users [GET] (Admin Only)'
        }
    });
});

// 404 Handler - Route එක නැත්නම්
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`
    });
});

// ============================================
// 🗄️ DATABASE CONNECTION (MongoDB Atlas)
// ============================================

console.log('🔄 Connecting to MongoDB Atlas...');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Atlas connected successfully!');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        
        // Start server only after database connection
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📝 API endpoint: http://localhost:${PORT}/api/auth`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB Atlas connection error:', error.message);
        console.log('\n💡 Please check:');
        console.log('   1. MongoDB Atlas Connection String is correct in .env file');
        console.log('   2. Network Access IP is set to "Allow Access from Anywhere" (0.0.0.0/0)');
        console.log('   3. Database User credentials are correct');
        console.log('   4. Internet connection is active');
        process.exit(1);
    });

// ============================================
// 🔌 Handle MongoDB Disconnection
// ============================================
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('🛑 MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
});