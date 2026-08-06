import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import TestCase from '../models/TestCase.js';
import TestPlan from '../models/TestPlan.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

const MIN_PASSWORD_LENGTH = 8;

// These endpoints are unauthenticated, so the limiter keys by client IP.
// A strict cap makes credential brute-force and signup spam impractical.
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts. Please try again later.',
});

/**
 * Read a credential field as a string.
 *
 * Anything that is not already a string (object, array, number, null) becomes
 * an empty string rather than being passed through. This is what stops a body
 * like { "username": { "$ne": null } } from reaching Mongo and being
 * interpreted as a query operator instead of a value.
 */
const readCredential = (value) => (typeof value === 'string' ? value.trim() : '');

// The session cookie normally requires HTTPS (Secure) and allows cross-site
// delivery (SameSite=None) so a frontend on a different origin than the API
// still gets it. Browsers silently refuse to store a Secure cookie over plain
// HTTP — without an escape hatch, a deployment reached over bare HTTP (no TLS
// terminator in front of it, e.g. hitting an EC2 public IP directly) would
// have login return 200 and then look logged-out on the very next request,
// with no error to explain why.
//
// Set COOKIE_SECURE=false only for that situation. It is not a general "turn
// off security" switch: sameSite drops to 'lax' (secure:false + sameSite:none
// is rejected outright by browsers), and this should never be set on a
// deployment that has TLS in front of it.
const COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';

const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

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
router.post('/register', authLimiter, async (req, res) => {
    try {
        const username = readCredential(req.body.username);
        const password = readCredential(req.body.password);
        const email = readCredential(req.body.email);
        const name = readCredential(req.body.name);

        if (!username || !email || !name) {
            return res.status(400).json({ message: 'Username, email and name are required' });
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Password is hashed by the pre-save hook on the User model.
        const user = await User.create({
            username,
            password,
            email,
            name,
        });

        // Ensure personal workspace
        await ensurePersonalWorkspace(user._id, user.name);

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('token', token, cookieOptions);

        // The JWT is delivered only through the httpOnly cookie above. Echoing
        // it in the body would put it within reach of any XSS on the frontend.
        res.status(201).json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', authLimiter, async (req, res) => {
    try {
        const username = readCredential(req.body.username);
        const password = readCredential(req.body.password);

        // Both fields must be present and non-empty. Mongoose strips keys whose
        // value is `undefined`, so without this guard `findOne({ username })`
        // would degrade to `findOne({})` and return an arbitrary account.
        if (!username || !password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Migrate legacy plaintext passwords on successful login: re-saving the
        // value lets the pre-save hook hash it, so accounts convert gradually
        // without a bulk migration or a forced password reset.
        if (user.isPasswordPlaintext()) {
            user.password = password;
            // Assigning the same string Mongoose already has leaves the field
            // "unmodified", which would make the pre-save hook skip hashing and
            // silently leave the password in plaintext. Force the dirty flag.
            user.markModified('password');
            await user.save();
        }

        // Ensure personal workspace (also acts as migration for existing users)
        await ensurePersonalWorkspace(user._id, user.name);

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('token', token, cookieOptions);

        // Token stays in the httpOnly cookie only — see the note in /register.
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
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
    // clearCookie must be called with matching attributes, or some browsers
    // treat it as a different cookie and never remove the original.
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Logged out successfully' });
});

export default router;
