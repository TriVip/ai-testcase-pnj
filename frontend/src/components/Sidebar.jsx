import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// SVG icons — inline for zero dependency
const IconDashboard = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

const IconTestCases = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const IconTestPlans = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const IconLogout = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
);

const IconMoon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
);

const IconSun = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const IconMenu = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { to: '/testcases', label: 'Test Cases', icon: <IconTestCases /> },
    { to: '/testplans', label: 'Test Plans', icon: <IconTestPlans /> },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Keyboard shortcuts: Cmd/Ctrl + 1/2/3
    useEffect(() => {
        const handleKey = (e) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            if (e.key === '1') { e.preventDefault(); navigate('/dashboard'); }
            if (e.key === '2') { e.preventDefault(); navigate('/testcases'); }
            if (e.key === '3') { e.preventDefault(); navigate('/testplans'); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [navigate]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    // Dark mode toggle
    const toggleDark = () => {
        document.documentElement.classList.toggle('dark');
    };
    const isDark = document.documentElement.classList.contains('dark');

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <IconMenu />
            </button>

            {/* Mobile overlay */}
            <div
                className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="Logo" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.4))' }} />
                    <span className="sidebar-logo-text">QA Manager</span>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <span className="sidebar-section-label">Navigation</span>
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar-item${isActive ? ' active' : ''}`
                            }
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDark}
                        className="sidebar-item"
                        style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none' }}
                        title="Toggle dark mode"
                    >
                        <span className="sidebar-item-icon">{isDark ? <IconSun /> : <IconMoon />}</span>
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    {/* User */}
                    {user && (
                        <div style={{ marginTop: 4 }}>
                            <div className="sidebar-user">
                                {user.picture ? (
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'var(--brand)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                                    }}>
                                        {user.name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div className="sidebar-user-info">
                                    <div className="sidebar-user-name">{user.name}</div>
                                    <div className="sidebar-user-email">{user.email}</div>
                                </div>
                                <button
                                    onClick={logout}
                                    title="Logout"
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-on-sidebar)', padding: 4,
                                        display: 'flex', alignItems: 'center',
                                        borderRadius: 'var(--radius)',
                                        opacity: 0.6,
                                        transition: 'opacity var(--transition)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                >
                                    <IconLogout />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
