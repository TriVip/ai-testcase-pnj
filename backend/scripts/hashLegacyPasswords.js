/**
 * One-off migration: bcrypt-hash any password still stored in plaintext.
 *
 * Users keep their existing password — the plaintext is read, hashed, and
 * written back, so no reset is required and nothing changes for them at login.
 * The login route also rehashes on the fly, so running this is optional; it
 * just removes the plaintext from the database now instead of waiting for each
 * account to sign in.
 *
 * Safe to re-run: rows that already hold a bcrypt hash are skipped.
 *
 * Usage:
 *   node scripts/hashLegacyPasswords.js            # dry run, writes nothing
 *   node scripts/hashLegacyPasswords.js --apply    # perform the update
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const SALT_ROUNDS = 12;
const BCRYPT_PREFIX = /^\$2[aby]\$/;
const apply = process.argv.includes('--apply');

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const users = mongoose.connection.collection('users');

    // Read the raw collection rather than the model so the pre-save hook can't
    // double-hash, and so rows are handled exactly as stored.
    const all = await users.find({}, { projection: { password: 1, username: 1 } }).toArray();

    const legacy = all.filter((u) => u.password && !BCRYPT_PREFIX.test(u.password));
    const already = all.length - legacy.length;

    console.log(`Connected to ${mongoose.connection.name}`);
    console.log(`  total users        : ${all.length}`);
    console.log(`  already hashed     : ${already}`);
    console.log(`  plaintext to hash  : ${legacy.length}`);

    if (legacy.length === 0) {
        console.log('Nothing to do.');
        await mongoose.disconnect();
        return;
    }

    if (!apply) {
        console.log('\nDRY RUN — no changes written. Accounts that would be updated:');
        for (const u of legacy) {
            console.log(`  - ${u.username ?? u._id}`);
        }
        console.log('\nRe-run with --apply to perform the update.');
        await mongoose.disconnect();
        return;
    }

    let updated = 0;
    let failed = 0;

    for (const user of legacy) {
        const plaintext = user.password;
        const hash = await bcrypt.hash(plaintext, SALT_ROUNDS);

        // Confirm the hash actually validates the original password before
        // writing it — a bad write here would lock the account out.
        if (!(await bcrypt.compare(plaintext, hash))) {
            console.error(`  ✗ ${user.username ?? user._id}: hash failed verification, skipped`);
            failed++;
            continue;
        }

        await users.updateOne({ _id: user._id }, { $set: { password: hash } });

        // Read back and verify against the original password.
        const after = await users.findOne({ _id: user._id }, { projection: { password: 1 } });
        if (!after || !(await bcrypt.compare(plaintext, after.password))) {
            console.error(`  ✗ ${user.username ?? user._id}: post-write verification failed`);
            failed++;
            continue;
        }

        console.log(`  ✓ ${user.username ?? user._id}`);
        updated++;
    }

    console.log(`\nUpdated ${updated}, failed ${failed}.`);
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
    console.error('Migration error:', err.message);
    process.exit(1);
});
