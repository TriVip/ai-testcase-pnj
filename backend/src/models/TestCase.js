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
        // Human-readable id from an imported source sheet (e.g. "BB-M1-01").
        // Distinct from Mongo's own _id — purely for cross-referencing back to
        // wherever the test case originally came from.
        externalId: {
            type: String,
            trim: true,
        },
        preCondition: {
            type: String,
            default: '',
        },
        testData: {
            type: String,
            default: '',
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
        feature: {
            type: String,
            default: 'General',
        },
        tags: [String],
        executionStatus: {
            type: String,
            enum: ['Pending', 'Pass', 'Failed', 'N/A'],
            default: 'Pending',
        },
        executionNotes: {
            type: String,
            default: '',
        },
        // Bug-tracking fields, filled in when execution turns up a defect.
        // '' is an explicit member of each enum (alongside Mongoose's own
        // implicit allowance of null/undefined) so the field can be cleared by
        // $set-ing it back to '' — sending `undefined` to clear it wouldn't
        // work, since the Mongo driver drops undefined keys from an update
        // entirely rather than unsetting them, silently leaving the old value
        // in place. Code reading these already treats '' as "no value" via a
        // truthiness check, so nothing downstream needs to distinguish it from
        // absent.
        bugType: {
            type: String,
            enum: ['Bug', 'Đề xuất', ''],
        },
        bugSeverity: {
            type: String,
            enum: ['High', 'Medium', 'Low', ''],
        },
        fixStatus: {
            type: String,
            enum: ['Đã fix', 'Chưa fix', 'Không fix', ''],
        },
        // Plain-text reference to a bug filed elsewhere (e.g. "BUG-045"). Kept
        // separate from jiraTicketUrl, which is a URL populated automatically by
        // the Jira integration — this is a manually-entered identifier and may
        // not point at Jira at all.
        bugId: {
            type: String,
            trim: true,
        },
        jiraTicketUrl: {
            type: String,
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
    },
    {
        timestamps: true,
    }
);

const TestCase = mongoose.model('TestCase', testCaseSchema);

export default TestCase;
