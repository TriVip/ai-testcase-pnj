import { useEffect, useState } from 'react';

const ICONS = {
    success: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--status-pass)', flexShrink: 0, marginTop: 1 }}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    error: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--status-fail)', flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    warning: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--status-warn)', flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    info: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
};

const TYPE_CLASS = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warn',
    info: 'toast-info',
};

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 250);
        }, duration);
        return () => clearTimeout(t);
    }, [duration, onClose]);

    return (
        <div
            className={`toast ${TYPE_CLASS[type] || 'toast-info'}`}
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(16px)', transition: 'opacity 200ms, transform 200ms' }}
        >
            {ICONS[type]}
            <span className="toast-msg">{message}</span>
            <button
                onClick={() => { setVisible(false); setTimeout(onClose, 250); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, lineHeight: 0, flexShrink: 0 }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => (
    <div className="toast-container">
        {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} duration={t.duration} onClose={() => removeToast(t.id)} />
        ))}
    </div>
);

export const useToast = () => {
    const [toasts, setToasts] = useState([]);
    const add = (message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
    return {
        toasts,
        removeToast,
        success: (msg, dur) => add(msg, 'success', dur),
        error: (msg, dur) => add(msg, 'error', dur),
        warning: (msg, dur) => add(msg, 'warning', dur),
        info: (msg, dur) => add(msg, 'info', dur),
    };
};

export default Toast;
