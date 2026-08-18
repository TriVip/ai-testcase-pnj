import React from 'react';
import StatusTag from '../StatusTag';
import ActivityHistory from '../ActivityHistory';
import { testPlansAPI } from '../../services/api';

const naturalCompare = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStats = (plan) => {
    const tcs = plan.testCases || [];
    return {
        total: tcs.length,
        pass: tcs.filter((t) => t.executionStatus === 'Pass').length,
        failed: tcs.filter((t) => t.executionStatus === 'Failed').length,
        pending: tcs.filter((t) => t.executionStatus === 'Pending').length,
    };
};



const TestPlanDetailPanel = ({
    selectedPlan,
    onEdit,
    onExport,
    onDelete,
    deleting,
    onUpdateStatus,
    editingExec,
    setEditingExec,
    execStatus,
    setExecStatus,
    execNotes,
    setExecNotes,
    onSaveExecution,
    onSelectTC,
    onUpdateTCExecution,
    historyRefresh,
}) => {
    if (!selectedPlan) return null;

    const { total, pass, failed, pending } = getStats(selectedPlan);
    const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;

    // Group test cases by module/feature
    const tcs = selectedPlan.testCases || [];
    const featureMap = {};
    tcs.forEach((tc) => {
        const feat = tc.feature || 'General';
        if (!featureMap[feat]) featureMap[feat] = [];
        featureMap[feat].push(tc);
    });
    const featureNames = Object.keys(featureMap).sort(naturalCompare);

    return (
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
                    <button onClick={() => onEdit(selectedPlan)} className="btn btn-secondary btn-sm" title="Edit">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Edit
                    </button>
                    <button onClick={() => onExport(selectedPlan)} className="btn btn-secondary btn-sm" title="Export">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                        Export
                    </button>
                    <button
                        onClick={() => onDelete(selectedPlan._id)}
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
                {total > 0 && (
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Execution Progress</div>
                        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--status-pass-text)' }}>{pass}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Pass</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--status-fail-text)' }}>{failed}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Failed</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--status-pending-text)' }}>{pending}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Pending</div>
                            </div>
                            <div style={{ textAlign: 'center', marginLeft: 'auto' }}>
                                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--brand)' }}>{passRate}%</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Pass Rate</div>
                            </div>
                        </div>
                        <div className="progress-bar">
                            {pass > 0 && <div className="pb-pass" style={{ flex: pass }} title={`${pass} Pass`} />}
                            {failed > 0 && <div className="pb-fail" style={{ flex: failed }} title={`${failed} Failed`} />}
                            {pending > 0 && <div className="pb-pending" style={{ flex: pending }} title={`${pending} Pending`} />}
                        </div>
                    </div>
                )}

                {/* Status Update controls */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className="section-label">Plan Status:</span>
                        <select
                            value={selectedPlan.status}
                            onChange={(e) => onUpdateStatus(selectedPlan._id, e.target.value)}
                            className="input-field"
                            style={{ width: 'auto', fontSize: 'var(--text-xs)', padding: '2px 8px' }}
                        >
                            <option value="Planning">Planning</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Obsolete">Obsolete</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setEditingExec(editingExec ? null : selectedPlan._id);
                            setExecStatus(selectedPlan.executionStatus || 'Pending');
                            setExecNotes(selectedPlan.executionNotes || '');
                        }}
                        className="btn btn-secondary btn-sm"
                    >
                        {editingExec ? 'Cancel Status Update' : 'Update Execution Result'}
                    </button>
                </div>

                {/* Execution Result Form */}
                {editingExec === selectedPlan._id && (
                    <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Mark Plan Execution</div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                            {['Pass', 'Failed', 'Pending'].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setExecStatus(st)}
                                    className={`btn btn-sm ${execStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                                    style={execStatus === st ? {
                                        background: st === 'Pass' ? 'var(--status-pass)' : st === 'Failed' ? 'var(--status-fail)' : 'var(--status-pending)',
                                        borderColor: st === 'Pass' ? 'var(--status-pass)' : st === 'Failed' ? 'var(--status-fail)' : 'var(--status-pending)',
                                    } : {}}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={execNotes}
                            onChange={(e) => setExecNotes(e.target.value)}
                            placeholder="Execution notes / observations…"
                            className="input-field"
                            rows={3}
                            style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}
                        />
                        <button onClick={() => onSaveExecution(selectedPlan._id)} className="btn btn-primary btn-sm">
                            Save Execution Result
                        </button>
                    </div>
                )}

                {/* Test Cases Table grouped by module */}
                <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Test Cases ({tcs.length})</div>
                {tcs.length === 0 ? (
                    <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)' }}>
                        No test cases added to this plan yet. Edit the plan to add test cases.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {featureNames.map((feat) => {
                            const featTCs = featureMap[feat];
                            return (
                                <div key={feat} className="data-table-wrapper">
                                    <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        {feat} ({featTCs.length})
                                    </div>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th style={{ width: 130 }}>Quick Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {featTCs.map((tc) => (
                                                <tr key={tc._id} onClick={() => onSelectTC(tc, selectedPlan)}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <StatusTag status={tc.executionStatus || 'Pending'} variant="dot" showLabel={false} />
                                                            <span style={{ fontWeight: 500 }}>{tc.title}</span>
                                                        </div>
                                                    </td>
                                                    <td><StatusTag status={tc.priority || 'Medium'} /></td>
                                                    <td><StatusTag status={tc.executionStatus || 'Pending'} /></td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', gap: 3 }}>
                                                            {['Pass', 'Failed', 'Pending'].map((st) => (
                                                                <button
                                                                    key={st}
                                                                    onClick={() => onUpdateTCExecution(tc._id, st)}
                                                                    className="btn btn-ghost"
                                                                    style={{
                                                                        padding: '1px 5px',
                                                                        fontSize: 10,
                                                                        fontWeight: 600,
                                                                        color: st === 'Pass' ? 'var(--status-pass-text)' : st === 'Failed' ? 'var(--status-fail-text)' : 'var(--text-tertiary)',
                                                                        background: tc.executionStatus === st ? (st === 'Pass' ? 'var(--status-pass-bg)' : st === 'Failed' ? 'var(--status-fail-bg)' : 'var(--bg-surface-2)') : 'transparent',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                    }}
                                                                >
                                                                    {st[0]}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="divider" style={{ margin: 'var(--space-6) 0 var(--space-4)' }} />
                <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Plan History</div>
                <ActivityHistory historyFn={testPlansAPI.getHistory} entityId={selectedPlan._id} refreshToken={historyRefresh} />
            </div>
        </div>
    );
};

export default TestPlanDetailPanel;
