import React from 'react';

const TestCaseBulkActionBar = ({
    selectedCount,
    deleting,
    onBulkDelete,
    onBulkExport,
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
