import React, { useEffect } from 'react';

const IconAlertTriangle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const IconInfo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

/**
 * Reusable Confirmation Dialog
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} [props.confirmText='Confirm']
 * @param {string} [props.cancelText='Cancel']
 * @param {'danger'|'warning'|'primary'} [props.variant='danger']
 * @param {boolean} [props.loading=false]
 * @param {Function} props.onConfirm
 * @param {Function} props.onCancel
 */
const ConfirmDialog = ({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
    onConfirm,
    onCancel,
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !loading) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onCancel]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: 'var(--status-fail-bg)',
            iconColor: 'var(--status-fail-text)',
            confirmBtnClass: 'btn-danger',
        },
        warning: {
            iconBg: 'var(--status-warn-bg)',
            iconColor: 'var(--status-warn-text)',
            confirmBtnClass: 'btn-warning',
        },
        primary: {
            iconBg: 'var(--brand-light)',
            iconColor: 'var(--brand)',
            confirmBtnClass: 'btn-primary',
        },
    };

    const currentStyle = variantStyles[variant] || variantStyles.danger;

    return (
        <div className="modal-backdrop anim-fade-in" onClick={loading ? undefined : onCancel}>
            <div
                className="modal"
                style={{ maxWidth: 440 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
            >
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                backgroundColor: currentStyle.iconBg,
                                color: currentStyle.iconColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {variant === 'primary' ? <IconInfo /> : <IconAlertTriangle />}
                        </div>
                        <h2 id="confirm-dialog-title" className="modal-title" style={{ fontSize: 'var(--text-base)' }}>
                            {title}
                        </h2>
                    </div>
                    {!loading && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-ghost btn-icon"
                            aria-label="Close"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="modal-body">
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {message}
                    </p>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary btn-sm"
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`btn btn-sm ${currentStyle.confirmBtnClass}`}
                        disabled={loading}
                        autoFocus
                    >
                        {loading ? 'Processing…' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
