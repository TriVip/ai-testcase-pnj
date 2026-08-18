import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

describe('User Model Methods', () => {
    it('compares bcrypt hashed password correctly', async () => {
        const rawPassword = 'SecurePassword123!';
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        const user = new User({
            username: 'tester',
            email: 'tester@example.com',
            name: 'Tester',
            password: hashedPassword,
        });

        const isCorrect = await user.comparePassword(rawPassword);
        const isWrong = await user.comparePassword('WrongPassword123');

        assert.strictEqual(isCorrect, true);
        assert.strictEqual(isWrong, false);
        assert.strictEqual(user.isPasswordPlaintext(), false);
    });

    it('identifies and matches legacy plaintext passwords', async () => {
        const plainPassword = 'legacyPlainPassword';
        const user = new User({
            username: 'legacyuser',
            email: 'legacy@example.com',
            name: 'Legacy User',
            password: plainPassword,
        });

        assert.strictEqual(user.isPasswordPlaintext(), true);
        const isMatch = await user.comparePassword(plainPassword);
        const isWrong = await user.comparePassword('other');

        assert.strictEqual(isMatch, true);
        assert.strictEqual(isWrong, false);
    });

    it('returns false when password candidate is empty or undefined', async () => {
        const user = new User({
            username: 'nopass',
            email: 'nopass@example.com',
            name: 'No Pass',
        });

        const res1 = await user.comparePassword('');
        const res2 = await user.comparePassword(null);
        const res3 = await user.comparePassword(undefined);

        assert.strictEqual(res1, false);
        assert.strictEqual(res2, false);
        assert.strictEqual(res3, false);
    });
});
