import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/AppShell';
import { testCasesAPI, testPlansAPI } from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentTCs, setRecentTCs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [tcRes, plansRes] = await Promise.all([
                    testCasesAPI.getAll(),
                    testPlansAPI.getAll(),
                ]);
                const tcs = tcRes.data || [];
                const plans = plansRes.data || [];

                const pass = tcs.filter(t => t.executionStatus === 'Pass').length;
                const failed = tcs.filter(t => t.executionStatus === 'Failed').length;
                const pending = tcs.filter(t => t.executionStatus === 'Pending').length;
                const activePlans = plans.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
                const passRate = tcs.length > 0 ? Math.round((pass / tcs.length) * 100) : 0;

                setStats({ total: tcs.length, pass, failed, pending, passRate, activePlans, totalPlans: plans.length });
                // Recent: last 8 TCs sorted by updatedAt or createdAt
                const sorted = [...tcs].sort((a, b) =>
                    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
                );
                setRecentTCs(sorted.slice(0, 8));
            } catch {
                setStats({ total: 0, pass: 0, failed: 0, pending: 0, passRate: 0, activePlans: 0, totalPlans: 0 });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const fmtDate = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const StatusDot = ({ status }) => {
        const map = {
            Pass: 'var(--status-pass)',
            Failed: 'var(--status-fail)',
            Pending: 'var(--status-pending)',
        };
        return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: map[status] || map.Pending, marginRight: 4 }} />;
    };

    return (
        <AppShell>
            <div className="page-inner">
                {/* Page header */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h1 className="page-title">Dashboard</h1>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                        Overview for {user?.name || 'QA Team'}
                    </p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        <div className="spinner" /> Loading metrics…
                    </div>
                ) : (
                    <>
                        {/* KPI Strip */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 'var(--space-4)',
                            marginBottom: 'var(--space-8)',
                        }}>
                            <div className="kpi-tile">
                                <div className="kpi-label">Total Test Cases</div>
                                <div className="kpi-value">{stats.total}</div>
                                <div className="kpi-delta" style={{ marginTop: 2 }}>
                                    <span style={{ color: 'var(--status-pass-text)' }}>{stats.pass} pass</span>
                                    {' · '}
                                    <span style={{ color: 'var(--status-fail-text)' }}>{stats.failed} fail</span>
                                    {' · '}
                                    <span>{stats.pending} pending</span>
                                </div>
                            </div>

                            <div className="kpi-tile" style={{ borderTopColor: stats.passRate >= 80 ? 'var(--status-pass)' : stats.passRate >= 50 ? 'var(--status-warn)' : 'var(--status-fail)', borderTopWidth: 2 }}>
                                <div className="kpi-label">Pass Rate</div>
                                <div className="kpi-value" style={{ color: stats.passRate >= 80 ? 'var(--status-pass-text)' : stats.passRate >= 50 ? 'var(--status-warn-text)' : 'var(--status-fail-text)' }}>
                                    {stats.passRate}%
                                </div>
                                <div className="kpi-delta">of {stats.total} executed</div>
                            </div>

                            <div className="kpi-tile">
                                <div className="kpi-label">Active Test Plans</div>
                                <div className="kpi-value">{stats.activePlans}</div>
                                <div className="kpi-delta">{stats.totalPlans} total plans</div>
                            </div>

                            <div className="kpi-tile" style={{ borderTopColor: stats.failed > 0 ? 'var(--status-fail)' : 'transparent', borderTopWidth: 2 }}>
                                <div className="kpi-label">Failed</div>
                                <div className="kpi-value" style={{ color: stats.failed > 0 ? 'var(--status-fail-text)' : 'var(--text-primary)' }}>{stats.failed}</div>
                                <div className="kpi-delta">require attention</div>
                            </div>
                        </div>

                        {/* Two-column content area */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-6)', alignItems: 'start' }}>
                            {/* Recent Test Cases */}
                            <div className="panel">
                                <div className="panel-header">
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                                        <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Recent Test Cases</span>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>last modified</span>
                                    </div>
                                    <Link to="/testcases" style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)' }}>
                                        View all →
                                    </Link>
                                </div>
                                {recentTCs.length === 0 ? (
                                    <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                        <div className="empty-state-title">No test cases yet</div>
                                        <Link to="/testcases" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                                            Create Test Case
                                        </Link>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Modified</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTCs.map(tc => (
                                                <tr key={tc._id}>
                                                    <td style={{ maxWidth: 280 }}>
                                                        <span className="truncate" style={{ display: 'block', fontWeight: 500 }}>{tc.title}</span>
                                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{tc.category || '—'}</span>
                                                    </td>
                                                    <td><span className={`status-tag prio-${tc.priority?.toLowerCase()}`}>{tc.priority}</span></td>
                                                    <td>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                            <StatusDot status={tc.executionStatus} />
                                                            <span style={{ fontSize: 'var(--text-xs)' }}>{tc.executionStatus || 'Pending'}</span>
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                                                        {fmtDate(tc.updatedAt || tc.createdAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="panel">
                                    <div className="panel-header" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Quick Actions</span>
                                    </div>
                                    <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)' }}>
                                        <Link to="/testcases" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                            New Test Case
                                        </Link>
                                        <Link to="/testplans" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                            New Test Plan
                                        </Link>
                                        <Link to="/testcases" className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                            Import Test Cases
                                        </Link>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
};

export default Dashboard;
