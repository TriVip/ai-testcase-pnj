import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { testPlansAPI, testCasesAPI, jiraAPI } from '../services/api';
import socket from '../services/socket';
import { exportTestPlanToXLSX } from '../utils/exportToXLSX';
import TestPlanForm from '../components/TestPlanForm';
import TestPlanTree from '../components/testplans/TestPlanTree';
import TestPlanDetailPanel from '../components/testplans/TestPlanDetailPanel';
import TestCaseInPlanDetailPanel from '../components/testplans/TestCaseInPlanDetailPanel';
import ConfirmDialog from '../components/common/ConfirmDialog';

const TestPlans = () => {
    const [testPlans, setTestPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTestPlan, setEditingTestPlan] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, planId: null, planName: '' });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedTC, setSelectedTC] = useState(null);
    const [expandedPlans, setExpandedPlans] = useState(new Set());
    const [expandedFeatures, setExpandedFeatures] = useState(new Set());
    const [editingExec, setEditingExec] = useState(null);
    const [execStatus, setExecStatus] = useState('Pending');
    const [execNotes, setExecNotes] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [isCreatingJira, setIsCreatingJira] = useState(false);
    const [editingBug, setEditingBug] = useState(false);
    const [bugForm, setBugForm] = useState({ bugType: '', bugSeverity: '', fixStatus: '', bugId: '' });
    const [savingBug, setSavingBug] = useState(false);
    const [historyRefresh, setHistoryRefresh] = useState(0);
    const [treeSearch, setTreeSearch] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTestPlans();

        socket.connect();
        return () => {
            socket.disconnect();
        };
    }, []);

    // Deep-select a plan (and optionally a test case within it), arriving via router state
    useEffect(() => {
        const { selectPlanId, selectTCId } = location.state || {};
        if (!selectPlanId || testPlans.length === 0) return;

        const plan = testPlans.find((p) => p._id === selectPlanId);
        if (!plan) {
            navigate(location.pathname, { replace: true, state: null });
            return;
        }

        setExpandedPlans((prev) => new Set(prev).add(plan._id));

        const tc = selectTCId ? plan.testCases.find((t) => t._id === selectTCId) : null;
        if (tc) {
            setExpandedFeatures((prev) => new Set(prev).add(`${plan._id}|${tc.feature || 'General'}`));
            setSelectedTC(tc);
            setSelectedPlan(null);
        } else {
            setSelectedPlan(plan);
            setSelectedTC(null);
        }

        navigate(location.pathname, { replace: true, state: null });
    }, [testPlans, location.state]);

    // Socket.io real-time updates for Test Plan
    useEffect(() => {
        if (!selectedPlan) return;

        // Join the room for this specific test plan
        socket.emit('joinRoom', selectedPlan._id);

        const handleTestCaseUpdate = (data) => {
            const { planId, testCaseId, status, executedBy, executedAt } = data;
            const patch = { executionStatus: status, executedBy, executedAt };

            if (planId === selectedPlan._id) {
                setSelectedPlan((prevPlan) => {
                    if (!prevPlan) return prevPlan;
                    const updatedTestCases = prevPlan.testCases.map((tc) => {
                        if (tc._id === testCaseId) {
                            return { ...tc, ...patch };
                        }
                        return tc;
                    });
                    return { ...prevPlan, testCases: updatedTestCases };
                });

                setSelectedTC((prevTc) => {
                    if (prevTc && prevTc._id === testCaseId) {
                        return { ...prevTc, ...patch };
                    }
                    return prevTc;
                });
            }

            setTestPlans((prevPlans) =>
                prevPlans.map((p) => {
                    if (p._id === planId) {
                        return {
                            ...p,
                            testCases: p.testCases.map((tc) =>
                                tc._id === testCaseId ? { ...tc, ...patch } : tc
                            ),
                        };
                    }
                    return p;
                })
            );
        };

        const handlePlanStatusUpdate = ({ planId }) => {
            testPlansAPI.getOne(planId).then((res) => {
                const fresh = res.data;
                setTestPlans((prev) => prev.map((p) => (p._id === planId ? fresh : p)));
                setSelectedPlan((prev) => (prev && prev._id === planId ? fresh : prev));
            }).catch(() => {});
        };

        socket.on('testCaseStatusUpdated', handleTestCaseUpdate);
        socket.on('testPlanStatusUpdated', handlePlanStatusUpdate);

        return () => {
            socket.emit('leaveRoom', selectedPlan._id);
            socket.off('testCaseStatusUpdated', handleTestCaseUpdate);
            socket.off('testPlanStatusUpdated', handlePlanStatusUpdate);
        };
    }, [selectedPlan?._id]);

    const fetchTestPlans = async () => {
        try {
            setLoading(true);
            const res = await testPlansAPI.getAll();
            const plans = Array.isArray(res.data) ? res.data : (res.data?.testPlans || []);
            setTestPlans(plans);
            if (plans.length > 0 && !selectedPlan && !selectedTC) {
                setSelectedPlan(plans[0]);
                setExpandedPlans(new Set([plans[0]._id]));
            }
        } catch (error) {
            console.error('Failed to fetch test plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = () => {
        setEditingTestPlan(null);
        setShowForm(true);
    };

    const handleEdit = (plan) => {
        setEditingTestPlan(plan);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        const plan = testPlans.find((p) => p._id === id) || selectedPlan;
        setConfirmDialog({
            isOpen: true,
            planId: id,
            planName: plan?.name || 'this test plan',
        });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.planId) return;
        setDeleting(true);
        try {
            await testPlansAPI.delete(confirmDialog.planId);
            const nextPlans = testPlans.filter((p) => p._id !== confirmDialog.planId);
            setTestPlans(nextPlans);
            if (selectedPlan?._id === confirmDialog.planId) {
                setSelectedPlan(nextPlans[0] || null);
                setSelectedTC(null);
            }
        } catch (error) {
            console.error('Failed to delete test plan:', error);
        } finally {
            setDeleting(false);
            setConfirmDialog({ isOpen: false, planId: null, planName: '' });
        }
    };

    const handleFormClose = async () => {
        setShowForm(false);
        setEditingTestPlan(null);
        await fetchTestPlans();
        if (selectedPlan) {
            try {
                const res = await testPlansAPI.getOne(selectedPlan._id);
                setSelectedPlan(res.data);
            } catch {}
        }
    };

    const handleUpdateStatus = async (planId, status) => {
        try {
            const res = await testPlansAPI.update(planId, { status });
            setTestPlans((prev) => prev.map((p) => (p._id === planId ? res.data : p)));
            if (selectedPlan?._id === planId) setSelectedPlan(res.data);
            setHistoryRefresh((v) => v + 1);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleSaveExecution = async (planId) => {
        try {
            const res = await testPlansAPI.update(planId, {
                executionStatus: execStatus,
                executionNotes: execNotes,
            });
            setTestPlans((prev) => prev.map((p) => (p._id === planId ? res.data : p)));
            if (selectedPlan?._id === planId) setSelectedPlan(res.data);
            setEditingExec(null);
            setHistoryRefresh((v) => v + 1);
        } catch (error) {
            console.error('Failed to update execution:', error);
        }
    };

    const handleUpdateTCExecution = async (tcId, status) => {
        try {
            const res = await testCasesAPI.update(tcId, { executionStatus: status });
            const updated = res.data;

            if (selectedTC?._id === tcId) {
                setSelectedTC(updated);
            }

            if (selectedPlan) {
                setSelectedPlan((prev) => ({
                    ...prev,
                    testCases: (prev.testCases || []).map((t) => (t._id === tcId ? updated : t)),
                }));
            }

            setTestPlans((prev) =>
                prev.map((p) => ({
                    ...p,
                    testCases: (p.testCases || []).map((t) => (t._id === tcId ? updated : t)),
                }))
            );

            // Refetch fresh plan in case planStatusSync auto-flipped plan status
            if (selectedPlan) {
                const freshRes = await testPlansAPI.getAll();
                const freshPlans = Array.isArray(freshRes.data) ? freshRes.data : (freshRes.data?.testPlans || []);
                setTestPlans(freshPlans);
                const currentFresh = freshPlans.find((p) => p._id === selectedPlan._id);
                if (currentFresh) setSelectedPlan(currentFresh);
            }

            setHistoryRefresh((v) => v + 1);
        } catch (error) {
            console.error('Failed to update TC execution:', error);
        }
    };

    const handleSaveBug = async () => {
        if (!selectedTC) return;
        setSavingBug(true);
        try {
            const res = await testCasesAPI.update(selectedTC._id, bugForm);
            const updated = res.data;
            setSelectedTC(updated);

            setTestPlans((prev) =>
                prev.map((p) => ({
                    ...p,
                    testCases: (p.testCases || []).map((t) => (t._id === updated._id ? updated : t)),
                }))
            );

            // Re-sync plan status if bug fields change
            const freshRes = await testPlansAPI.getAll();
            const freshPlans = Array.isArray(freshRes.data) ? freshRes.data : (freshRes.data?.testPlans || []);
            setTestPlans(freshPlans);

            setEditingBug(false);
            setHistoryRefresh((v) => v + 1);
        } catch (error) {
            console.error('Failed to save bug:', error);
        } finally {
            setSavingBug(false);
        }
    };

    const handleCreateJiraTicket = async () => {
        if (!selectedTC) return;
        setIsCreatingJira(true);
        try {
            const response = await jiraAPI.createTicket({
                testCaseId: selectedTC._id,
                title: `[BUG] ${selectedTC.title}`,
                description: `Failed Test Case: ${selectedTC.description}\n\nSteps:\n${selectedTC.steps?.map((s) => `${s.stepNumber}. ${s.action} -> ${s.expectedResult}`).join('\n')}`,
                issueType: 'Bug',
            });

            if (response.data.ticketUrl) {
                const updatedTC = { ...selectedTC, jiraTicketUrl: response.data.ticketUrl };
                setSelectedTC(updatedTC);
                setTestPlans((prevPlans) =>
                    prevPlans.map((p) => ({
                        ...p,
                        testCases: (p.testCases || []).map((tc) =>
                            tc._id === selectedTC._id ? updatedTC : tc
                        ),
                    }))
                );
            }
        } catch (error) {
            console.error('Error creating Jira ticket:', error);
        } finally {
            setIsCreatingJira(false);
        }
    };

    const handleExport = async (plan) => {
        try {
            await exportTestPlanToXLSX(plan);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const togglePlanExpand = (planId) => {
        setExpandedPlans((prev) => {
            const s = new Set(prev);
            s.has(planId) ? s.delete(planId) : s.add(planId);
            return s;
        });
    };

    const toggleFeatureExpand = (featKey) => {
        setExpandedFeatures((prev) => {
            const s = new Set(prev);
            s.has(featKey) ? s.delete(featKey) : s.add(featKey);
            return s;
        });
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setSelectedTC(null);
        setExpandedPlans((prev) => new Set(prev).add(plan._id));
    };

    const handleSelectTC = (tc, plan) => {
        setSelectedTC(tc);
        setSelectedPlan(plan);
    };

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
                {/* Page header */}
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Test Plans</h1>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {testPlans.length} test plan{testPlans.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="page-header-actions">
                        <button onClick={handleCreatePlan} className="btn btn-primary btn-sm">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            New Test Plan
                        </button>
                    </div>
                </div>

                {/* Master-Detail Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
                    {/* Left: Tree */}
                    <TestPlanTree
                        plans={testPlans}
                        selectedPlan={selectedPlan}
                        selectedTC={selectedTC}
                        expandedPlans={expandedPlans}
                        expandedFeatures={expandedFeatures}
                        searchTerm={treeSearch}
                        onSearchChange={setTreeSearch}
                        onTogglePlanExpand={togglePlanExpand}
                        onToggleFeatureExpand={toggleFeatureExpand}
                        onSelectPlan={handleSelectPlan}
                        onSelectTC={handleSelectTC}
                        onNewPlanClick={handleCreatePlan}
                    />

                    {/* Right: Detail */}
                    <div>
                        {selectedTC ? (
                            <TestCaseInPlanDetailPanel
                                selectedTC={selectedTC}
                                onClose={() => setSelectedTC(null)}
                                onUpdateExecution={handleUpdateTCExecution}
                                bugForm={bugForm}
                                setBugForm={setBugForm}
                                editingBug={editingBug}
                                setEditingBug={setEditingBug}
                                savingBug={savingBug}
                                onSaveBug={handleSaveBug}
                                isCreatingJira={isCreatingJira}
                                onCreateJiraTicket={handleCreateJiraTicket}
                                historyRefresh={historyRefresh}
                            />
                        ) : selectedPlan ? (
                            <TestPlanDetailPanel
                                selectedPlan={selectedPlan}
                                onEdit={handleEdit}
                                onExport={handleExport}
                                onDelete={handleDelete}
                                deleting={deleting}
                                onUpdateStatus={handleUpdateStatus}
                                editingExec={editingExec}
                                setEditingExec={setEditingExec}
                                execStatus={execStatus}
                                setExecStatus={setExecStatus}
                                execNotes={execNotes}
                                setExecNotes={setExecNotes}
                                onSaveExecution={handleSaveExecution}
                                onSelectTC={handleSelectTC}
                                onUpdateTCExecution={handleUpdateTCExecution}
                                historyRefresh={historyRefresh}
                            />
                        ) : (
                            <div className="empty-state" style={{ minHeight: 300 }}>
                                <div className="empty-state-icon">📋</div>
                                <div className="empty-state-title">No selection</div>
                                <div className="empty-state-desc">Select a test plan or test case from the left to view details</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showForm && (
                <TestPlanForm testPlan={editingTestPlan} onClose={handleFormClose} />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Test Plan"
                message={`Are you sure you want to delete test plan "${confirmDialog.planName}"? This action cannot be undone.`}
                confirmText="Delete Plan"
                cancelText="Cancel"
                variant="danger"
                loading={deleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, planId: null, planName: '' })}
            />
        </AppShell>
    );
};

export default TestPlans;
