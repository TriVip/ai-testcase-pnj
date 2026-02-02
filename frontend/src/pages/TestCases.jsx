import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { testCasesAPI, aiAPI } from '../services/api';
import { exportTestCasesToXLSX } from '../utils/exportToXLSX';
import TestCaseForm from '../components/TestCaseForm';
import AISuggestionModal from '../components/AISuggestionModal';
import ImportTestCaseModal from '../components/ImportTestCaseModal';
import { useToast, ToastContainer } from '../components/Toast';

const TestCases = () => {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [improvingId, setImprovingId] = useState(null);
    const [executionFilter, setExecutionFilter] = useState('All');
    const [editingExecution, setEditingExecution] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchTestCases();
    }, []);

    const fetchTestCases = async () => {
        try {
            const response = await testCasesAPI.getAll();
            setTestCases(response.data);
        } catch (error) {
            console.error('Failed to fetch test cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this test case?')) return;

        try {
            await testCasesAPI.delete(id);
            setTestCases(testCases.filter(tc => tc._id !== id));
        } catch (error) {
            console.error('Failed to delete test case:', error);
            alert('Failed to delete test case');
        }
    };

    const handleEdit = (testCase) => {
        setEditingTestCase(testCase);
        setShowForm(true);
    };

    const handleImprove = async (testCase) => {
        if (!confirm('Let AI improve this test case? The current version will be replaced.')) {
            return;
        }

        setImprovingId(testCase._id);
        toast.info('AI is analyzing and improving your test case...', 2000);

        try {
            const response = await aiAPI.improveTestCase(testCase);
            const improved = response.data.improved;

            // Update the test case with improved version
            await testCasesAPI.update(testCase._id, {
                title: improved.title,
                description: improved.description,
                steps: improved.steps,
                priority: improved.priority,
                category: improved.category,
            });

            // Show what was improved
            if (improved.improvements) {
                toast.success(`Test case improved! ${improved.improvements}`, 5000);
            } else {
                toast.success('Test case successfully improved!');
            }

            fetchTestCases();
        } catch (error) {
            console.error('Failed to improve test case:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to improve test case';
            toast.error(errorMsg, 5000);
        } finally {
            setImprovingId(null);
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingTestCase(null);
        fetchTestCases();
    };

    const handleUpdateExecution = async (testCaseId, executionStatus, executionNotes) => {
        try {
            await testCasesAPI.update(testCaseId, {
                executionStatus,
                executionNotes,
            });
            toast.success('Execution result updated!');
            setEditingExecution(null);
            fetchTestCases();
        } catch (error) {
            console.error('Failed to update execution result:', error);
            toast.error('Failed to update execution result');
        }
    };

    const handleExport = () => {
        const filteredCases = filteredTestCases();
        exportTestCasesToXLSX(filteredCases);
    };

    const filteredTestCases = () => {
        return testCases.filter(tc => {
            const matchesSearch = tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tc.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesExecution = executionFilter === 'All' || tc.executionStatus === executionFilter;
            return matchesSearch && matchesExecution;
        });
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            Critical: 'badge-critical',
            High: 'badge-high',
            Medium: 'badge-medium',
            Low: 'badge-low',
        };
        return badges[priority] || 'badge-medium';
    };

    const getExecutionBadge = (status) => {
        const badges = {
            Pass: 'bg-green-100 text-green-800',
            Failed: 'bg-red-100 text-red-800',
            Pending: 'bg-gray-100 text-gray-600',
        };
        return badges[status] || badges.Pending;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading test cases...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
            <div className="min-h-screen">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Test Cases</h1>
                            <p className="text-gray-600 mt-1">{testCases.length} total test cases</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowAIModal(true)}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <i className="fi fi-tr-sparkles"></i>
                                <span>AI Suggestions</span>
                            </button>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <i className="fi fi-tr-file-spreadsheet"></i>
                                <span>Import</span>
                            </button>
                            <button
                                onClick={handleExport}
                                className="btn-secondary flex items-center space-x-2"
                                disabled={testCases.length === 0}
                            >
                                <i className="fi fi-tr-file-spreadsheet"></i>
                                <span>Export XLSX</span>
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn-primary"
                            >
                                + New Test Case
                            </button>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-6 flex gap-4">
                        <input
                            type="text"
                            placeholder="Search test cases..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field max-w-md"
                        />
                        <select
                            value={executionFilter}
                            onChange={(e) => setExecutionFilter(e.target.value)}
                            className="input-field w-40"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Pass">Pass</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>

                    {/* Test Cases Grid */}
                    {filteredTestCases().length === 0 ? (
                        <div className="card text-center py-12">
                            <div className="text-6xl mb-4"><i className="fi fi-tr-document text-primary-600"></i></div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No test cases yet</h3>
                            <p className="text-gray-600 mb-6">Create your first test case or use AI to generate suggestions</p>
                            <button onClick={() => setShowForm(true)} className="btn-primary">
                                Create Test Case
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTestCases().map((testCase) => (
                                <div key={testCase._id} className="card group hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-2">
                                            <span className={`badge ${getPriorityBadge(testCase.priority)}`}>
                                                {testCase.priority}
                                            </span>
                                            <span className={`badge ${getExecutionBadge(testCase.executionStatus)}`}>
                                                {testCase.executionStatus === 'Pass' && <i className="fi fi-tr-check-circle"></i>}
                                                {testCase.executionStatus === 'Failed' && <i className="fi fi-tr-circle-xmark"></i>}
                                                {testCase.executionStatus === 'Pending' && <i className="fi fi-tr-clock-three"></i>}
                                                {' '}{testCase.executionStatus}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleImprove(testCase)}
                                                className="text-purple-600 hover:text-purple-800 transition-colors"
                                                title="AI Improve"
                                                disabled={improvingId === testCase._id}
                                            >
                                                {improvingId === testCase._id ? (
                                                    <i className="fi fi-tr-settings animate-spin inline-block"></i>
                                                ) : (
                                                    <i className="fi fi-tr-sparkles"></i>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(testCase)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Edit"
                                            >
                                                <i className="fi fi-tr-pen-clip"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(testCase._id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Delete"
                                            >
                                                <i className="fi fi-tr-trash-xmark"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {testCase.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                        {testCase.description}
                                    </p>

                                    <div className="border-t pt-3 mt-3">
                                        {editingExecution === testCase._id ? (
                                            <div className="space-y-2">
                                                <select
                                                    defaultValue={testCase.executionStatus}
                                                    id={`status-${testCase._id}`}
                                                    className="input-field text-sm w-full"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Pass">Pass</option>
                                                    <option value="Failed">Failed</option>
                                                </select>
                                                <textarea
                                                    defaultValue={testCase.executionNotes}
                                                    id={`notes-${testCase._id}`}
                                                    placeholder="Add execution notes..."
                                                    className="input-field text-sm w-full"
                                                    rows="2"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const status = document.getElementById(`status-${testCase._id}`).value;
                                                            const notes = document.getElementById(`notes-${testCase._id}`).value;
                                                            handleUpdateExecution(testCase._id, status, notes);
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
                                                {testCase.executionNotes && (
                                                    <p className="text-xs text-gray-600 mb-2 italic">"{testCase.executionNotes}"</p>
                                                )}
                                                <button
                                                    onClick={() => setEditingExecution(testCase._id)}
                                                    className="w-full px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <i className="fi fi-tr-pen-square"></i>
                                                    <span>Update Result</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                                        <span>{testCase.category}</span>
                                        <span>{testCase.steps?.length || 0} steps</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modals */}
                {showForm && (
                    <TestCaseForm
                        testCase={editingTestCase}
                        onClose={handleFormClose}
                    />
                )}

                {showAIModal && (
                    <AISuggestionModal
                        onClose={() => setShowAIModal(false)}
                        onSuggestionsAdded={fetchTestCases}
                    />
                )}

                {showImportModal && (
                    <ImportTestCaseModal
                        onClose={() => setShowImportModal(false)}
                        onImportComplete={fetchTestCases}
                    />
                )}
            </div>
        </>
    );
};

export default TestCases;
