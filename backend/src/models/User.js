import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// bcrypt hashes always start with $2a$ / $2b$ / $2y$. Used to tell a hashed
// value apart from a legacy plaintext password still sitting in the DB.
const BCRYPT_PREFIX = /^\$2[aby]\$/;

const userSchema = new mongoose.Schema(
    {
        // Username/Password fields
        username: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        picture: {
            type: String,
            default: 'https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff',
        },
    },
    {
        timestamps: true,
    }
);

// Hash the password whenever it is set or changed, before it hits the DB.
userSchema.pre('save', async function hashPassword(next) {
    try {
        if (!this.isModified('password') || !this.password) {
            return next();
        }
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
        return next();
    } catch (err) {
        return next(err);
    }
});

// Compare a candidate plaintext password against the stored value.
//
// Returns false for any account that has no password set (e.g. accounts created
// through an OAuth flow). Without that guard, an account with `password:
// undefined` would match a request that also omits the password field.
userSchema.methods.comparePassword = async function comparePassword(candidate) {
    if (!this.password || typeof candidate !== 'string' || candidate.length === 0) {
        return false;
    }

    // Legacy rows stored the password in plaintext. Compare directly so those
    // users can still log in; auth.js re-saves the value afterwards so the
    // pre-save hook hashes it going forward.
    if (!BCRYPT_PREFIX.test(this.password)) {
        return this.password === candidate;
    }

    return bcrypt.compare(candidate, this.password);
};

// True when the stored password is still a legacy plaintext value.
userSchema.methods.isPasswordPlaintext = function isPasswordPlaintext() {
    return Boolean(this.password) && !BCRYPT_PREFIX.test(this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
