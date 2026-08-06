import { useState, useEffect } from 'react';

const fmtDateTime = (d) => new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

// "testCases" -> "test cases" for a field name pulled straight from the schema.
const humanizeField = (field) => field.replace(/([A-Z])/g, ' $1').toLowerCase();

const describeEntry = (entry) => {
    switch (entry.action) {
        case 'created':
            return 'created this';
        case 'execution_status_changed':
            return <>marked result as <strong>{entry.toStatus}</strong></>;
        case 'updated':
            return `edited ${(entry.changedFields || []).map(humanizeField).join(', ') || 'details'}`;
        default:
            return entry.action;
    }
};

// Renders the chronological activity log for a single TestCase or TestPlan.
// `historyFn` must be a stable reference (e.g. testCasesAPI.getHistory) —
// passing a fresh arrow function each render would re-fetch on every render.
// `refreshToken` is optional: bump it from the parent after an action that
// wrote a new log entry for this same entity, since entityId alone won't
// change and so won't otherwise trigger a re-fetch.
const ActivityHistory = ({ historyFn, entityId, refreshToken }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!entityId) return;
        let cancelled = false;
        setLoading(true);
        setError(false);
        historyFn(entityId)
            .then(res => { if (!cancelled) setEntries(res.data || []); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [historyFn, entityId, refreshToken]);

    if (loading) {
        return <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Loading history…</div>;
    }
    if (error) {
        return <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Failed to load history</div>;
    }
    if (entries.length === 0) {
        return <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>No activity yet</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {entries.map(entry => (
                <div key={entry._id} style={{ display: 'flex', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {fmtDateTime(entry.createdAt)}
                    </span>
                    <span>
                        <strong style={{ color: 'var(--text-primary)' }}>{entry.user?.name || 'Someone'}</strong>
                        {' '}{describeEntry(entry)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ActivityHistory;
