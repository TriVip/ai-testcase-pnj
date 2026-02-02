import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        steps: [
            {
                stepNumber: Number,
                action: String,
                expectedResult: String,
            },
        ],
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },
        status: {
            type: String,
            enum: ['Draft', 'Active', 'Deprecated'],
            default: 'Draft',
        },
        category: {
            type: String,
            default: 'General',
        },
        tags: [String],
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

const TestCase = mongoose.model('TestCase', testCaseSchema);

export default TestCase;
