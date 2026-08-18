import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRateLimiter } from '../src/middleware/rateLimit.js';

describe('Rate Limiter Middleware', () => {
    it('allows requests within the limit', () => {
        const limiter = createRateLimiter({ windowMs: 1000, max: 3 });
        const req = { userId: 'user-1', baseUrl: '/api', path: '/test' };
        let nextCalled = 0;
        const next = () => { nextCalled++; };
        const res = {
            status: () => res,
            json: () => res,
            set: () => res,
        };

        limiter(req, res, next);
        limiter(req, res, next);
        limiter(req, res, next);

        assert.strictEqual(nextCalled, 3);
    });

    it('blocks requests exceeding the limit with 429 status', () => {
        const limiter = createRateLimiter({ windowMs: 1000, max: 2, message: 'Rate limit exceeded' });
        const req = { userId: 'user-2', baseUrl: '/api', path: '/test' };
        let nextCalled = 0;
        let statusCode = null;
        let responseBody = null;
        let headerSet = {};

        const next = () => { nextCalled++; };
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (body) => {
                responseBody = body;
                return res;
            },
            set: (k, v) => {
                headerSet[k] = v;
                return res;
            },
        };

        limiter(req, res, next);
        limiter(req, res, next);
        assert.strictEqual(nextCalled, 2);

        // 3rd request should be blocked
        limiter(req, res, next);
        assert.strictEqual(nextCalled, 2);
        assert.strictEqual(statusCode, 429);
        assert.strictEqual(responseBody.message, 'Rate limit exceeded');
        assert.ok(headerSet['Retry-After']);
    });

    it('isolates limits per user identity and path', () => {
        const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
        let nextCount = 0;
        const next = () => { nextCount++; };
        const res = { status: () => res, json: () => res, set: () => res };

        limiter({ userId: 'user-a', path: '/endpoint' }, res, next);
        limiter({ userId: 'user-b', path: '/endpoint' }, res, next);
        limiter({ userId: 'user-a', path: '/other-endpoint' }, res, next);

        assert.strictEqual(nextCount, 3);
    });
});
