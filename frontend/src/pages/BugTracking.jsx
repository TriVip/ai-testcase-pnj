import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusTag from '../components/StatusTag';
import { SkeletonTable } from '../components/common/Skeleton';
import { testCasesAPI, testPlansAPI } from '../services/api';
import { buildTcToPlansMap } from '../utils/testPlanLookup';

const BugTracking = () => {
    const [testCases, setTestCases] = useState([]);
    const [testPlans, setTestPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixFilter, setFixFilter] = useState('All');
    const [openChooserId, setOpenChooserId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tcRes, planRes] = await Promise.all([
                testCasesAPI.getAll(),
                testPlansAPI.getAll(),
            ]);
            setTestCases(Array.isArray(tcRes.data) ? tcRes.data : (tcRes.data?.testCases || []));
            setTestPlans(Array.isArray(planRes.data) ? planRes.data : (planRes.data?.testPlans || []));
        } finally {
            setLoading(false);
        }
    };

    const tcToPlans = useMemo(() => buildTcToPlansMap(testPlans), [testPlans]);

    const bugCases = useMemo(
        () => testCases.filter((tc) => tc.bugType && (fixFilter === 'All' || tc.fixStatus === fixFilter)),
        [testCases, fixFilter]
    );

    const goToPlan = (planId, tcId) => {
        setOpenChooserId(null);
        navigate('/testplans', { state: { selectPlanId: planId, selectTCId: tcId } });
    };

    const handleQuickUpdateFixStatus = async (tcId, newStatus) => {
        setUpdatingId(tcId);
        try {
            const res = await testCasesAPI.update(tcId, { fixStatus: newStatus });
            setTestCases((prev) => prev.map((t) => (t._id === tcId ? res.data : t)));
        } catch (err) {
            console.error('Failed to update fix status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <AppShell>
            <div className="page-inner">
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Bug Tracking</h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {loading ? 'Loading logged issues…' : `${bugCases.length} test case${bugCases.length !== 1 ? 's' : ''} with a logged issue`}
                        </p>
                    </div>
                </div>

                <div className="filter-bar">
                    <select
                        value={fixFilter}
                        onChange={(e) => setFixFilter(e.target.value)}
                        className="input-field filter-select"
                        style={{ fontSize: 'var(--text-sm)' }}
                    >
                        <option value="All">All Fix Statuses</option>
                        <option value="Chưa fix">Chưa fix</option>
                        <option value="Đã fix">Đã fix</option>
                        <option value="Không fix">Không fix</option>
                    </select>
                </div>

                {loading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : bugCases.length === 0 ? (
                    <div className="empty-state panel">
                        <div className="empty-state-icon">🐛</div>
                        <div className="empty-state-title">No issues logged</div>
                        <div className="empty-state-desc">
                            Test cases with a bug/defect noted in their execution details will show up here.
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
                                    <th>Fix Status (Quick Update)</th>
                                    <th>Bug ID</th>
                                    <th className="col-actions-lg">Test Plan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bugCases.map((tc) => {
                                    const plans = tcToPlans[tc._id] || [];
                                    return (
                                        <tr key={tc._id}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{tc.title}</div>
                                                {tc.executionStatus && (
                                                    <div style={{ marginTop: 3 }}>
                                                        <StatusTag status={tc.executionStatus} />
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                {tc.feature || '—'}
                                            </td>
                                            <td style={{ fontSize: 'var(--text-sm)' }}>{tc.bugType}</td>
                                            <td style={{ fontSize: 'var(--text-sm)' }}>
                                                {tc.bugSeverity ? <StatusTag status={tc.bugSeverity} /> : '—'}
                                            </td>
                                            <td>
                                                <select
                                                    value={tc.fixStatus || ''}
                                                    onChange={(e) => handleQuickUpdateFixStatus(tc._id, e.target.value)}
                                                    disabled={updatingId === tc._id}
                                                    className="input-field"
                                                    style={{
                                                        fontSize: 'var(--text-xs)',
                                                        fontWeight: 600,
                                                        padding: '3px 8px',
                                                        width: 'auto',
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: tc.fixStatus === 'Đã fix' ? 'var(--status-pass-text)' : tc.fixStatus === 'Chưa fix' ? 'var(--status-fail-text)' : 'var(--text-secondary)',
                                                        background: tc.fixStatus === 'Đã fix' ? 'var(--status-pass-bg)' : tc.fixStatus === 'Chưa fix' ? 'var(--status-fail-bg)' : 'var(--bg-surface-2)',
                                                        borderColor: tc.fixStatus === 'Đã fix' ? 'var(--status-pass-border)' : tc.fixStatus === 'Chưa fix' ? 'var(--status-fail-border)' : 'var(--border)',
                                                    }}
                                                >
                                                    <option value="">None</option>
                                                    <option value="Chưa fix">Chưa fix</option>
                                                    <option value="Đã fix">Đã fix</option>
                                                    <option value="Không fix">Không fix</option>
                                                </select>
                                            </td>
                                            <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                                {tc.bugId || '—'}
                                            </td>
                                            <td style={{ position: 'relative' }}>
                                                {plans.length === 0 ? (
                                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                                        Not in any plan
                                                    </span>
                                                ) : plans.length === 1 ? (
                                                    <button
                                                        onClick={() => goToPlan(plans[0]._id, tc._id)}
                                                        className="btn btn-secondary btn-sm"
                                                    >
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
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    right: 0,
                                                                    zIndex: 20,
                                                                    marginTop: 4,
                                                                    background: 'var(--bg-surface)',
                                                                    border: '1px solid var(--border)',
                                                                    borderRadius: 'var(--radius)',
                                                                    boxShadow: 'var(--shadow-lg)',
                                                                    minWidth: 180,
                                                                    padding: '4px 0',
                                                                }}
                                                            >
                                                                {plans.map((plan) => (
                                                                    <button
                                                                        key={plan._id}
                                                                        onClick={() => goToPlan(plan._id, tc._id)}
                                                                        style={{
                                                                            display: 'block',
                                                                            width: '100%',
                                                                            textAlign: 'left',
                                                                            padding: '6px 12px',
                                                                            background: 'transparent',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            fontSize: 'var(--text-sm)',
                                                                            color: 'var(--text-primary)',
                                                                        }}
                                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)')}
                                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
