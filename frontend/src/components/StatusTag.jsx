/**
 * StatusTag — single source of truth for all status/priority rendering.
 * Uses semantic CSS classes from index.css.
 *
 * Variant: 'execution' | 'priority' | 'plan'
 */
const STATUS_MAP = {
    // Execution status
    Pass: 'status-tag status-pass',
    Failed: 'status-tag status-failed',
    Pending: 'status-tag status-pending',
    Blocked: 'status-tag status-blocked',
    Warning: 'status-tag status-warn',

    // Priority
    Critical: 'status-tag prio-critical',
    High: 'status-tag prio-high',
    Medium: 'status-tag prio-medium',
    Low: 'status-tag prio-low',

    // Plan lifecycle
    Planning: 'status-tag plan-planning',
    'In Progress': 'status-tag plan-inprogress',
    Completed: 'status-tag plan-completed',
    'On Hold': 'status-tag plan-onhold',
};

const StatusTag = ({ status, className = '' }) => {
    const cls = STATUS_MAP[status] ?? 'status-tag status-pending';
    return (
        <span className={`${cls} ${className}`}>
            {status}
        </span>
    );
};

export default StatusTag;
