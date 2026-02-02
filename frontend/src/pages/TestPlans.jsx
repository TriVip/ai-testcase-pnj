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
                            <span>🚀</span>
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
                        <div className="text-6xl mb-4">📋</div>
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
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan._id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 mb-4">
                                    <span className={`badge ${getStatusColor(plan.status)}`}>
                                        {plan.status}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {plan.testCases?.length || 0} test cases
                                    </span>
                                </div>

                                {plan.startDate && (
                                    <div className="text-xs text-gray-500 mb-4">
                                        {new Date(plan.startDate).toLocaleDateString()} - {' '}
                                        {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Ongoing'}
                                    </div>
                                )}

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedPlan(plan)}
                                        className="flex-1 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleExport(plan)}
                                        className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                        📊 Export
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
                                                    <span className={`badge ${tc.priority === 'High' ? 'badge-high' : tc.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                                                        {tc.priority}
                                                    </span>
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
