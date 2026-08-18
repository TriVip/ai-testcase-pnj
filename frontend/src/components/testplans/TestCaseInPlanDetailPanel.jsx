import React from 'react';
import StatusTag from '../StatusTag';
import ActivityHistory from '../ActivityHistory';
import { testCasesAPI } from '../../services/api';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}) : null;

const TestCaseInPlanDetailPanel = ({
    selectedTC,
    onClose,
    onUpdateExecution,
    bugForm,
    setBugForm,
    editingBug,
    setEditingBug,
    savingBug,
    onSaveBug,
    isCreatingJira,
    onCreateJiraTicket,
    historyRefresh,
}) => {
    if (!selectedTC) return null;

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                        {selectedTC.title}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <StatusTag status={selectedTC.priority || 'Medium'} />
                        <StatusTag status={selectedTC.executionStatus || 'Pending'} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            {selectedTC.category}
                        </span>
                    </div>
                    {selectedTC.executedBy && (
                        <div style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            Executed by <strong style={{ color: 'var(--text-secondary)' }}>{selectedTC.executedBy.name || selectedTC.executedBy.email}</strong>
                            {selectedTC.executedAt && ` on ${fmtDateTime(selectedTC.executedAt)}`}
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            <div className="panel-body">
                {selectedTC.description && (
                    <div style={{ marginBottom: 'var(--space-5)' }}>
                        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Description</div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {selectedTC.description}
                        </p>
                    </div>
                )}

                {selectedTC.preCondition && (
                    <div style={{ marginBottom: 'var(--space-5)' }}>
                        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Pre-condition</div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {selectedTC.preCondition}
                        </p>
                    </div>
                )}

                {selectedTC.testData && (
                    <div style={{ marginBottom: 'var(--space-5)' }}>
                        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Test Data</div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {selectedTC.testData}
                        </p>
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
                    {['Pass', 'Failed', 'Pending', 'N/A'].map((st) => (
                        <button
                            key={st}
                            onClick={() => onUpdateExecution(selectedTC._id, st)}
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

                {/* Bug Details */}
                {selectedTC.executionStatus === 'Failed' && (
                    <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--status-fail-bg)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--status-fail)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Bug Details</div>
                            {!editingBug && (
                                <button
                                    onClick={() => {
                                        setBugForm({
                                            bugType: selectedTC.bugType || '',
                                            bugSeverity: selectedTC.bugSeverity || '',
                                            fixStatus: selectedTC.fixStatus || '',
                                            bugId: selectedTC.bugId || '',
                                        });
                                        setEditingBug(true);
                                    }}
                                    className="btn btn-ghost btn-sm"
                                >
                                    {(selectedTC.bugType || selectedTC.bugSeverity || selectedTC.fixStatus || selectedTC.bugId) ? 'Edit' : '+ Log Bug'}
                                </button>
                            )}
                        </div>

                        {editingBug ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                                    <select
                                        value={bugForm.bugType}
                                        onChange={(e) => setBugForm({ ...bugForm, bugType: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Type —</option>
                                        <option value="Bug">Bug</option>
                                        <option value="Đề xuất">Đề xuất</option>
                                    </select>
                                    <select
                                        value={bugForm.bugSeverity}
                                        onChange={(e) => setBugForm({ ...bugForm, bugSeverity: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Severity —</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    <select
                                        value={bugForm.fixStatus}
                                        onChange={(e) => setBugForm({ ...bugForm, fixStatus: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Fix status —</option>
                                        <option value="Đã fix">Đã fix</option>
                                        <option value="Chưa fix">Chưa fix</option>
                                        <option value="Không fix">Không fix</option>
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    value={bugForm.bugId}
                                    onChange={(e) => setBugForm({ ...bugForm, bugId: e.target.value })}
                                    className="input-field"
                                    placeholder="Bug ID, e.g. BUG-101"
                                />
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <button onClick={onSaveBug} className="btn btn-primary btn-sm" disabled={savingBug}>
                                        {savingBug ? 'Saving…' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingBug(false)} className="btn btn-secondary btn-sm" disabled={savingBug}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            (selectedTC.bugType || selectedTC.bugSeverity || selectedTC.fixStatus || selectedTC.bugId) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    {selectedTC.bugType && <span><strong>Type:</strong> {selectedTC.bugType}</span>}
                                    {selectedTC.bugSeverity && <span><strong>Severity:</strong> {selectedTC.bugSeverity}</span>}
                                    {selectedTC.fixStatus && <span><strong>Fix Status:</strong> {selectedTC.fixStatus}</span>}
                                    {selectedTC.bugId && <span><strong>Bug ID:</strong> {selectedTC.bugId}</span>}
                                </div>
                            )
                        )}
                    </div>
                )}

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
                                onClick={onCreateJiraTicket}
                                className="btn btn-primary btn-sm"
                                disabled={isCreatingJira}
                            >
                                {isCreatingJira ? 'Creating...' : 'Create Jira Ticket'}
                            </button>
                        )}
                    </div>
                )}

                <div className="divider" style={{ margin: 'var(--space-5) 0' }} />
                <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>History</div>
                <ActivityHistory historyFn={testCasesAPI.getHistory} entityId={selectedTC._id} refreshToken={historyRefresh} />
            </div>
        </div>
    );
};

export default TestCaseInPlanDetailPanel;
