import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeBugDrivenStatus } from '../src/utils/planStatusSync.js';

describe('Test Plan Status Auto-Sync Logic', () => {
    it('returns null when no test cases have bug tracking fields', () => {
        const tcs = [
            { title: 'TC1', executionStatus: 'Pass' },
            { title: 'TC2', executionStatus: 'Failed' },
        ];
        assert.strictEqual(computeBugDrivenStatus(tcs), null);
    });

    it('returns Failed if any bug-tracked test case is Chưa fix (veto rule)', () => {
        const tcs = [
            { title: 'TC1', bugType: 'Bug', fixStatus: 'Đã fix' },
            { title: 'TC2', bugType: 'Bug', fixStatus: 'Chưa fix' },
            { title: 'TC3', executionStatus: 'Pass' },
        ];
        assert.strictEqual(computeBugDrivenStatus(tcs), 'Failed');
    });

    it('returns Pass if all bug-tracked test cases are Đã fix', () => {
        const tcs = [
            { title: 'TC1', bugType: 'Bug', fixStatus: 'Đã fix' },
            { title: 'TC2', bugType: 'Đề xuất', fixStatus: 'Đã fix' },
        ];
        assert.strictEqual(computeBugDrivenStatus(tcs), 'Pass');
    });

    it('returns null for ambiguous cases (e.g. Không fix without any Chưa fix)', () => {
        const tcs = [
            { title: 'TC1', bugType: 'Bug', fixStatus: 'Không fix' },
            { title: 'TC2', bugType: 'Bug', fixStatus: 'Đã fix' },
        ];
        assert.strictEqual(computeBugDrivenStatus(tcs), null);
    });
});
