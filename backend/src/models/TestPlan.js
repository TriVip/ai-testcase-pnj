import mongoose from 'mongoose';

const testPlanSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        testCases: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'TestCase',
            },
        ],
        status: {
            type: String,
            enum: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Obsolete'],
            default: 'Planning',
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        executionStatus: {
            type: String,
            enum: ['Pending', 'Pass', 'Failed'],
            default: 'Pending',
        },
        executionNotes: {
            type: String,
            default: '',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
        },
        // Who last changed the plan's own executionStatus, and when.
        // Server-set only — see the matching note in models/TestCase.js.
        executedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        executedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const TestPlan = mongoose.model('TestPlan', testPlanSchema);

export default TestPlan;
