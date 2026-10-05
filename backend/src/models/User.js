import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        // Profile only — sign-in is via Google, no credentials are stored.
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
        // Last workspace the user picked, so every device opens the same one.
        // Only a UI preference — access is still checked per request.
        lastWorkspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

export default User;
