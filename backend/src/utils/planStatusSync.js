import TestPlan from '../models/TestPlan.js';
import { logActivity } from './activityLog.js';

/**
 * Derives a Test Plan's overall status from its test cases' bug-tracking
 * fields (bugType/fixStatus), per the QA workflow rule:
 *
 *  - Any bug-tracked test case (bugType set) still 'Chưa fix' -> the whole
 *    plan Fails. This is a veto: one unresolved bug fails the plan even if
 *    every other test case passed.
 *  - No unresolved bugs, and every bug-tracked test case is 'Đã fix' ->
 *    the plan Passes.
 *  - Otherwise (no bug-tracked test cases at all, or some are 'Không fix'/
 *    unset with no 'Chưa fix' present) -> ambiguous, return null so the
 *    caller leaves the plan's status under manual control.
 */
export const computeBugDrivenStatus = (testCases) => {
    const bugTracked = testCases.filter((tc) => tc.bugType);
    if (bugTracked.length === 0) return null;
    if (bugTracked.some((tc) => tc.fixStatus === 'Chưa fix')) return 'Failed';
    if (bugTracked.every((tc) => tc.fixStatus === 'Đã fix')) return 'Pass';
    return null;
};

/**
 * Recomputes a Test Plan's executionStatus from its test cases' bug fields
 * and persists it if it changed. Best-effort: any failure is logged and
 * swallowed rather than thrown, so a sync failure never breaks the request
 * (test case edit, plan membership change, import) that triggered it.
 *
 * `actingUserId` is attributed as the executor of the resulting status
 * change — the person whose edit caused the recompute — consistent with
 * execution attribution elsewhere in the app.
 *
 * Returns true if the plan's status was changed (so callers holding their
 * own, now-stale copy of the plan know to re-fetch before responding).
 */
export const syncPlanStatusFromTestCases = async ({ planId, actingUserId, io }) => {
    try {
        const plan = await TestPlan.findById(planId).populate('testCases', 'bugType fixStatus');
        if (!plan) return false;

        const nextStatus = computeBugDrivenStatus(plan.testCases);
        if (!nextStatus || nextStatus === plan.executionStatus) return false;

        plan.executionStatus = nextStatus;
        plan.executedBy = actingUserId;
        plan.executedAt = new Date();
        await plan.save();

        await logActivity({
            entityType: 'TestPlan',
            entityId: plan._id,
            workspace: plan.workspace,
            user: actingUserId,
            action: 'execution_status_changed',
            toStatus: nextStatus,
        });

        if (io) {
            io.to(plan._id.toString()).emit('testPlanStatusUpdated', {
                planId: plan._id,
            });
        }

        return true;
    } catch (error) {
        console.error('Failed to sync plan status from test cases:', error);
        return false;
    }
};
