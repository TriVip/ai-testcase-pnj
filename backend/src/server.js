import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import TestPlan from './models/TestPlan.js';
import { userCanAccessWorkspace } from './utils/workspaceAccess.js';

// Import routes
import authRoutes from './routes/auth.js';
import testCaseRoutes from './routes/testCases.js';
import testPlanRoutes from './routes/testPlans.js';
import aiRoutes from './routes/ai.js';
import workspaceRoutes from './routes/workspaces.js';
// import jiraRoutes from './routes/jira.js';

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
    process.env.PORT = process.env.PORT || '5000';
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    process.env.OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
}

// JWT_SECRET must come from the environment and must never fall back to a
// baked-in default: the previous fallback value is public in this repo's git
// history, and anyone holding it can forge a token for any userId. Refuse to
// start rather than run with a guessable signing key.
const JWT_SECRET_PLACEHOLDERS = new Set([
    'your-super-secret-jwt-key-change-this-in-production',
    'your-super-secret-jwt-key',
    'change-this-in-production',
    'changeme',
    'secret',
]);
const MIN_JWT_SECRET_LENGTH = 32;
const jwtSecret = (process.env.JWT_SECRET || '').trim();

if (!jwtSecret || JWT_SECRET_PLACEHOLDERS.has(jwtSecret) || jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    console.error(
        '❌ FATAL: JWT_SECRET is missing, too short, or set to a known placeholder.\n' +
        `   It must be at least ${MIN_JWT_SECRET_LENGTH} characters of random data.\n` +
        '   Generate one with: openssl rand -base64 48'
    );
    process.exit(1);
}

console.log('🔑 MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'NOT FOUND');
// Presence only — never echo any part of the key. Startup logs routinely end
// up in shared aggregators and CI output.
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found' : 'NOT FOUND');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Pull a single cookie value out of a raw Cookie header. Kept local so the
// socket handshake doesn't need cookie-parser (which is Express middleware and
// never runs for a websocket upgrade).
const readCookie = (header, name) => {
    for (const part of (header || '').split(';')) {
        const separator = part.indexOf('=');
        if (separator === -1) continue;
        if (part.slice(0, separator).trim() === name) {
            return decodeURIComponent(part.slice(separator + 1).trim());
        }
    }
    return undefined;
};

// Authenticate the socket handshake with the same JWT the REST API uses.
// Without this any anonymous client could connect and join a room.
io.use((socket, next) => {
    try {
        const token = readCookie(socket.handshake.headers.cookie, 'token')
            || socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Not authenticated'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        return next();
    } catch (error) {
        return next(new Error('Not authenticated'));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('⚡ Socket client connected:', socket.id, 'user:', socket.userId);

    // Rooms are keyed by test plan id. Membership is checked against the same
    // rules the REST API applies, otherwise a client could join any room it can
    // name and receive every status update broadcast to it.
    socket.on('joinRoom', async (roomId) => {
        try {
            if (!mongoose.isValidObjectId(roomId)) {
                return;
            }

            const plan = await TestPlan.findById(roomId).select('user workspace');
            if (!plan) {
                return;
            }

            const isOwner = String(plan.user) === String(socket.userId);
            const isWorkspaceMember = plan.workspace
                ? await userCanAccessWorkspace(socket.userId, plan.workspace)
                : false;

            if (!isOwner && !isWorkspaceMember) {
                console.warn(`Socket ${socket.id} denied joinRoom ${roomId}`);
                return;
            }

            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        } catch (error) {
            console.error('joinRoom error:', error);
        }
    });

    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('⚡ Socket client disconnected:', socket.id);
    });
});

// Make io accessible to our router
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Trust first proxy (Nginx) - required for correct cookie/IP handling behind reverse proxy
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security headers. CSP is left off because this process serves JSON, not
// HTML it renders itself; the remaining defaults (HSTS, nosniff, frameguard,
// referrer policy) all apply.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// JSON only — deliberately no express.urlencoded().
//
// The session cookie is SameSite=None (the frontend is on a different origin),
// so the browser attaches it to cross-site requests. CORS is not a defence on
// its own: a urlencoded form POST is a CORS "simple request" and is delivered
// without a preflight, which would let any page silently drive state-changing
// endpoints on behalf of a logged-in user. Accepting only application/json
// forces a preflight on every mutating request, and CORS rejects it for any
// origin other than FRONTEND_URL. Multipart uploads are unaffected — multer
// parses those on the specific routes that opt in.
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/testplans', testPlanRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workspaces', workspaceRoutes);
// app.use('/api/jira', jiraRoutes);

// Health check route. Reports the real MongoDB connection state so a load
// balancer can pull this instance out of rotation during a DB outage, instead
// of always answering OK. readyState is an in-memory value — no query is sent.
const MONGO_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
app.get('/health', (req, res) => {
    const readyState = mongoose.connection.readyState;
    const db = MONGO_STATES[readyState] || 'unknown';

    if (readyState === 1) {
        return res.status(200).json({ status: 'OK', db });
    }
    return res.status(503).json({ status: readyState === 2 ? 'degraded' : 'error', db });
});

// Error handling middleware.
//
// The full error is always logged server-side. What reaches the client depends
// on the status: a 4xx is a deliberate, safe message raised by our own code
// (e.g. "Not authorized for this workspace") and is passed through so the UI
// can display it. A 5xx is unexpected, so in production it collapses to a
// generic message — Mongoose validation errors and stack traces would
// otherwise disclose schema internals and file paths.
app.use((err, req, res, next) => {
    console.error(err.stack || err);

    // A bad request body or a malformed id is the caller's mistake, not a
    // server fault. Map those to 400 so clients get an actionable status
    // instead of a 500 that looks like an outage.
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation failed',
            errors: Object.values(err.errors || {}).map((e) => e.message),
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid identifier' });
    }

    const status = err.status || err.statusCode || 500;

    if (status < 500) {
        return res.status(status).json({ message: err.message });
    }

    if (process.env.NODE_ENV === 'production') {
        return res.status(status).json({ message: 'Internal server error' });
    }
    return res.status(status).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 9999;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (0.0.0.0)`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
