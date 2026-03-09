import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import TestCase from '../models/TestCase.js';
import TestPlan from '../models/TestPlan.js';

const router = express.Router();

// Helper to ensure a personal workspace exists and migrates orphaned data
const ensurePersonalWorkspace = async (userId, userName) => {
    let workspace = await Workspace.findOne({ createdBy: userId, isPersonal: true });
    if (!workspace) {
        workspace = await Workspace.create({
            name: `${userName}'s Personal Workspace`,
            createdBy: userId,
            members: [userId],
            isPersonal: true
        });

        // Migrate orphaned test cases and test plans
        await TestCase.updateMany(
            { user: userId, workspace: { $exists: false } },
            { $set: { workspace: workspace._id } }
        );
        await TestPlan.updateMany(
            { user: userId, workspace: { $exists: false } },
            { $set: { workspace: workspace._id } }
        );
    }
    return workspace;
};

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Create new user (in production, hash password with bcrypt)
        const user = await User.create({
            username,
            password, // TODO: Hash password in production
            email,
            name,
        });

        // Ensure personal workspace
        await ensurePersonalWorkspace(user._id, user.name);

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        // Set cookie (secure: true and sameSite: 'none' for production SSL cross-origin support)
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password (in production, use bcrypt.compare)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Ensure personal workspace (also acts as migration for existing users)
        await ensurePersonalWorkspace(user._id, user.name);

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        // Set cookie (secure: true and sameSite: 'none' for production SSL cross-origin support)
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/auth/current
// @desc    Get current user
router.get('/current', async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure personal workspace for already logged-in users
        await ensurePersonalWorkspace(user._id, user.name);

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
    res.json({ message: 'Logged out successfully' });
});

export default router;
