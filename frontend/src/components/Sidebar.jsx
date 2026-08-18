import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WorkspaceSelector from './WorkspaceSelector';

const IconDashboard = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

const IconTestCases = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const IconTestPlans = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

const IconBug = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="14" x="8" y="6" rx="4" />
        <path d="m19 7-3 2" /><path d="m5 7 3 2" />
        <path d="m19 19-3-2" /><path d="m5 19 3-2" />
        <path d="M20 13h-4" /><path d="M4 13h4" />
        <path d="m10 4 1 2" /><path d="m14 4-1 2" />
    </svg>
);

const IconAutomation = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
);

const IconMoon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const IconSun = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const IconLogout = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const IconCollapse = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="11 17 6 12 11 7" />
        <polyline points="18 17 13 12 18 7" />
    </svg>
);

const IconExpand = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
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
    { to: '/dashboard', label: 'Dashboard', icon: <IconDashboard />, shortcut: '1' },
    { to: '/testcases', label: 'Test Cases', icon: <IconTestCases />, shortcut: '2' },
    { to: '/testplans', label: 'Test Plans', icon: <IconTestPlans />, shortcut: '3' },
    { to: '/bugtracking', label: 'Bug Tracking', icon: <IconBug />, shortcut: '4' },
    { to: '/automation', label: 'Automation', icon: <IconAutomation />, shortcut: '5' },
];

const Sidebar = ({ onOpenShortcuts }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    // Sync theme class and persistence
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Sync collapsed class and persistence
    useEffect(() => {
        if (isCollapsed) {
            document.documentElement.classList.add('sidebar-collapsed');
            localStorage.setItem('sidebar_collapsed', 'true');
        } else {
            document.documentElement.classList.remove('sidebar-collapsed');
            localStorage.setItem('sidebar_collapsed', 'false');
        }
    }, [isCollapsed]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Keyboard shortcuts: Cmd/Ctrl + 1..5
    useEffect(() => {
        const handleKey = (e) => {
            // Ignore if typing in input/textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                onOpenShortcuts?.();
                return;
            }

            if (!(e.metaKey || e.ctrlKey)) return;
            if (e.key === '1') { e.preventDefault(); navigate('/dashboard'); }
            if (e.key === '2') { e.preventDefault(); navigate('/testcases'); }
            if (e.key === '3') { e.preventDefault(); navigate('/testplans'); }
            if (e.key === '4') { e.preventDefault(); navigate('/bugtracking'); }
            if (e.key === '5') { e.preventDefault(); navigate('/automation'); }
            if (e.key === 'b') { e.preventDefault(); setIsCollapsed((prev) => !prev); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [navigate, onOpenShortcuts]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const toggleDark = () => {
        setIsDark((prev) => !prev);
    };

    const toggleCollapse = () => {
        setIsCollapsed((prev) => !prev);
    };

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
                {/* Logo & Desktop Collapse Toggle */}
                <div className="sidebar-logo" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                        <img
                            src="/logo.png"
                            alt="Logo"
                            style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.4))' }}
                        />
                        {!isCollapsed && <span className="sidebar-logo-text">QA Manager</span>}
                    </div>
                    {!isCollapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="btn btn-ghost btn-icon"
                            title="Collapse sidebar (Cmd+B)"
                            style={{ color: 'var(--text-on-sidebar)', padding: 4, width: 24, height: 24 }}
                        >
                            <IconCollapse />
                        </button>
                    )}
                </div>

                {/* Workspace Selector (hidden or icon-only when collapsed) */}
                {!isCollapsed && <WorkspaceSelector />}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {!isCollapsed && <span className="sidebar-section-label">Navigation</span>}
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            title={isCollapsed ? `${item.label} (Cmd+${item.shortcut})` : undefined}
                            className={({ isActive }) =>
                                `sidebar-item${isActive ? ' active' : ''}${isCollapsed ? ' sidebar-item-collapsed' : ''}`
                            }
                            style={isCollapsed ? { justifyContent: 'center', padding: 'var(--space-2)' } : {}}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            {!isCollapsed && <span>{item.label}</span>}
                            {!isCollapsed && item.shortcut && (
                                <span className="sidebar-item-shortcut">{item.shortcut}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* Expand button if collapsed */}
                    {isCollapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="sidebar-item"
                            style={{ justifyContent: 'center', width: '100%', border: 'none', cursor: 'pointer', background: 'none', padding: 'var(--space-2)' }}
                            title="Expand sidebar (Cmd+B)"
                        >
                            <span className="sidebar-item-icon"><IconExpand /></span>
                        </button>
                    )}

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDark}
                        className="sidebar-item"
                        style={{
                            width: '100%',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'none',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            padding: isCollapsed ? 'var(--space-2)' : 'var(--space-2) var(--space-3)',
                        }}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <span className="sidebar-item-icon">{isDark ? <IconSun /> : <IconMoon />}</span>
                        {!isCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {/* User */}
                    {user && (
                        <div style={{ marginTop: 4 }}>
                            <div
                                className="sidebar-user"
                                style={isCollapsed ? { justifyContent: 'center', padding: 'var(--space-2)' } : {}}
                                title={isCollapsed ? `${user.name} (${user.email})` : undefined}
                            >
                                {user.picture ? (
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            background: 'var(--brand)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: '#fff',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {user.name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                {!isCollapsed && (
                                    <>
                                        <div className="sidebar-user-info">
                                            <div className="sidebar-user-name">{user.name}</div>
                                            <div className="sidebar-user-email">{user.email}</div>
                                        </div>
                                        <button
                                            onClick={logout}
                                            title="Logout"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-on-sidebar)',
                                                padding: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderRadius: 'var(--radius)',
                                                opacity: 0.6,
                                                transition: 'opacity var(--transition)',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                                            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
                                        >
                                            <IconLogout />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
