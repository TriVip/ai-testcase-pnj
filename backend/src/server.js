import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import testCaseRoutes from './routes/testCases.js';
import testPlanRoutes from './routes/testPlans.js';
import aiRoutes from './routes/ai.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
const envPath = path.join(__dirname, '..', '..', '.env');
console.log('📁 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

// If .env file cannot be loaded, set environment variables directly
if (result.error) {
    console.warn('⚠️  Could not load .env file, using fallback values');
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/testcase-gen';
    process.env.PORT = process.env.PORT || '9999';
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    process.env.OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
}

console.log('🔑 MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'NOT FOUND');
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found (' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : 'NOT FOUND');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/testplans', testPlanRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 9999;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (0.0.0.0)`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
