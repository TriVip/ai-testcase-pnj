import mongoose from 'mongoose';

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

const User = mongoose.model('User', userSchema);

export default User;
