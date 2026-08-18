import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateImportData } from '../src/utils/importUtils.js';

describe('Import Utils & Validation', () => {
    it('validates valid test cases correctly', () => {
        const input = [
            {
                title: 'Login with valid credentials',
                description: 'Verify successful login with valid email and password',
                priority: 'High',
                status: 'Active',
                category: 'Authentication',
                feature: 'User Management',
                executionStatus: 'Pass',
                steps: [
                    { stepNumber: 1, action: 'Enter username', expectedResult: 'Username entered' },
                    { stepNumber: 2, action: 'Click login', expectedResult: 'Dashboard displayed' },
                ],
            },
        ];

        const result = validateImportData(input);
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.totalRows, 1);
        assert.strictEqual(result.validRows, 1);
        assert.strictEqual(result.invalidRows, 0);
        assert.strictEqual(result.validTestCases[0].title, 'Login with valid credentials');
    });

    it('rejects rows missing required fields (title or description)', () => {
        const input = [
            {
                title: '',
                description: 'Missing title',
            },
            {
                title: 'Valid Title',
                description: '',
            },
        ];

        const result = validateImportData(input);
        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.totalRows, 2);
        assert.strictEqual(result.validRows, 0);
        assert.strictEqual(result.invalidRows, 2);
        assert.ok(result.errors.length >= 2);
    });

    it('flags rows with invalid priority and status as validation errors', () => {
        const input = [
            {
                title: 'Test normalization',
                description: 'Check priority validation',
                priority: 'invalid-priority',
                executionStatus: 'invalid-exec',
                steps: [],
            },
        ];

        const result = validateImportData(input);
        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.invalidRows, 1);
        assert.ok(result.errors.some(e => e.includes('Priority must be one of')));
    });
});
