import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import StatusTag from '../components/StatusTag';
import { testPlansAPI, testCasesAPI, jiraAPI } from '../services/api';
import { exportTestPlanToXLSX } from '../utils/exportToXLSX';
import TestPlanForm from '../components/TestPlanForm';

// Inline chevron icons
const ChevronDown = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const ChevronRight = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const getStats = (plan) => {
    const tcs = plan.testCases || [];
    return {
        total: tcs.length,
        pass: tcs.filter(t => t.executionStatus === 'Pass').length,
        failed: tcs.filter(t => t.executionStatus === 'Failed').length,
        pending: tcs.filter(t => t.executionStatus === 'Pending').length,
    };
};

const MiniProgressBar = ({ plan }) => {
    const { total, pass, failed, pending } = getStats(plan);
    if (total === 0) return null;
    return (
        <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
            {pass > 0 && <div className="pb-pass" style={{ flex: pass }} title={`${pass} Pass`} />}
            {failed > 0 && <div className="pb-fail" style={{ flex: failed }} title={`${failed} Failed`} />}
            {pending > 0 && <div className="pb-pending" style={{ flex: pending }} title={`${pending} Pending`} />}
        </div>
    );
};

const TestPlans = () => {
    const [testPlans, setTestPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTestPlan, setEditingTestPlan] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedTC, setSelectedTC] = useState(null);
    const [expandedPlans, setExpandedPlans] = useState(new Set());
    const [expandedFeatures, setExpandedFeatures] = useState(new Set());
    const [editingExec, setEditingExec] = useState(null);
    const [execStatus, setExecStatus] = useState('Pending');
    const [execNotes, setExecNotes] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [isCreatingJira, setIsCreatingJira] = useState(false);

    useEffect(() => { fetchTestPlans(); }, []);

    const fetchTestPlans = async () => {
        try {
            const res = await testPlansAPI.getAll();
            setTestPlans(res.data || []);
        } catch { console.error('Failed to load plans'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this test plan?')) return;
        setDeleting(true);
        try {
            await testPlansAPI.delete(id);
            setTestPlans(prev => prev.filter(p => p._id !== id));
            if (selectedPlan?._id === id) { setSelectedPlan(null); setSelectedTC(null); }
        } catch { alert('Failed to delete test plan'); }
        finally { setDeleting(false); }
    };

    const handleEdit = (plan) => { setEditingTestPlan(plan); setShowForm(true); };
    const handleFormClose = () => { setShowForm(false); setEditingTestPlan(null); fetchTestPlans(); };

    const handleUpdateExecution = async () => {
        if (!selectedPlan) return;
        try {
            await testPlansAPI.update(selectedPlan._id, { executionStatus: execStatus, executionNotes: execNotes });
            setEditingExec(null);
            fetchTestPlans();
            const freshRes = await testPlansAPI.getAll();
            const fresh = freshRes.data.find(p => p._id === selectedPlan._id);
            if (fresh) setSelectedPlan(fresh);
        } catch { alert('Failed to update'); }
    };

    const handleUpdateTCExecution = async (tcId, status) => {
        try {
            await testCasesAPI.update(tcId, { executionStatus: status });
            fetchTestPlans();
            if (selectedTC?._id === tcId) {
                setSelectedTC(prev => ({ ...prev, executionStatus: status }));
            }
            // Refresh selected plan
            if (selectedPlan) {
                const res = await testPlansAPI.getAll();
                const updated = res.data.find(p => p._id === selectedPlan._id);
                if (updated) setSelectedPlan(updated);
            }
        } catch { alert('Failed to update test case execution'); }
    };

    const handleCreateJiraTicket = async () => {
        if (!selectedTC || !selectedPlan) return;
        setIsCreatingJira(true);
        try {
            const res = await jiraAPI.createTicket({
                testCaseId: selectedTC._id,
                planId: selectedPlan._id
            });
            // Update local state
            setSelectedTC(prev => ({ ...prev, jiraTicketUrl: res.data.ticketUrl }));
            fetchTestPlans();

            // Show toast or alert
            alert('Jira ticket created successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to create Jira ticket: ' + (error.response?.data?.message || 'Check console for details'));
        } finally {
            setIsCreatingJira(false);
        }
    };

    const togglePlan = (id) => {
        setExpandedPlans(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const toggleFeature = (planId, feat) => {
        const key = `${planId}|${feat}`;
        setExpandedFeatures(prev => {
            const s = new Set(prev);
            s.has(key) ? s.delete(key) : s.add(key);
            return s;
        });
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

    if (loading) {
        return (
            <AppShell>
                <div className="page-inner" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                    <div className="spinner spinner-lg" /> Loading test plans…
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="page-inner">
                {/* Header */}
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Test Plans</h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {testPlans.length} total plans
                        </p>
                    </div>
                    <div className="page-header-actions">
                        <button onClick={() => { setEditingTestPlan(null); setShowForm(true); }} className="btn btn-primary btn-sm">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            New Test Plan
                        </button>
                    </div>
                </div>

                {testPlans.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-title">No test plans yet</div>
                        <div className="empty-state-desc">Create your first test plan to organize test cases into cycles</div>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">Create Test Plan</button>
                    </div>
                ) : (
                    <div className="testplans-layout">

                        {/* LEFT PANEL — Plan Tree */}
                        <div className="testplans-tree-panel">
                            {/* Panel header */}
                            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plans</span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{testPlans.length}</span>
                            </div>

                            <div style={{ padding: 'var(--space-2)' }}>
                                {testPlans.map(plan => {
                                    const isSelected = selectedPlan?._id === plan._id && !selectedTC;
                                    const stats = getStats(plan);
                                    // Group TCs by feature
                                    const byFeature = (plan.testCases || []).reduce((acc, tc) => {
                                        const f = tc.feature || 'General';
                                        if (!acc[f]) acc[f] = [];
                                        acc[f].push(tc);
                                        return acc;
                                    }, {});

                                    return (
                                        <div key={plan._id} style={{ marginBottom: 2 }}>
                                            {/* Plan row */}
                                            <div
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
                                                    padding: 'var(--space-2) var(--space-2)',
                                                    borderRadius: 'var(--radius)',
                                                    background: isSelected ? 'var(--brand-light)' : 'transparent',
                                                    border: `1px solid ${isSelected ? 'var(--brand-muted)' : 'transparent'}`,
                                                    cursor: 'pointer',
                                                    transition: 'background var(--transition)',
                                                }}
                                                onClick={() => { setSelectedPlan(plan); setSelectedTC(null); }}
                                            >
                                                <button
                                                    onClick={e => { e.stopPropagation(); togglePlan(plan._id); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px 0', flexShrink: 0, lineHeight: 0, marginTop: 1 }}
                                                >
                                                    {expandedPlans.has(plan._id) ? <ChevronDown /> : <ChevronRight />}
                                                </button>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: 3 }}>
                                                        {plan.name}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <StatusTag status={plan.status} />
                                                        {stats.total > 0 && (
                                                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                                                                {stats.pass}✓ {stats.failed > 0 && <span style={{ color: 'var(--status-fail)' }}>{stats.failed}✗</span>} {stats.pending}…
                                                            </span>
                                                        )}
                                                    </div>
                                                    <MiniProgressBar plan={plan} />
                                                </div>
                                            </div>

                                            {/* Expanded: feature groups → TCs */}
                                            {expandedPlans.has(plan._id) && Object.entries(byFeature).map(([feat, tcs]) => {
                                                const fkey = `${plan._id}|${feat}`;
                                                const featExpanded = expandedFeatures.has(fkey);
                                                return (
                                                    <div key={feat} style={{ marginLeft: 20, marginTop: 1 }}>
                                                        {/* Feature group header */}
                                                        <div
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 4, padding: '3px var(--space-2)',
                                                                background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)',
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() => toggleFeature(plan._id, feat)}
                                                        >
                                                            <span style={{ lineHeight: 0, color: 'var(--text-tertiary)' }}>{featExpanded ? <ChevronDown /> : <ChevronRight />}</span>
                                                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{feat}</span>
                                                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{tcs.length}</span>
                                                        </div>

                                                        {/* TC list */}
                                                        {featExpanded && tcs.map(tc => {
                                                            const isTCSelected = selectedTC?._id === tc._id;
                                                            return (
                                                                <div
                                                                    key={tc._id}
                                                                    style={{
                                                                        marginLeft: 12, marginTop: 1,
                                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                                        padding: '3px var(--space-2)',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        background: isTCSelected ? 'var(--brand-light)' : 'transparent',
                                                                        border: `1px solid ${isTCSelected ? 'var(--brand-muted)' : 'transparent'}`,
                                                                        cursor: 'pointer',
                                                                        transition: 'background var(--transition)',
                                                                    }}
                                                                    onClick={() => { setSelectedTC(tc); setSelectedPlan(null); }}
                                                                >
                                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: tc.executionStatus === 'Pass' ? 'var(--status-pass)' : tc.executionStatus === 'Failed' ? 'var(--status-fail)' : 'var(--status-pending)', flexShrink: 0 }} />
                                                                    <span className="truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', flex: 1 }}>
                                                                        {tc.title}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT PANEL — Detail */}
                        <div className="testplans-detail-panel">
                            {selectedTC ? (
                                /* Test Case detail */
                                <div className="panel">
                                    <div className="panel-header">
                                        <div>
                                            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>{selectedTC.title}</div>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                                <StatusTag status={selectedTC.priority || 'Medium'} />
                                                <StatusTag status={selectedTC.executionStatus || 'Pending'} />
                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{selectedTC.category}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedTC(null)} className="btn btn-ghost btn-icon">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    </div>
                                    <div className="panel-body">
                                        {selectedTC.description && (
                                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                                <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Description</div>
                                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedTC.description}</p>
                                            </div>
                                        )}

                                        {selectedTC.steps?.length > 0 && (
                                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                                <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Test Steps</div>
                                                <div className="step-list">
                                                    {selectedTC.steps.map((step, i) => (
                                                        <div key={i} className="step-item">
                                                            <span className="step-number">{step.stepNumber}</span>
                                                            <div className="step-body">
                                                                <div className="step-action">{step.action}</div>
                                                                {step.expectedResult && <div className="step-expected">{step.expectedResult}</div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="divider" style={{ marginBottom: 'var(--space-5)' }} />

                                        <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Mark Execution Result</div>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            {['Pass', 'Failed', 'Pending'].map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => handleUpdateTCExecution(selectedTC._id, st)}
                                                    className={`btn btn-sm ${selectedTC.executionStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={selectedTC.executionStatus === st ? {
                                                        background: st === 'Pass' ? 'var(--status-pass)' : st === 'Failed' ? 'var(--status-fail)' : 'var(--status-pending)',
                                                        borderColor: st === 'Pass' ? 'var(--status-pass)' : st === 'Failed' ? 'var(--status-fail)' : 'var(--status-pending)',
                                                    } : {}}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Jira Ticket Section */}
                                        {selectedTC.executionStatus === 'Failed' && (
                                            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--status-fail)' }}>
                                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Jira Integration</div>
                                                {selectedTC.jiraTicketUrl ? (
                                                    <a href={selectedTC.jiraTicketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                        View Jira Ticket
                                                    </a>
                                                ) : (
                                                    <button
                                                        onClick={handleCreateJiraTicket}
                                                        className="btn btn-primary btn-sm"
                                                        disabled={isCreatingJira}
                                                    >
                                                        {isCreatingJira ? 'Creating...' : 'Create Jira Ticket'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : selectedPlan ? (
                                /* Test Plan detail */
                                <div className="panel">
                                    <div className="panel-header">
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>{selectedPlan.name}</h2>
                                                <StatusTag status={selectedPlan.status} />
                                                <StatusTag status={selectedPlan.executionStatus || 'Pending'} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            <button onClick={() => handleEdit(selectedPlan)} className="btn btn-secondary btn-sm" title="Edit">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => exportTestPlanToXLSX(selectedPlan, `${selectedPlan.name.replace(/\s+/g, '-')}.xlsx`)}
                                                className="btn btn-secondary btn-sm" title="Export"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                                Export
                                            </button>
                                            <button
                                                onClick={() => { handleDelete(selectedPlan._id); }}
                                                className="btn btn-danger btn-sm"
                                                disabled={deleting}
                                                style={{ opacity: deleting ? 0.6 : 1 }}
                                            >
                                                {deleting ? 'Deleting…' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="panel-body">
                                        {/* Description */}
                                        {selectedPlan.description && (
                                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                                <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Description</div>
                                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedPlan.description}</p>
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        {selectedPlan.startDate && (
                                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                                <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>Timeline</div>
                                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                    {fmtDate(selectedPlan.startDate)} — {selectedPlan.endDate ? fmtDate(selectedPlan.endDate) : 'Ongoing'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Stats row */}
                                        {(() => {
                                            const { total, pass, failed, pending } = getStats(selectedPlan);
                                            if (total === 0) return null;
                                            const pct = Math.round((pass / total) * 100);
                                            return (
                                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                                    <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Execution Progress</div>
                                                    <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--status-pass-text)' }}>{pass}</div>
                                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Passed</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--status-fail-text)' }}>{failed}</div>
                                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Failed</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-secondary)' }}>{pending}</div>
                                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Pending</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', marginLeft: 'auto' }}>
                                                            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: pct >= 80 ? 'var(--status-pass-text)' : pct >= 50 ? 'var(--status-warn-text)' : 'var(--status-fail-text)' }}>{pct}%</div>
                                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Pass Rate</div>
                                                        </div>
                                                    </div>
                                                    {/* Full progress bar */}
                                                    <div className="progress-bar" style={{ height: 8, borderRadius: 4 }}>
                                                        {pass > 0 && <div className="pb-pass" style={{ flex: pass }} />}
                                                        {failed > 0 && <div className="pb-fail" style={{ flex: failed }} />}
                                                        {pending > 0 && <div className="pb-pending" style={{ flex: pending }} />}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Test Cases table */}
                                        {selectedPlan.testCases?.length > 0 && (
                                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                                <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
                                                    Test Cases ({selectedPlan.testCases.length})
                                                </div>
                                                <div className="data-table-wrapper">
                                                    <table className="data-table">
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Title</th>
                                                                <th>Priority</th>
                                                                <th>Status</th>
                                                                <th>Set Result</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedPlan.testCases.map((tc, i) => (
                                                                <tr key={tc._id}>
                                                                    <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{i + 1}</td>
                                                                    <td>
                                                                        <div style={{ fontWeight: 500 }}>{tc.title}</div>
                                                                        {tc.feature && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{tc.feature}</div>}
                                                                    </td>
                                                                    <td><StatusTag status={tc.priority || 'Medium'} /></td>
                                                                    <td><StatusTag status={tc.executionStatus || 'Pending'} /></td>
                                                                    <td>
                                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                                            {['Pass', 'Failed', 'Pending'].map(s => (
                                                                                <button
                                                                                    key={s}
                                                                                    onClick={() => handleUpdateTCExecution(tc._id, s)}
                                                                                    className="btn btn-ghost btn-sm"
                                                                                    style={{
                                                                                        padding: '1px 6px',
                                                                                        fontSize: 11,
                                                                                        fontWeight: tc.executionStatus === s ? 700 : 400,
                                                                                        color: tc.executionStatus === s
                                                                                            ? (s === 'Pass' ? 'var(--status-pass-text)' : s === 'Failed' ? 'var(--status-fail-text)' : 'var(--text-secondary)')
                                                                                            : 'var(--text-tertiary)',
                                                                                        background: tc.executionStatus === s
                                                                                            ? (s === 'Pass' ? 'var(--status-pass-bg)' : s === 'Failed' ? 'var(--status-fail-bg)' : 'var(--bg-surface-2)')
                                                                                            : 'transparent',
                                                                                    }}
                                                                                >{s}</button>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Overall execution update */}
                                        <div className="divider" style={{ marginBottom: 'var(--space-5)' }} />
                                        <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Overall Execution Result</div>
                                        {editingExec ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                    {['Pending', 'Pass', 'Failed'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setExecStatus(s)}
                                                            className={`btn btn-sm ${execStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                                                        >{s}</button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={execNotes}
                                                    onChange={e => setExecNotes(e.target.value)}
                                                    placeholder="Execution notes (optional)…"
                                                    className="input-field"
                                                    rows={3}
                                                />
                                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                    <button onClick={handleUpdateExecution} className="btn btn-primary btn-sm">Save</button>
                                                    <button onClick={() => setEditingExec(null)} className="btn btn-secondary btn-sm">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                {selectedPlan.executionNotes && (
                                                    <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--brand-light)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--brand)' }}>
                                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{selectedPlan.executionNotes}</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => { setEditingExec(true); setExecStatus(selectedPlan.executionStatus || 'Pending'); setExecNotes(selectedPlan.executionNotes || ''); }}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Update Execution Result
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ height: '100%', justifyContent: 'center' }}>
                                    <div className="empty-state-icon">←</div>
                                    <div className="empty-state-title">Select a test plan</div>
                                    <div className="empty-state-desc">Click a plan to view details, or expand it to select a test case</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showForm && (
                <TestPlanForm testPlan={editingTestPlan} onClose={handleFormClose} />
            )}
        </AppShell>
    );
};

export default TestPlans;
