import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { testPlansAPI, testCasesAPI } from '../services/api';
import { exportTestPlanToXLSX } from '../utils/exportToXLSX';
import TestPlanForm from '../components/TestPlanForm';
import AITestPlanModal from '../components/AITestPlanModal';

const TestPlans = () => {
    const [testPlans, setTestPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [editingTestPlan, setEditingTestPlan] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [editingExecution, setEditingExecution] = useState(null);

    useEffect(() => {
        fetchTestPlans();
    }, []);

    const fetchTestPlans = async () => {
        try {
            const response = await testPlansAPI.getAll();
            setTestPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch test plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this test plan?')) return;

        try {
            await testPlansAPI.delete(id);
            setTestPlans(testPlans.filter(tp => tp._id !== id));
            if (selectedPlan?._id === id) setSelectedPlan(null);
        } catch (error) {
            console.error('Failed to delete test plan:', error);
            alert('Failed to delete test plan');
        }
    };

    const handleEdit = (testPlan) => {
        setEditingTestPlan(testPlan);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingTestPlan(null);
        fetchTestPlans();
    };

    const handleUpdateExecution = async (testPlanId, executionStatus, executionNotes) => {
        try {
            await testPlansAPI.update(testPlanId, {
                executionStatus,
                executionNotes,
            });
            setEditingExecution(null);
            fetchTestPlans();
            if (selectedPlan?._id === testPlanId) {
                const response = await testPlansAPI.getAll();
                const updated = response.data.find(p => p._id === testPlanId);
                if (updated) setSelectedPlan(updated);
            }
        } catch (error) {
            console.error('Failed to update execution result:', error);
            alert('Failed to update execution result');
        }
    };

    const handleExport = (testPlan) => {
        exportTestPlanToXLSX(testPlan, `${testPlan.name.replace(/\s+/g, '-')}.xlsx`);
    };

    const getStatusColor = (status) => {
        const colors = {
            Planning: 'bg-blue-100 text-blue-800',
            'In Progress': 'bg-yellow-100 text-yellow-800',
            Completed: 'bg-green-100 text-green-800',
            'On Hold': 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getExecutionBadge = (status) => {
        const badges = {
            Pass: 'bg-green-100 text-green-800',
            Failed: 'bg-red-100 text-red-800',
            Pending: 'bg-gray-100 text-gray-600',
        };
        return badges[status] || badges.Pending;
    };

    const getTestCaseStats = (plan) => {
        if (!plan.testCases || plan.testCases.length === 0) {
            return { pass: 0, failed: 0, pending: 0 };
        }
        return {
            pass: plan.testCases.filter(tc => tc.executionStatus === 'Pass').length,
            failed: plan.testCases.filter(tc => tc.executionStatus === 'Failed').length,
            pending: plan.testCases.filter(tc => tc.executionStatus === 'Pending').length,
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading test plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Test Plans</h1>
                        <p className="text-gray-600 mt-1">{testPlans.length} total test plans</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <i className="fi fi-tr-rocket-lunch"></i>
                            <span>AI Test Plan</span>
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary"
                        >
                            + New Test Plan
                        </button>
                    </div>
                </div>

                {/* Test Plans List */}
                {testPlans.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4"><i className="fi fi-tr-clipboard-list text-primary-600"></i></div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No test plans yet</h3>
                        <p className="text-gray-600 mb-6">Create your first test plan to organize your test cases</p>
                        <button onClick={() => setShowForm(true)} className="btn-primary">
                            Create Test Plan
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {testPlans.map((plan) => (
                            <div key={plan._id} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {plan.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {plan.description}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(plan)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <i className="fi fi-tr-pen-clip"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan._id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <i className="fi fi-tr-trash-xmark"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 mb-4">
                                    <span className={`badge ${getStatusColor(plan.status)}`}>
                                        {plan.status}
                                    </span>
                                    <span className={`badge ${getExecutionBadge(plan.executionStatus)}`}>
                                        {plan.executionStatus === 'Pass' && <i className="fi fi-tr-check-circle"></i>}
                                        {plan.executionStatus === 'Failed' && <i className="fi fi-tr-circle-xmark"></i>}
                                        {plan.executionStatus === 'Pending' && <i className="fi fi-tr-clock-three"></i>}
                                        {' '}{plan.executionStatus}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {plan.testCases?.length || 0} test cases
                                    </span>
                                </div>

                                {(() => {
                                    const stats = getTestCaseStats(plan);
                                    return stats.pass + stats.failed + stats.pending > 0 && (
                                        <div className="flex gap-2 mb-4 text-xs">
                                            <span className="text-green-600"><i className="fi fi-tr-check-circle"></i> {stats.pass}</span>
                                            <span className="text-red-600"><i className="fi fi-tr-circle-xmark"></i> {stats.failed}</span>
                                            <span className="text-gray-600"><i className="fi fi-tr-clock-three"></i> {stats.pending}</span>
                                        </div>
                                    );
                                })()}

                                {plan.startDate && (
                                    <div className="text-xs text-gray-500 mb-4">
                                        {new Date(plan.startDate).toLocaleDateString()} - {' '}
                                        {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Ongoing'}
                                    </div>
                                )}

                                <div className="border-t pt-3 mt-3">
                                    {editingExecution === plan._id ? (
                                        <div className="space-y-2">
                                            <select
                                                defaultValue={plan.executionStatus}
                                                id={`plan-status-${plan._id}`}
                                                className="input-field text-sm w-full"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Pass">Pass</option>
                                                <option value="Failed">Failed</option>
                                            </select>
                                            <textarea
                                                defaultValue={plan.executionNotes}
                                                id={`plan-notes-${plan._id}`}
                                                placeholder="Add execution notes..."
                                                className="input-field text-sm w-full"
                                                rows="2"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const status = document.getElementById(`plan-status-${plan._id}`).value;
                                                        const notes = document.getElementById(`plan-notes-${plan._id}`).value;
                                                        handleUpdateExecution(plan._id, status, notes);
                                                    }}
                                                    className="flex-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingExecution(null)}
                                                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {plan.executionNotes && (
                                                <p className="text-xs text-gray-600 mb-2 italic">"{plan.executionNotes}"</p>
                                            )}
                                            <button
                                                onClick={() => setEditingExecution(plan._id)}
                                                className="w-full px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm transition-colors mb-2 flex items-center justify-center gap-2"
                                            >
                                                <i className="fi fi-tr-pen-square"></i>
                                                <span>Update Result</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedPlan(plan)}
                                        className="flex-1 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleExport(plan)}
                                        className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                                    >
                                        <i className="fi fi-tr-file-spreadsheet"></i>
                                        <span>Export</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Test Plan Details Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
                                    <p className="text-gray-600 mt-1">{selectedPlan.description}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    Test Cases ({selectedPlan.testCases?.length || 0})
                                </h3>
                                {selectedPlan.testCases?.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedPlan.testCases.map((tc, index) => (
                                            <div key={tc._id} className="bg-white/50 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                                            <h4 className="font-semibold text-gray-900">{tc.title}</h4>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{tc.description}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-2 items-end">
                                                        <span className={`badge ${tc.priority === 'High' ? 'badge-high' : tc.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                                                            {tc.priority}
                                                        </span>
                                                        <span className={`badge ${getExecutionBadge(tc.executionStatus)}`}>
                                                            {tc.executionStatus === 'Pass' && <i className="fi fi-tr-check-circle"></i>}
                                                            {tc.executionStatus === 'Failed' && <i className="fi fi-tr-circle-xmark"></i>}
                                                            {tc.executionStatus === 'Pending' && <i className="fi fi-tr-clock-three"></i>}
                                                            {' '}{tc.executionStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No test cases added yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <TestPlanForm
                    testPlan={editingTestPlan}
                    onClose={handleFormClose}
                />
            )}

            {/* AI Test Plan Modal */}
            {showAIModal && (
                <AITestPlanModal
                    onClose={() => setShowAIModal(false)}
                    onTestPlanCreated={fetchTestPlans}
                />
            )}
        </div>
    );
};

export default TestPlans;
