import React, { Fragment } from 'react';
import StatusTag from '../StatusTag';
import ActivityHistory from '../ActivityHistory';
import { testCasesAPI } from '../../services/api';

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

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}) : null;

const TestCaseTableRow = ({
    tc,
    index,
    isSelected,
    isExpanded,
    onToggleSelect,
    onToggleExpand,
    onEdit,
    onImprove,
    onDelete,
    improvingId,
    deleting,
    plans = [],
    historyRefresh,
    onNavigateToPlan,
}) => {
    return (
        <Fragment key={tc._id}>
            <tr
                className={isSelected ? 'row-selected' : ''}
                onClick={onToggleExpand}
                style={{ cursor: 'pointer' }}
            >
                <td style={{ paddingLeft: 'var(--space-4)' }} onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        style={{ cursor: 'pointer' }}
                    />
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {index}
                </td>
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ color: 'var(--text-tertiary)', lineHeight: 0 }}>
                            {isExpanded ? <ChevronDown /> : <ChevronRight />}
                        </span>
                        <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tc.title}</div>
                            {tc.description && (
                                <div className="truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', maxWidth: 300 }}>
                                    {tc.description}
                                </div>
                            )}
                        </div>
                    </div>
                </td>
                <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{tc.category || '—'}</td>
                <td><StatusTag status={tc.priority || 'Medium'} /></td>

                <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {tc.steps?.length || 0}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button
                            onClick={onEdit}
                            className="btn btn-ghost btn-icon"
                            title="Edit"
                            style={{ color: 'var(--brand)' }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                            onClick={onImprove}
                            className="btn btn-ghost btn-icon"
                            title="AI Improve"
                            disabled={improvingId === tc._id}
                            style={{ color: 'var(--status-blocked)' }}
                        >
                            {improvingId === tc._id ? (
                                <div className="spinner" style={{ width: 11, height: 11 }} />
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            )}
                        </button>
                        <button
                            onClick={onDelete}
                            className="btn btn-ghost btn-icon"
                            title="Delete"
                            disabled={deleting}
                            style={{ color: 'var(--status-fail)', opacity: deleting ? 0.4 : 1 }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </button>
                    </div>
                </td>
            </tr>

            {/* Expanded detail row */}
            {isExpanded && (
                <tr key={`${tc._id}-detail`} className="row-detail">
                    <td colSpan={8}>
                        {tc.externalId && (
                            <div style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                ID: {tc.externalId}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                            <div>
                                <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Description</div>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {tc.description || <em style={{ color: 'var(--text-tertiary)' }}>No description</em>}
                                </p>
                                {tc.preCondition && (
                                    <>
                                        <div className="section-label" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>Pre-condition</div>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tc.preCondition}</p>
                                    </>
                                )}
                                {tc.testData && (
                                    <>
                                        <div className="section-label" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>Test Data</div>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tc.testData}</p>
                                    </>
                                )}
                            </div>
                            {tc.steps?.length > 0 && (
                                <div>
                                    <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Test Steps ({tc.steps.length})</div>
                                    <div className="step-list">
                                        {tc.steps.map((step, i) => (
                                            <div key={i} className="step-item">
                                                <span className="step-number">{step.stepNumber}</span>
                                                <div className="step-body">
                                                    <div className="step-action">{step.action}</div>
                                                    {step.expectedResult && (
                                                        <div className="step-expected">{step.expectedResult}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {tc.executionNotes && (
                            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--brand-light)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--brand)' }}>
                                <span className="section-label">Execution Notes: </span>
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{tc.executionNotes}</span>
                            </div>
                        )}
                        {tc.executedBy && (
                            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                Executed by <strong style={{ color: 'var(--text-secondary)' }}>{tc.executedBy.name || tc.executedBy.email}</strong>
                                {tc.executedAt && ` on ${fmtDateTime(tc.executedAt)}`}
                            </div>
                        )}
                        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            In Test Plans:{' '}
                            {plans.length === 0 ? (
                                <em>none</em>
                            ) : (
                                plans.map((plan, i) => (
                                    <span key={plan._id}>
                                        {i > 0 && ', '}
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onNavigateToPlan(plan._id, tc._id);
                                            }}
                                            style={{ color: 'var(--brand)' }}
                                        >
                                            {plan.name}
                                        </a>
                                    </span>
                                ))
                            )}
                        </div>
                        {(tc.bugType || tc.bugSeverity || tc.fixStatus || tc.bugId) && (
                            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--status-fail-bg)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--status-fail)' }}>
                                <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Bug Details</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    {tc.bugType && <span><strong>Type:</strong> {tc.bugType}</span>}
                                    {tc.bugSeverity && <span><strong>Severity:</strong> {tc.bugSeverity}</span>}
                                    {tc.fixStatus && <span><strong>Fix Status:</strong> {tc.fixStatus}</span>}
                                    {tc.bugId && <span><strong>Bug ID:</strong> {tc.bugId}</span>}
                                </div>
                            </div>
                        )}
                        <div style={{ marginTop: 'var(--space-4)' }}>
                            <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>History</div>
                            <ActivityHistory historyFn={testCasesAPI.getHistory} entityId={tc._id} refreshToken={historyRefresh} />
                        </div>
                    </td>
                </tr>
            )}
        </Fragment>
    );
};

export default TestCaseTableRow;
