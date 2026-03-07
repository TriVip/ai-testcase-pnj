import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isPersonal: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

const Workspace = mongoose.model('Workspace', workspaceSchema);

export default Workspace;
