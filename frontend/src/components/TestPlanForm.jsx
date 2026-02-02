import { useState, useEffect } from 'react';
import { testPlansAPI, testCasesAPI } from '../services/api';

const TestPlanForm = ({ testPlan, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Planning',
        startDate: '',
        endDate: '',
        testCases: [],
    });
    const [availableTestCases, setAvailableTestCases] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTestCases();
        if (testPlan) {
            setFormData({
                name: testPlan.name || '',
                description: testPlan.description || '',
                status: testPlan.status || 'Planning',
                startDate: testPlan.startDate ? testPlan.startDate.split('T')[0] : '',
                endDate: testPlan.endDate ? testPlan.endDate.split('T')[0] : '',
                testCases: testPlan.testCases?.map(tc => tc._id || tc) || [],
            });
        }
    }, [testPlan]);

    const fetchTestCases = async () => {
        try {
            const response = await testCasesAPI.getAll();
            setAvailableTestCases(response.data);
        } catch (error) {
            console.error('Failed to fetch test cases:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (testPlan) {
                await testPlansAPI.update(testPlan._id, formData);
            } else {
                await testPlansAPI.create(formData);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save test plan:', error);
            alert('Failed to save test plan');
        } finally {
            setLoading(false);
        }
    };

    const toggleTestCase = (testCaseId) => {
        setFormData({
            ...formData,
            testCases: formData.testCases.includes(testCaseId)
                ? formData.testCases.filter(id => id !== testCaseId)
                : [...formData.testCases, testCaseId],
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass rounded-2xl max-w-3xl w-full my-8">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {testPlan ? 'Edit Test Plan' : 'New Test Plan'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field"
                                placeholder="Enter test plan name"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input-field"
                                rows="3"
                                placeholder="Describe the purpose of this test plan"
                            />
                        </div>

                        {/* Status, Dates */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input-field"
                                >
                                    <option>Planning</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                    <option>On Hold</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* Test Cases Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Test Cases ({formData.testCases.length} selected)
                            </label>
                            {availableTestCases.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No test cases available. Create some test cases first.</p>
                            ) : (
                                <div className="bg-white/50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                                    {availableTestCases.map((tc) => (
                                        <label
                                            key={tc._id}
                                            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/70 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.testCases.includes(tc._id)}
                                                onChange={() => toggleTestCase(tc._id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{tc.title}</p>
                                                <p className="text-sm text-gray-600">{tc.description}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${tc.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                            tc.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                        }`}>
                                                        {tc.priority}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{tc.category}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : testPlan ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestPlanForm;
