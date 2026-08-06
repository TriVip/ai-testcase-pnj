import mongoose from 'mongoose';

// Append-only audit trail for TestCase/TestPlan changes. Deliberately lean:
// entries record which field(s) changed, not the before/after values, to
// keep documents tiny regardless of how large the edited fields are.
const activityLogSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            enum: ['TestCase', 'TestPlan'],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            enum: ['created', 'updated', 'execution_status_changed'],
            required: true,
        },
        // Field names only for 'updated' entries — no old/new content.
        changedFields: [String],
        // Cheap enough to keep as an actual value (short enum string) and is
        // the one piece of "before/after" info the feature is explicitly for.
        toStatus: String,
    },
    {
        timestamps: true,
    }
);

// History views query by entity, newest first — this is the only access
// pattern today, so it's the only index needed.
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
