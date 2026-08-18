import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { testCasesAPI, testPlansAPI, aiAPI } from '../services/api';
import { exportTestCasesToXLSX } from '../utils/exportToXLSX';
import { useToast } from '../components/Toast';
import TestCaseForm from '../components/TestCaseForm';
import AISuggestionModal from '../components/AISuggestionModal';
import ImportTestCaseModal from '../components/ImportTestCaseModal';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { SkeletonTable } from '../components/common/Skeleton';
import TestCaseFilterBar from '../components/testcases/TestCaseFilterBar';
import TestCaseBulkActionBar from '../components/testcases/TestCaseBulkActionBar';
import TestCaseTableRow from '../components/testcases/TestCaseTableRow';

const ITEMS_PER_PAGE = 20;

const buildTcToPlansMap = (plans) => {
    const map = {};
    for (const plan of plans) {
        for (const tc of plan.testCases || []) {
            const tcId = tc._id || tc;
            if (!map[tcId]) map[tcId] = [];
            map[tcId].push({ _id: plan._id, name: plan.name });
        }
    }
    return map;
};

const TestCases = () => {
    const toast = useToast();
    const navigate = useNavigate();

    // Data state
    const [testCases, setTestCases] = useState([]);
    const [testPlans, setTestPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showForm, setShowForm] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: null,
    });

    // Selection & expansion
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [expandedRow, setExpandedRow] = useState(null);

    // Filter & search state
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [planFilter, setPlanFilter] = useState('All');

    // Sort state
    const [sortCol, setSortCol] = useState('updatedAt');
    const [sortDir, setSortDir] = useState('desc');

    // Pagination state
    const [page, setPage] = useState(1);

    // Action loading states
    const [deleting, setDeleting] = useState(false);
    const [improvingId, setImprovingId] = useState(null);
    const [historyRefresh, setHistoryRefresh] = useState(0);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [tcRes, planRes] = await Promise.all([
                testCasesAPI.getAll(),
                testPlansAPI.getAll(),
            ]);
            setTestCases(Array.isArray(tcRes.data) ? tcRes.data : (tcRes.data?.testCases || []));
            setTestPlans(Array.isArray(planRes.data) ? planRes.data : (planRes.data?.testPlans || []));
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTestCases = async () => {
        try {
            const res = await testCasesAPI.getAll();
            setTestCases(Array.isArray(res.data) ? res.data : (res.data?.testCases || []));
        } catch {
            toast.error('Failed to load test cases');
        }
    };

    const tcToPlans = useMemo(() => buildTcToPlansMap(testPlans), [testPlans]);

    const handleDelete = (id, title = '') => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Test Case',
            message: `Are you sure you want to delete test case "${title || 'this item'}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger',
            onConfirm: async () => {
                setDeleting(true);
                try {
                    await testCasesAPI.delete(id);
                    setTestCases((prev) => prev.filter((tc) => tc._id !== id));
                    setSelectedIds((prev) => {
                        const s = new Set(prev);
                        s.delete(id);
                        return s;
                    });
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
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const handleBulkDelete = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Batch Delete Test Cases',
            message: `Are you sure you want to permanently delete ${selectedIds.size} selected test case(s)?`,
            confirmText: `Delete ${selectedIds.size} Cases`,
            cancelText: 'Cancel',
            variant: 'danger',
            onConfirm: async () => {
                setDeleting(true);
                try {
                    const ids = [...selectedIds];
                    const res = await testCasesAPI.batchDelete(ids);
                    setTestCases((prev) => prev.filter((tc) => !selectedIds.has(tc._id)));
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
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const handleExport = async (rows) => {
        try {
            await exportTestCasesToXLSX(rows);
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Failed to export XLSX');
        }
    };

    const handleImprove = (tc) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Optimize with AI',
            message: `Let OpenAI review and improve the clarity, test steps, and coverage for "${tc.title}"?`,
            confirmText: 'Optimize Test Case',
            cancelText: 'Cancel',
            variant: 'primary',
            onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                setImprovingId(tc._id);
                toast.info('AI is improving test case…', 2500);
                try {
                    const res = await aiAPI.improveTestCase(tc);
                    const imp = res.data.improved;
                    await testCasesAPI.update(tc._id, {
                        title: imp.title,
                        description: imp.description,
                        steps: imp.steps,
                        priority: imp.priority,
                        category: imp.category,
                    });
                    toast.success(imp.improvements ? `Improved: ${imp.improvements}` : 'Test case improved!', 5000);
                    fetchTestCases();
                    setHistoryRefresh((v) => v + 1);
                } catch (err) {
                    toast.error(err.response?.data?.error || 'AI improvement failed', 5000);
                } finally {
                    setImprovingId(null);
                }
            },
        });
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingTestCase(null);
        fetchTestCases();
        setHistoryRefresh((v) => v + 1);
    };

    // ---- Derived data ----
    const categories = ['All', ...Array.from(new Set(testCases.map((tc) => tc.category).filter(Boolean)))];

    const filtered = testCases.filter((tc) => {
        const search = searchTerm.toLowerCase();
        const matchSearch =
            !search ||
            tc.title?.toLowerCase().includes(search) ||
            tc.description?.toLowerCase().includes(search) ||
            tc.category?.toLowerCase().includes(search);
        const matchPriority = priorityFilter === 'All' || tc.priority === priorityFilter;
        const matchStatus = statusFilter === 'All' || tc.executionStatus === statusFilter;
        const matchCategory = categoryFilter === 'All' || tc.category === categoryFilter;
        const matchPlan = planFilter === 'All' || (tcToPlans[tc._id] || []).some((p) => p._id === planFilter);
        return matchSearch && matchPriority && matchStatus && matchCategory && matchPlan;
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
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
        setPage(1);
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === pageSlice.length && pageSlice.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pageSlice.map((tc) => tc._id)));
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setPriorityFilter('All');
        setStatusFilter('All');
        setCategoryFilter('All');
        setPlanFilter('All');
        setPage(1);
    };

    const hasFilters =
        searchTerm || priorityFilter !== 'All' || statusFilter !== 'All' || categoryFilter !== 'All' || planFilter !== 'All';

    return (
        <>
            <AppShell>
                <div className="page-inner">
                    {/* Header */}
                    <div className="page-header">
                        <div className="page-header-left">
                            <h1 className="page-title">Test Cases</h1>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                {loading ? 'Loading cases…' : `${testCases.length} total test case${testCases.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                        <div className="page-header-actions">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="btn btn-secondary btn-sm"
                                title="Import from Excel / CSV"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                Import
                            </button>
                            <button
                                onClick={() => handleExport(testCases)}
                                className="btn btn-secondary btn-sm"
                                title="Export all test cases to Excel"
                                disabled={testCases.length === 0}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                Export
                            </button>
                            <button
                                onClick={() => setShowAIModal(true)}
                                className="btn btn-secondary btn-sm"
                                title="Generate test cases with AI"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                AI Generate
                            </button>
                            <button
                                onClick={() => { setEditingTestCase(null); setShowForm(true); }}
                                className="btn btn-primary btn-sm"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                New Test Case
                            </button>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <TestCaseFilterBar
                        searchTerm={searchTerm}
                        onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
                        priorityFilter={priorityFilter}
                        onPriorityChange={(val) => { setPriorityFilter(val); setPage(1); }}
                        statusFilter={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
                        categoryFilter={categoryFilter}
                        onCategoryChange={(val) => { setCategoryFilter(val); setPage(1); }}
                        categories={categories}
                        planFilter={planFilter}
                        onPlanChange={(val) => { setPlanFilter(val); setPage(1); }}
                        testPlans={testPlans}
                        hasFilters={hasFilters}
                        onClearFilters={clearFilters}
                        matchedCount={filtered.length}
                        totalCount={testCases.length}
                    />

                    {/* Bulk actions */}
                    {selectedIds.size > 0 && (
                        <TestCaseBulkActionBar
                            selectedCount={selectedIds.size}
                            onExport={() => handleExport(testCases.filter((tc) => selectedIds.has(tc._id)))}
                            onDelete={handleBulkDelete}
                            deleting={deleting}
                            onClearSelection={() => setSelectedIds(new Set())}
                        />
                    )}

                    {/* Table View with Skeleton Loading */}
                    {loading ? (
                        <SkeletonTable rows={8} cols={7} />
                    ) : testCases.length === 0 ? (
                        <div className="empty-state panel">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">No test cases yet</div>
                            <div className="empty-state-desc">Create your first test case manually or generate with AI.</div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button onClick={() => { setEditingTestCase(null); setShowForm(true); }} className="btn btn-primary btn-sm">
                                    New Test Case
                                </button>
                                <button onClick={() => setShowAIModal(true)} className="btn btn-secondary btn-sm">
                                    AI Generate
                                </button>
                            </div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state panel">
                            <div className="empty-state-icon">🔍</div>
                            <div className="empty-state-title">No matching test cases</div>
                            <div className="empty-state-desc">Try clearing filters or search term.</div>
                            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 36 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === pageSlice.length && pageSlice.length > 0}
                                                    onChange={toggleSelectAll}
                                                    aria-label="Select all on this page"
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </th>
                                            <th style={{ width: 36 }}>#</th>
                                            <th className="sortable" onClick={() => toggleSort('title')}>
                                                Title {sortCol === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="sortable" style={{ width: 110 }} onClick={() => toggleSort('priority')}>
                                                Priority {sortCol === 'priority' && (sortDir === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="sortable" style={{ width: 110 }} onClick={() => toggleSort('executionStatus')}>
                                                Status {sortCol === 'executionStatus' && (sortDir === 'asc' ? '↑' : '↓')}
                                            </th>
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
                                                index={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                                                isSelected={selectedIds.has(tc._id)}
                                                isExpanded={expandedRow === tc._id}
                                                onToggleSelect={() => toggleSelect(tc._id)}
                                                onToggleExpand={() => setExpandedRow(expandedRow === tc._id ? null : tc._id)}
                                                onEdit={() => { setEditingTestCase(tc); setShowForm(true); }}
                                                onImprove={() => handleImprove(tc)}
                                                onDelete={() => handleDelete(tc._id, tc.title)}
                                                improvingId={improvingId}
                                                deleting={deleting}
                                                plans={tcToPlans[tc._id] || []}
                                                historyRefresh={historyRefresh}
                                                onNavigateToPlan={(planId, tcId) => {
                                                    navigate('/testplans', { state: { selectPlanId: planId, selectTCId: tcId } });
                                                }}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                totalItems={sorted.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={(newPage) => setPage(newPage)}
                            />
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

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText={confirmDialog.confirmText}
                    cancelText={confirmDialog.cancelText}
                    variant={confirmDialog.variant}
                    loading={deleting}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                />
            </AppShell>
        </>
    );
};

export default TestCases;
