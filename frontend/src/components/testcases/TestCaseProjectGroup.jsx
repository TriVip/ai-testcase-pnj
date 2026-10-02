import { useState } from 'react';
import Pagination from '../common/Pagination';
import TestCaseTableRow from './TestCaseTableRow';

const ITEMS_PER_PAGE = 20;

// One collapsible section of the Test Cases page: every test case of a single
// project (or the unassigned ones), with its own pagination.
const TestCaseProjectGroup = ({
    title,
    rows,
    selectedIds,
    onSetSelected,
    sortCol,
    sortDir,
    onToggleSort,
    rowProps,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages); // filters can shrink the group
    const pageSlice = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // The header checkbox covers the whole group, not just this page, so a
    // project's cases can be moved in one go.
    const selectedInGroup = rows.filter((tc) => selectedIds.has(tc._id)).length;
    const allSelected = selectedInGroup === rows.length;
    const toggleGroup = () => onSetSelected(rows.map((tc) => tc._id), !allSelected);

    const sortArrow = (col) => sortCol === col && (sortDir === 'asc' ? '↑' : '↓');

    return (
        <section style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = selectedInGroup > 0 && !allSelected; }}
                    onChange={toggleGroup}
                    aria-label={`Select all test cases in ${title}`}
                    style={{ cursor: 'pointer' }}
                />
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="btn btn-ghost btn-sm"
                    aria-expanded={!collapsed}
                    style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
                >
                    {collapsed ? '▸' : '▾'} {title}
                    <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 6 }}>({rows.length})</span>
                </button>
                {selectedInGroup > 0 && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{selectedInGroup} selected</span>
                )}
            </div>

            {!collapsed && (
                <>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 36 }} />
                                    <th style={{ width: 36 }}>#</th>
                                    <th className="sortable" onClick={() => onToggleSort('title')}>Title {sortArrow('title')}</th>
                                    <th className="sortable" style={{ width: 110 }} onClick={() => onToggleSort('priority')}>Priority {sortArrow('priority')}</th>
                                    <th className="sortable" style={{ width: 110 }} onClick={() => onToggleSort('executionStatus')}>Status {sortArrow('executionStatus')}</th>
                                    <th style={{ width: 130 }}>Project</th>
                                    <th style={{ width: 130 }}>Category</th>
                                    <th style={{ width: 120 }}>In Plans</th>
                                    <th className="col-actions-md" style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageSlice.map((tc, idx) => (
                                    <TestCaseTableRow
                                        key={tc._id}
                                        tc={tc}
                                        index={(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                        isSelected={selectedIds.has(tc._id)}
                                        {...rowProps(tc)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={rows.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setPage}
                        />
                    )}
                </>
            )}
        </section>
    );
};

export default TestCaseProjectGroup;
