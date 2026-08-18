import React from 'react';

/**
 * StatusTag — single source of truth for all status/priority rendering.
 * Supports variant='tag' (default) and variant='dot'.
 */
const STATUS_MAP = {
    // Execution status
    Pass: { cls: 'status-tag status-pass', color: 'var(--status-pass)' },
    Failed: { cls: 'status-tag status-failed', color: 'var(--status-fail)' },
    Pending: { cls: 'status-tag status-pending', color: 'var(--status-pending)' },
    'N/A': { cls: 'status-tag status-pending', color: 'var(--status-pending)' },
    Blocked: { cls: 'status-tag status-blocked', color: 'var(--status-blocked)' },
    Warning: { cls: 'status-tag status-warn', color: 'var(--status-warn)' },

    // Priority
    Critical: { cls: 'status-tag prio-critical', color: 'var(--prio-critical)' },
    High: { cls: 'status-tag prio-high', color: 'var(--prio-high)' },
    Medium: { cls: 'status-tag prio-medium', color: 'var(--prio-medium)' },
    Low: { cls: 'status-tag prio-low', color: 'var(--prio-low)' },

    // Plan lifecycle
    Planning: { cls: 'status-tag plan-planning', color: 'var(--brand)' },
    'In Progress': { cls: 'status-tag plan-inprogress', color: 'var(--status-warn)' },
    Completed: { cls: 'status-tag plan-completed', color: 'var(--status-pass)' },
    'On Hold': { cls: 'status-tag plan-onhold', color: 'var(--status-pending)' },
    Obsolete: { cls: 'status-tag status-blocked', color: 'var(--status-blocked)' },
};

const StatusTag = ({ status, variant = 'tag', showLabel = true, className = '', style = {} }) => {
    const config = STATUS_MAP[status] ?? { cls: 'status-tag status-pending', color: 'var(--status-pending)' };

    if (variant === 'dot') {
        return (
            <span
                className={`status-dot-wrapper ${className}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, ...style }}
                title={status}
            >
                <span
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        display: 'inline-block',
                        flexShrink: 0,
                    }}
                />
                {showLabel && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{status}</span>}
            </span>
        );
    }

    return (
        <span className={`${config.cls} ${className}`} style={style}>
            {status}
        </span>
    );
};

export default StatusTag;
