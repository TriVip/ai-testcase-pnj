import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { testCasesAPI, aiAPI } from '../services/api';
import { exportTestCasesToXLSX } from '../utils/exportToXLSX';
import TestCaseForm from '../components/TestCaseForm';
import AISuggestionModal from '../components/AISuggestionModal';
import { useToast, ToastContainer } from '../components/Toast';

const TestCases = () => {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [improvingId, setImprovingId] = useState(null);
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

    const handleExport = () => {
        const filteredCases = filteredTestCases();
        exportTestCasesToXLSX(filteredCases);
    };

    const filteredTestCases = () => {
        return testCases.filter(tc =>
            tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tc.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
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
                            <span>🤖</span>
                            <span>AI Suggestions</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="btn-secondary flex items-center space-x-2"
                            disabled={testCases.length === 0}
                        >
                            <span>📊</span>
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

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search test cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field max-w-md"
                    />
                </div>

                {/* Test Cases Grid */}
                {filteredTestCases().length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
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
                                    <span className={`badge ${getPriorityBadge(testCase.priority)}`}>
                                        {testCase.priority}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleImprove(testCase)}
                                            className="text-purple-600 hover:text-purple-800 transition-colors"
                                            title="AI Improve"
                                            disabled={improvingId === testCase._id}
                                        >
                                            {improvingId === testCase._id ? (
                                                <span className="animate-spin inline-block">⚙️</span>
                                            ) : (
                                                '✨'
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(testCase)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(testCase._id)}
                                            className="text-red-600 hover:text-red-800 transition-colors"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {testCase.title}
                                </h3>

                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                    {testCase.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-gray-500">
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
        </div>
        </>
    );
};

export default TestCases;
