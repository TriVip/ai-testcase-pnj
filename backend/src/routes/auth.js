import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import TestCase from '../models/TestCase.js';
import TestPlan from '../models/TestPlan.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// These endpoints are unauthenticated, so the limiter keys by client IP.
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts. Please try again later.',
});

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

/**
 * Verify a Google Identity Services ID token and return its claims, or null.
 *
 * Google's tokeninfo endpoint checks the signature and expiry for us; we still
 * have to check the audience ourselves, otherwise a token minted for any other
 * app's client ID would be accepted here.
 */
export const verifyGoogleIdToken = async (credential) => {
    if (typeof credential !== 'string' || !credential || !process.env.GOOGLE_CLIENT_ID) {
        return null;
    }
    const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!res.ok) return null;
    const claims = await res.json();
    if (
        claims.aud !== process.env.GOOGLE_CLIENT_ID ||
        !GOOGLE_ISSUERS.includes(claims.iss) ||
        claims.email_verified !== 'true' ||
        !claims.email
    ) {
        return null;
    }
    return claims;
};

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

// @route   POST /api/auth/google
// @desc    Sign in with a Google ID token. No password or Google token is
//          stored — only the profile (email, name, picture) needed to show
//          who owns/executed what and to manage workspace membership.
router.post('/google', authLimiter, async (req, res) => {
    try {
        const claims = await verifyGoogleIdToken(req.body.credential);
        if (!claims) {
            return res.status(401).json({ message: 'Invalid Google credential' });
        }

        // Match existing accounts by email (case-insensitive) so users who
        // registered with a password keep all their data.
        const user = await User.findOneAndUpdate(
            { email: claims.email },
            {
                $set: { picture: claims.picture || undefined },
                $setOnInsert: { name: claims.name || claims.email },
            },
            { upsert: true, new: true, collation: { locale: 'en', strength: 2 } }
        );

        await ensurePersonalWorkspace(user._id, user.name);

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('token', token, cookieOptions);

        // The JWT is delivered only through the httpOnly cookie above. Echoing
        // it in the body would put it within reach of any XSS on the frontend.
        res.json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                lastWorkspace: user.lastWorkspace,
            },
        });
    } catch (error) {
        console.error('Google login error:', error);
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
        const user = await User.findById(decoded.userId);

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
