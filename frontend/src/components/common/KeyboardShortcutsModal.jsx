import React, { useEffect } from 'react';

const SHORTCUTS = [
    { key: 'Cmd / Ctrl + 1', desc: 'Navigate to Dashboard' },
    { key: 'Cmd / Ctrl + 2', desc: 'Navigate to Test Cases' },
    { key: 'Cmd / Ctrl + 3', desc: 'Navigate to Test Plans' },
    { key: 'Cmd / Ctrl + 4', desc: 'Navigate to Bug Tracking' },
    { key: 'Cmd / Ctrl + 5', desc: 'Navigate to Automation Testing' },
    { key: 'Cmd / Ctrl + B', desc: 'Toggle Sidebar Collapse' },
    { key: '/', desc: 'Focus Quick Search (in Test Cases)' },
    { key: 'Escape', desc: 'Close any open modal dialog' },
    { key: '?', desc: 'Open this Keyboard Shortcuts help' },
];

const KeyboardShortcutsModal = ({ onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal"
                style={{ maxWidth: 480 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-lg)' }}>⌨️</span>
                        <h2 className="modal-title">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost btn-icon"
                        aria-label="Close shortcuts"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body" style={{ padding: 'var(--space-4) var(--space-6)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {SHORTCUTS.map((s, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--space-2) 0',
                                    borderBottom: i !== SHORTCUTS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                }}
                            >
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    {s.desc}
                                </span>
                                <kbd
                                    style={{
                                        background: 'var(--bg-surface-2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        padding: '2px 8px',
                                        fontSize: 'var(--text-xs)',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-sm)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {s.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        Press <kbd style={{ fontFamily: 'var(--font-mono)' }}>Esc</kbd> anytime to close
                    </span>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsModal;
