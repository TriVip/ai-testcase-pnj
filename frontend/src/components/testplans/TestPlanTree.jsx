import React from 'react';
import StatusTag from '../StatusTag';

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

const naturalCompare = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const getStats = (plan) => {
    const tcs = plan.testCases || [];
    return {
        total: tcs.length,
        pass: tcs.filter((t) => t.executionStatus === 'Pass').length,
        failed: tcs.filter((t) => t.executionStatus === 'Failed').length,
        pending: tcs.filter((t) => t.executionStatus === 'Pending').length,
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



const TestPlanTree = ({
    plans = [],
    selectedPlan,
    selectedTC,
    expandedPlans = new Set(),
    expandedFeatures = new Set(),
    searchTerm = '',
    onSearchChange,
    onTogglePlanExpand,
    onToggleFeatureExpand,
    onSelectPlan,
    onSelectTC,
    onNewPlanClick,
}) => {
    const filteredPlans = plans.filter((plan) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        const matchPlan = plan.name?.toLowerCase().includes(q) || plan.description?.toLowerCase().includes(q);
        const matchTc = (plan.testCases || []).some(
            (tc) => tc.title?.toLowerCase().includes(q) || tc.category?.toLowerCase().includes(q) || tc.feature?.toLowerCase().includes(q)
        );
        return matchPlan || matchTc;
    });

    return (
        <div className="panel" style={{ overflow: 'hidden' }}>
            <div className="panel-header" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Test Plans</span>
                <button onClick={onNewPlanClick} className="btn btn-primary btn-sm" style={{ padding: '2px 8px' }}>
                    + New
                </button>
            </div>

            {/* Tree search */}
            <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--border)' }}>
                <input
                    type="text"
                    placeholder="Search plans & cases…"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input-field"
                    style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)' }}
                />
            </div>

            {/* Tree list */}
            <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', padding: 'var(--space-2) 0' }}>
                {filteredPlans.length === 0 ? (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                        {plans.length === 0 ? 'No test plans yet' : 'No matches'}
                    </div>
                ) : (
                    filteredPlans.map((plan) => {
                        const isExpanded = expandedPlans.has(plan._id);
                        const isSelected = selectedPlan?._id === plan._id && !selectedTC;
                        const tcs = plan.testCases || [];

                        // Group test cases by feature
                        const featureMap = {};
                        tcs.forEach((tc) => {
                            const feat = tc.feature || 'General';
                            if (!featureMap[feat]) featureMap[feat] = [];
                            featureMap[feat].push(tc);
                        });
                        const featureNames = Object.keys(featureMap).sort(naturalCompare);

                        return (
                            <div key={plan._id} style={{ marginBottom: 2 }}>
                                {/* Plan header row */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: 'var(--space-2) var(--space-3)',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? 'var(--brand-light)' : 'transparent',
                                        borderRadius: 'var(--radius)',
                                        margin: '0 4px',
                                        transition: 'background-color var(--transition-fast)',
                                    }}
                                    onClick={() => onSelectPlan(plan)}
                                >
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTogglePlanExpand(plan._id);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', marginRight: 'var(--space-2)', color: 'var(--text-tertiary)' }}
                                    >
                                        {isExpanded ? <ChevronDown /> : <ChevronRight />}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span
                                                className="truncate"
                                                style={{
                                                    fontSize: 'var(--text-sm)',
                                                    fontWeight: isSelected ? 600 : 500,
                                                    color: isSelected ? 'var(--brand)' : 'var(--text-primary)',
                                                }}
                                            >
                                                {plan.name}
                                            </span>
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: 'var(--space-2)' }}>
                                                {tcs.length}
                                            </span>
                                        </div>
                                        <MiniProgressBar plan={plan} />
                                    </div>
                                </div>

                                {/* Plan contents (expanded) */}
                                {isExpanded && (
                                    <div style={{ paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--border)', marginLeft: 'var(--space-4)', marginTop: 2 }}>
                                        {featureNames.map((feat) => {
                                            const featKey = `${plan._id}|${feat}`;
                                            const isFeatExpanded = expandedFeatures.has(featKey);
                                            const featTCs = featureMap[feat];

                                            return (
                                                <div key={featKey} style={{ marginTop: 2 }}>
                                                    {/* Feature row */}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '3px var(--space-2)',
                                                            cursor: 'pointer',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: 'var(--text-xs)',
                                                            fontWeight: 600,
                                                            color: 'var(--text-secondary)',
                                                        }}
                                                        onClick={() => onToggleFeatureExpand(featKey)}
                                                    >
                                                        <span style={{ marginRight: 4, color: 'var(--text-tertiary)' }}>
                                                            {isFeatExpanded ? <ChevronDown /> : <ChevronRight />}
                                                        </span>
                                                        <span className="truncate" style={{ flex: 1 }}>{feat}</span>
                                                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{featTCs.length}</span>
                                                    </div>

                                                    {/* TC rows inside feature */}
                                                    {isFeatExpanded && (
                                                        <div style={{ paddingLeft: 'var(--space-3)' }}>
                                                            {featTCs.map((tc) => {
                                                                const isTCSelected = selectedTC?._id === tc._id;
                                                                return (
                                                                    <div
                                                                        key={tc._id}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            padding: '3px var(--space-2)',
                                                                            cursor: 'pointer',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            fontSize: 'var(--text-xs)',
                                                                            backgroundColor: isTCSelected ? 'var(--brand-light)' : 'transparent',
                                                                            color: isTCSelected ? 'var(--brand)' : 'var(--text-primary)',
                                                                        }}
                                                                        onClick={() => onSelectTC(tc, plan)}
                                                                    >
                                                                        <StatusTag status={tc.executionStatus || 'Pending'} variant="dot" showLabel={false} />
                                                                        <span className="truncate" style={{ flex: 1 }}>{tc.title}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TestPlanTree;
