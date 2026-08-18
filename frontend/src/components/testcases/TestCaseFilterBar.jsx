import React from 'react';

const TestCaseFilterBar = ({
    searchRef,
    searchTerm,
    onSearchChange,
    priorityFilter,
    onPriorityChange,
    statusFilter,
    onStatusChange,
    categoryFilter,
    onCategoryChange,
    categories = [],
    planFilter,
    onPlanChange,
    testPlans = [],
    hasFilters,
    onClearFilters,
    resultCount = 0,
}) => {
    return (
        <div className="filter-bar">
            <input
                ref={searchRef}
                type="text"
                placeholder="Search title, description, category… (/)"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input-field filter-search"
                style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
            />
            <select
                value={priorityFilter}
                onChange={(e) => onPriorityChange(e.target.value)}
                className="input-field filter-select"
                style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
            >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>
            <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="input-field filter-select"
                style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
            >
                <option value="All">All Status</option>
                <option value="Pass">Pass</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
                <option value="N/A">N/A</option>
            </select>
            <select
                value={categoryFilter}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="input-field filter-select"
                style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
            >
                {categories.map((c) => (
                    <option key={c} value={c}>
                        {c === 'All' ? 'All Categories' : c}
                    </option>
                ))}
            </select>
            <select
                value={planFilter}
                onChange={(e) => onPlanChange(e.target.value)}
                className="input-field filter-select"
                style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
            >
                <option value="All">All Test Plans</option>
                {testPlans.map((p) => (
                    <option key={p._id} value={p._id}>
                        {p.name}
                    </option>
                ))}
            </select>
            {hasFilters && (
                <button onClick={onClearFilters} className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap' }}>
                    Clear filters
                </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {resultCount} result{resultCount !== 1 ? 's' : ''}
            </span>
        </div>
    );
};

export default TestCaseFilterBar;
