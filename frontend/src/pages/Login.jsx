import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const IconSun = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const IconMoon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const Login = () => {
    const { loginWithCredentials, registerUser } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
    });

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await registerUser(formData);
            } else {
                await loginWithCredentials(formData.username, formData.password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--bg-app)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-4)',
                position: 'relative',
            }}
        >
            {/* Dark mode toggle top-right */}
            <button
                onClick={() => setIsDark((prev) => !prev)}
                className="btn btn-secondary btn-sm"
                style={{
                    position: 'absolute',
                    top: 'var(--space-4)',
                    right: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDark ? <IconSun /> : <IconMoon />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <div style={{ maxWidth: 440, width: '100%' }}>
                <div
                    className="panel anim-fade-in"
                    style={{
                        padding: 'var(--space-8)',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                    }}
                >
                    {/* Logo & Header */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                        <img
                            src="/logo.png"
                            alt="Logo"
                            style={{
                                width: 64,
                                height: 64,
                                objectFit: 'contain',
                                marginBottom: 'var(--space-3)',
                                filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.25))',
                            }}
                        />
                        <h1
                            style={{
                                fontSize: 'var(--text-2xl)',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                textAlign: 'center',
                                margin: 0,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            QA Manager
                        </h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', textAlign: 'center' }}>
                            {isRegister ? 'Create your team workspace account' : 'Sign in to your QA management account'}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div
                            style={{
                                marginBottom: 'var(--space-4)',
                                padding: 'var(--space-3)',
                                backgroundColor: 'var(--status-fail-bg)',
                                border: '1px solid var(--status-fail-border)',
                                color: 'var(--status-fail-text)',
                                borderRadius: 'var(--radius)',
                                fontSize: 'var(--text-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Auth Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="input-field"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field"
                                placeholder="Enter your password"
                            />
                        </div>

                        {isRegister && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                        placeholder="name@company.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g. Alex Nguyen"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-2)' }}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="spinner" style={{ borderTopColor: '#fff' }} />
                                    <span>Please wait…</span>
                                </div>
                            ) : (
                                <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
                            )}
                        </button>
                    </form>

                    {/* Toggle Login / Register */}
                    <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                            className="btn btn-ghost"
                            style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)' }}
                        >
                            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                        </button>
                    </div>

                    {/* Features checklist */}
                    <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Enterprise Features
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--status-pass-text)', fontWeight: 'bold' }}>✓</span>
                                <span>AI-Powered Test Case & Plan Generation</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--status-pass-text)', fontWeight: 'bold' }}>✓</span>
                                <span>Multi-Tenant Workspaces & Real-Time Sync</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--status-pass-text)', fontWeight: 'bold' }}>✓</span>
                                <span>Defect Tracking & Excel/CSV Import & Export</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
