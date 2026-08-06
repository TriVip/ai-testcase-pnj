import ActivityLog from '../models/ActivityLog.js';

// Best-effort write: a logging failure must never fail the mutation that
// triggered it, so errors are caught and reported rather than propagated.
export const logActivity = async (entry) => {
    try {
        await ActivityLog.create(entry);
    } catch (error) {
        console.error('Failed to write activity log:', error);
    }
};
