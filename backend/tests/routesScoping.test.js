import { describe, it } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import TestCase from '../src/models/TestCase.js';
import TestPlan from '../src/models/TestPlan.js';

describe('TestCase and TestPlan Models Schema Constraints', () => {
    it('creates TestCase instance with default priority, status, and executionStatus', () => {
        const userId = new mongoose.Types.ObjectId();
        const tc = new TestCase({
            title: 'Checkout Flow',
            description: 'Validate item checkout',
            user: userId,
        });

        assert.strictEqual(tc.title, 'Checkout Flow');
        assert.strictEqual(tc.priority, 'Medium');
        assert.strictEqual(tc.status, 'Draft');
        assert.strictEqual(tc.executionStatus, 'Pending');
        assert.strictEqual(tc.category, 'General');
        assert.strictEqual(tc.feature, 'General');
    });

    it('allows empty string for bugType, bugSeverity, fixStatus to support clearing enums', () => {
        const userId = new mongoose.Types.ObjectId();
        const tc = new TestCase({
            title: 'Bug field clearable test',
            description: 'Validate enum clearing',
            user: userId,
            bugType: '',
            bugSeverity: '',
            fixStatus: '',
        });

        const validationError = tc.validateSync();
        assert.strictEqual(validationError, undefined);
    });

    it('creates TestPlan instance with default status and executionStatus', () => {
        const userId = new mongoose.Types.ObjectId();
        const plan = new TestPlan({
            name: 'Release 1.0 Test Plan',
            description: 'Covers core checkout and payments',
            user: userId,
        });

        assert.strictEqual(plan.name, 'Release 1.0 Test Plan');
        assert.strictEqual(plan.status, 'Planning');
        assert.strictEqual(plan.executionStatus, 'Pending');
        assert.strictEqual(plan.testCases.length, 0);
    });
});
