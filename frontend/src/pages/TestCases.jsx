import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../components/AppShell';
import StatusTag from '../components/StatusTag';
import { testCasesAPI, aiAPI } from '../services/api';
import { exportTestCasesToXLSX } from '../utils/exportToXLSX';
import TestCaseForm from '../components/TestCaseForm';
import AISuggestionModal from '../components/AISuggestionModal';
import ImportTestCaseModal from '../components/ImportTestCaseModal';
import { useToast, ToastContainer } from '../components/Toast';

const ITEMS_PER_PAGE = 25;

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

const SortIcon = ({ dir }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 4, opacity: dir ? 1 : 0.3 }}>
        {dir === 'asc'
            ? <path d="M12 5l7 7H5l7-7z" />
            : dir === 'desc'
                ? <path d="M12 19l7-7H5l7 7z" />
                : <path d="M12 5l7 7H5l7-7zM12 19l7-7H5l7 7z" opacity="0.5" />}
    </svg>
);

const TestCases = () => {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [improvingId, setImprovingId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Sort
    const [sortCol, setSortCol] = useState('');
    const [sortDir, setSortDir] = useState('asc');

    // Pagination
    const [page, setPage] = useState(1);

    const searchRef = useRef(null);
    const toast = useToast();

    // "/" shortcut focuses search
    useEffect(() => {
        const handler = (e) => {
            if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => { fetchTestCases(); }, []);

    const fetchTestCases = async () => {
        try {
            setLoading(true);
            const res = await testCasesAPI.getAll();
            setTestCases(res.data || []);
        } catch {
            toast.error('Failed to load test cases');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this test case?')) return;
        setDeleting(true);
        try {
            await testCasesAPI.delete(id);
            setTestCases(prev => prev.filter(tc => tc._id !== id));
            setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
            if (expandedRow === id) setExpandedRow(null);
            toast.success('Test case deleted');
        } catch (err) {
            if (err.response?.status === 429) {
                toast.error('Too many delete requests. Please slow down.');
            } else {
                toast.error('Failed to delete');
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} test case(s)?`)) return;
        setDeleting(true);
        try {
            const ids = [...selectedIds];
            const res = await testCasesAPI.batchDelete(ids);
            setTestCases(prev => prev.filter(tc => !selectedIds.has(tc._id)));
            toast.success(`${res.data.deletedCount} test cases deleted`);
            setSelectedIds(new Set());
        } catch (err) {
            if (err.response?.status === 429) {
                toast.error('Too many delete requests. Please slow down.');
            } else {
                toast.error('Failed to delete some items');
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleImprove = async (tc) => {
        if (!confirm('Let AI improve this test case?')) return;
        setImprovingId(tc._id);
        toast.info('AI is improving…', 2000);
        try {
            const res = await aiAPI.improveTestCase(tc);
            const imp = res.data.improved;
            await testCasesAPI.update(tc._id, {
                title: imp.title, description: imp.description,
                steps: imp.steps, priority: imp.priority, category: imp.category,
            });
            toast.success(imp.improvements ? `Improved: ${imp.improvements}` : 'Test case improved!', 5000);
            fetchTestCases();
        } catch (err) {
            toast.error(err.response?.data?.error || 'AI improvement failed', 5000);
        } finally {
            setImprovingId(null);
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingTestCase(null);
        fetchTestCases();
    };

    // ---- Derived data ----
    const categories = ['All', ...Array.from(new Set(testCases.map(tc => tc.category).filter(Boolean)))];

    const filtered = testCases.filter(tc => {
        const search = searchTerm.toLowerCase();
        const matchSearch = !search ||
            tc.title?.toLowerCase().includes(search) ||
            tc.description?.toLowerCase().includes(search) ||
            tc.category?.toLowerCase().includes(search);
        const matchPriority = priorityFilter === 'All' || tc.priority === priorityFilter;
        const matchStatus = statusFilter === 'All' || tc.executionStatus === statusFilter;
        const matchCategory = categoryFilter === 'All' || tc.category === categoryFilter;
        return matchSearch && matchPriority && matchStatus && matchCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (!sortCol) return 0;
        let av = a[sortCol] || '';
        let bv = b[sortCol] || '';
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const pageSlice = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const toggleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
        setPage(1);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === pageSlice.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pageSlice.map(tc => tc._id)));
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setPriorityFilter('All');
        setStatusFilter('All');
        setCategoryFilter('All');
        setPage(1);
    };
    const hasFilters = searchTerm || priorityFilter !== 'All' || statusFilter !== 'All' || categoryFilter !== 'All';

    if (loading) {
        return (
            <AppShell>
                <div className="page-inner" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                    <div className="spinner spinner-lg" /> Loading test cases…
                </div>
            </AppShell>
        );
    }

    return (
        <>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
            <AppShell>
                <div className="page-inner">
                    {/* Page Header */}
                    <div className="page-header">
                        <div className="page-header-left">
                            <h1 className="page-title">Test Cases</h1>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                {testCases.length} total &nbsp;·&nbsp;
                                {filtered.length !== testCases.length && `${filtered.length} filtered &nbsp;·&nbsp;`}
                                Press <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '0 4px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)' }}>/</kbd> to search
                            </p>
                        </div>
                        <div className="page-header-actions">
                            <button onClick={() => setShowImportModal(true)} className="btn btn-secondary btn-sm">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                Import
                            </button>
                            <button
                                onClick={() => exportTestCasesToXLSX(filtered)}
                                className="btn btn-secondary btn-sm"
                                disabled={filtered.length === 0}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                Export XLSX
                            </button>
                            <button onClick={() => setShowAIModal(true)} className="btn btn-secondary btn-sm">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                AI Suggestions
                            </button>
                            <button onClick={() => { setEditingTestCase(null); setShowForm(true); }} className="btn btn-primary btn-sm">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                New Test Case
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="filter-bar">
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search title, description, category… (/)"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                            className="input-field filter-search"
                            style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
                        />
                        <select
                            value={priorityFilter}
                            onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
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
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="input-field filter-select"
                            style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
                        >
                            <option value="All">All Status</option>
                            <option value="Pass">Pass</option>
                            <option value="Failed">Failed</option>
                            <option value="Pending">Pending</option>
                        </select>
                        <select
                            value={categoryFilter}
                            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                            className="input-field filter-select"
                            style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
                        >
                            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                        </select>
                        {hasFilters && (
                            <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap' }}>
                                Clear filters
                            </button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Bulk Action Bar */}
                    {selectedIds.size > 0 && (
                        <div className="bulk-action-bar">
                            <span className="bulk-count">{selectedIds.size} selected</span>
                            <button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '3px 10px', borderRadius: 'var(--radius)', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', opacity: deleting ? 0.6 : 1 }}
                            >
                                {deleting ? 'Deleting…' : 'Delete selected'}
                            </button>
                            <button
                                onClick={() => exportTestCasesToXLSX(testCases.filter(tc => selectedIds.has(tc._id)))}
                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '3px 10px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}
                            >
                                Export selected
                            </button>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}
                            >
                                ✕ Clear
                            </button>
                        </div>
                    )}

                    {/* Data Table */}
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">{testCases.length === 0 ? 'No test cases yet' : 'No results match filters'}</div>
                            <div className="empty-state-desc">
                                {testCases.length === 0
                                    ? 'Create your first test case or generate with AI'
                                    : 'Try adjusting your search or filter criteria'}
                            </div>
                            {testCases.length === 0 ? (
                                <button onClick={() => setShowForm(true)} className="btn btn-primary">Create Test Case</button>
                            ) : (
                                <button onClick={clearFilters} className="btn btn-secondary">Clear Filters</button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 36, paddingLeft: 'var(--space-4)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={pageSlice.length > 0 && selectedIds.size === pageSlice.length}
                                                    onChange={toggleSelectAll}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </th>
                                            <th style={{ width: 40 }}>#</th>
                                            <th
                                                className="sortable"
                                                onClick={() => toggleSort('title')}
                                                style={{ minWidth: 240 }}
                                            >
                                                Title <SortIcon dir={sortCol === 'title' ? sortDir : null} />
                                            </th>
                                            <th
                                                className="sortable"
                                                onClick={() => toggleSort('category')}
                                            >
                                                Category <SortIcon dir={sortCol === 'category' ? sortDir : null} />
                                            </th>
                                            <th
                                                className="sortable"
                                                onClick={() => toggleSort('priority')}
                                            >
                                                Priority <SortIcon dir={sortCol === 'priority' ? sortDir : null} />
                                            </th>

                                            <th>Steps</th>
                                            <th style={{ width: 100 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageSlice.map((tc, idx) => (
                                            <>
                                                <tr
                                                    key={tc._id}
                                                    className={selectedIds.has(tc._id) ? 'row-selected' : ''}
                                                    onClick={() => setExpandedRow(expandedRow === tc._id ? null : tc._id)}
                                                >
                                                    <td style={{ paddingLeft: 'var(--space-4)' }} onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(tc._id)}
                                                            onChange={() => toggleSelect(tc._id)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </td>
                                                    <td style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                                        {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                            <span style={{ color: 'var(--text-tertiary)', lineHeight: 0 }}>
                                                                {expandedRow === tc._id ? <ChevronDown /> : <ChevronRight />}
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
                                                    <td onClick={e => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <button
                                                                onClick={() => { setEditingTestCase(tc); setShowForm(true); }}
                                                                className="btn btn-ghost btn-icon"
                                                                title="Edit"
                                                                style={{ color: 'var(--brand)' }}
                                                            >
                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleImprove(tc)}
                                                                className="btn btn-ghost btn-icon"
                                                                title="AI Improve"
                                                                disabled={improvingId === tc._id}
                                                                style={{ color: 'var(--status-blocked)' }}
                                                            >
                                                                {improvingId === tc._id
                                                                    ? <div className="spinner" style={{ width: 11, height: 11 }} />
                                                                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                                                }
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(tc._id)}
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
                                                {expandedRow === tc._id && (
                                                    <tr key={`${tc._id}-detail`} className="row-detail">
                                                        <td colSpan={8}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                                                                <div>
                                                                    <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Description</div>
                                                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                                                        {tc.description || <em style={{ color: 'var(--text-tertiary)' }}>No description</em>}
                                                                    </p>
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
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                        Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sorted.length)} of {sorted.length}
                                    </span>
                                    <div className="pagination">
                                        <button className="pag-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                            const p = totalPages <= 7 ? i + 1 : i === 0 ? 1 : i === 6 ? totalPages : page - 2 + i;
                                            return (
                                                <button
                                                    key={p}
                                                    className={`pag-btn${page === p ? ' pag-active' : ''}`}
                                                    onClick={() => setPage(p)}
                                                >{p}</button>
                                            );
                                        })}
                                        <button className="pag-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modals */}
                {showForm && (
                    <TestCaseForm testCase={editingTestCase} onClose={handleFormClose} />
                )}
                {showAIModal && (
                    <AISuggestionModal onClose={() => setShowAIModal(false)} onSuggestionsAdded={fetchTestCases} />
                )}
                {showImportModal && (
                    <ImportTestCaseModal onClose={() => setShowImportModal(false)} onImportComplete={fetchTestCases} />
                )}
            </AppShell>
        </>
    );
};

export default TestCases;
