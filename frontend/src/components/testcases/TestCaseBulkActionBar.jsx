import React from 'react';
import { PROJECTS } from '../../constants/projects';

const TestCaseBulkActionBar = ({
    selectedCount,
    deleting,
    onBulkDelete,
    onBulkExport,
    onBulkAssign,
    onClearSelection,
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="bulk-action-bar">
            <span className="bulk-count">{selectedCount} selected</span>
            <button
                onClick={onBulkDelete}
                disabled={deleting}
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius)',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--text-sm)',
                    opacity: deleting ? 0.6 : 1,
                }}
            >
                {deleting ? 'Deleting…' : 'Delete selected'}
            </button>
            <button
                onClick={onBulkExport}
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                }}
            >
                Export selected
            </button>
            <select
                value=""
                onChange={(e) => onBulkAssign(e.target.value === '__none__' ? '' : e.target.value)}
                aria-label="Move selected to project"
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                }}
            >
                <option value="" disabled>Move to project…</option>
                {PROJECTS.map((p) => (
                    <option key={p} value={p} style={{ color: 'initial' }}>{p}</option>
                ))}
                <option value="__none__" style={{ color: 'initial' }}>Unassigned</option>
            </select>
            <button
                onClick={onClearSelection}
                style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                }}
            >
                ✕ Clear
            </button>
        </div>
    );
};

export default TestCaseBulkActionBar;
