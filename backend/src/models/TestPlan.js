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
    },
    {
        timestamps: true,
    }
);

const TestPlan = mongoose.model('TestPlan', testPlanSchema);

export default TestPlan;
