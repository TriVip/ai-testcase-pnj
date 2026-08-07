import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusTag from '../components/StatusTag';
import { testCasesAPI, testPlansAPI } from '../services/api';
import { buildTcToPlansMap } from '../utils/testPlanLookup';

const BugTracking = () => {
    const [testCases, setTestCases] = useState([]);
    const [testPlans, setTestPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixFilter, setFixFilter] = useState('All');
    const [openChooserId, setOpenChooserId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([testCasesAPI.getAll(), testPlansAPI.getAll()])
            .then(([tcRes, planRes]) => {
                setTestCases(tcRes.data || []);
                setTestPlans(planRes.data || []);
            })
            .finally(() => setLoading(false));
    }, []);

    const tcToPlans = useMemo(() => buildTcToPlansMap(testPlans), [testPlans]);

    // Every test case that has ever had a bug logged, fixed or not —
    // this is a history of issues, not just a currently-open list.
    const bugCases = useMemo(
        () => testCases.filter(tc => tc.bugType && (fixFilter === 'All' || tc.fixStatus === fixFilter)),
        [testCases, fixFilter]
    );

    const goToPlan = (planId, tcId) => {
        setOpenChooserId(null);
        navigate('/testplans', { state: { selectPlanId: planId, selectTCId: tcId } });
    };

    if (loading) {
        return (
            <AppShell>
                <div className="page-inner" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                    <div className="spinner spinner-lg" /> Loading bug tracking…
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="page-inner">
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Bug Tracking</h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {bugCases.length} test case{bugCases.length !== 1 ? 's' : ''} with a logged issue
                        </p>
                    </div>
                </div>

                <div className="filter-bar">
                    <select
                        value={fixFilter}
                        onChange={e => setFixFilter(e.target.value)}
                        className="input-field filter-select"
                        style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
                    >
                        <option value="All">All Fix Statuses</option>
                        <option value="Chưa fix">Chưa fix</option>
                        <option value="Đã fix">Đã fix</option>
                        <option value="Không fix">Không fix</option>
                    </select>
                </div>

                {bugCases.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🐛</div>
                        <div className="empty-state-title">No issues logged</div>
                        <div className="empty-state-desc">
                            Test cases with a bug/issue noted in their execution details will show up here.
                        </div>
                    </div>
                ) : (
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Feature/Module</th>
                                    <th>Type</th>
                                    <th>Severity</th>
                                    <th>Fix Status</th>
                                    <th>Bug ID</th>
                                    <th style={{ width: 160 }}>Test Plan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bugCases.map(tc => {
                                    const plans = tcToPlans[tc._id] || [];
                                    return (
                                        <tr key={tc._id}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{tc.title}</div>
                                                {tc.executionStatus && (
                                                    <div style={{ marginTop: 2 }}><StatusTag status={tc.executionStatus} /></div>
                                                )}
                                            </td>
                                            <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{tc.feature || '—'}</td>
                                            <td style={{ fontSize: 'var(--text-sm)' }}>{tc.bugType}</td>
                                            <td style={{ fontSize: 'var(--text-sm)' }}>{tc.bugSeverity || '—'}</td>
                                            <td>
                                                <span style={{
                                                    fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                                    color: tc.fixStatus === 'Đã fix' ? 'var(--status-pass-text)' : tc.fixStatus === 'Chưa fix' ? 'var(--status-fail-text)' : 'var(--text-tertiary)',
                                                    background: tc.fixStatus === 'Đã fix' ? 'var(--status-pass-bg)' : tc.fixStatus === 'Chưa fix' ? 'var(--status-fail-bg)' : 'var(--bg-surface-2)',
                                                }}>
                                                    {tc.fixStatus || '—'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{tc.bugId || '—'}</td>
                                            <td style={{ position: 'relative' }}>
                                                {plans.length === 0 ? (
                                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Not in any plan</span>
                                                ) : plans.length === 1 ? (
                                                    <button onClick={() => goToPlan(plans[0]._id, tc._id)} className="btn btn-secondary btn-sm">
                                                        View in Plan
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setOpenChooserId(openChooserId === tc._id ? null : tc._id)}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            View in Plan ({plans.length}) ▾
                                                        </button>
                                                        {openChooserId === tc._id && (
                                                            <div style={{
                                                                position: 'absolute', top: '100%', right: 0, zIndex: 20, marginTop: 4,
                                                                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                                                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                                                                minWidth: 180, padding: '4px 0',
                                                            }}>
                                                                {plans.map(plan => (
                                                                    <button
                                                                        key={plan._id}
                                                                        onClick={() => goToPlan(plan._id, tc._id)}
                                                                        style={{
                                                                            display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px',
                                                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                                                            fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)'}
                                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        {plan.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default BugTracking;
