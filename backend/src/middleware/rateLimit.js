/**
 * Simple in-memory rate limiter middleware (per-user, per-action).
 * No external dependencies needed.
 *
 * Usage:
 *   import { createRateLimiter } from '../middleware/rateLimit.js';
 *   const deleteLimiter = createRateLimiter({ windowMs: 10000, max: 10 });
 *   router.delete('/:id', deleteLimiter, handler);
 */

const stores = new Map();

// Clean up expired entries every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of stores) {
        if (now - entry.resetTime > 0) {
            stores.delete(key);
        }
    }
}, 60_000);

/**
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 10000)
 * @param {number} options.max - Max requests per window (default: 10)
 * @param {string} [options.message] - Error message
 */
export const createRateLimiter = ({ windowMs = 10_000, max = 10, message } = {}) => {
    return (req, res, next) => {
        const userId = req.userId || req.ip;
        const key = `${userId}:${req.baseUrl}`;
        const now = Date.now();

        let entry = stores.get(key);

        if (!entry || now > entry.resetTime) {
            entry = { count: 0, resetTime: now + windowMs };
            stores.set(key, entry);
        }

        entry.count++;

        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({
                message: message || 'Too many requests. Please slow down.',
                retryAfter,
            });
        }

        next();
    };
};
