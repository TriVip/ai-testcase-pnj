import { useState, useEffect } from 'react';
import { testCasesAPI } from '../services/api';

const TestCaseForm = ({ testCase, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Draft',
        category: 'General',
        tags: [],
        steps: [{ stepNumber: 1, action: '', expectedResult: '' }],
    });
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (testCase) {
            setFormData({
                title: testCase.title || '',
                description: testCase.description || '',
                priority: testCase.priority || 'Medium',
                status: testCase.status || 'Draft',
                category: testCase.category || 'General',
                tags: testCase.tags || [],
                steps: testCase.steps?.length > 0 ? testCase.steps : [{ stepNumber: 1, action: '', expectedResult: '' }],
            });
        }
    }, [testCase]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (testCase) {
                await testCasesAPI.update(testCase._id, formData);
            } else {
                await testCasesAPI.create(formData);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save test case:', error);
            alert('Failed to save test case');
        } finally {
            setLoading(false);
        }
    };

    const addStep = () => {
        setFormData({
            ...formData,
            steps: [...formData.steps, { stepNumber: formData.steps.length + 1, action: '', expectedResult: '' }],
        });
    };

    const removeStep = (index) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        setFormData({ ...formData, steps: newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 })) });
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...formData.steps];
        newSteps[index][field] = value;
        setFormData({ ...formData, steps: newSteps });
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass rounded-2xl max-w-3xl w-full my-8">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {testCase ? 'Edit Test Case' : 'New Test Case'}
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
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input-field"
                                placeholder="Enter test case title"
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
                                placeholder="Describe what this test case validates"
                            />
                        </div>

                        {/* Priority, Status, Category */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="input-field"
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input-field"
                                >
                                    <option>Draft</option>
                                    <option>Active</option>
                                    <option>Deprecated</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Functional"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                            <div className="flex space-x-2 mb-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    className="input-field flex-1"
                                    placeholder="Add a tag"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag) => (
                                    <span key={tag} className="badge bg-primary-100 text-primary-800 flex items-center space-x-1">
                                        <span>{tag}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="text-primary-600 hover:text-primary-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Steps */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Test Steps</label>
                                <button
                                    type="button"
                                    onClick={addStep}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    + Add Step
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.steps.map((step, index) => (
                                    <div key={index} className="bg-white/50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Step {step.stepNumber}</span>
                                            {formData.steps.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeStep(index)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={step.action}
                                            onChange={(e) => updateStep(index, 'action', e.target.value)}
                                            className="input-field mb-2"
                                            placeholder="Action to perform"
                                        />
                                        <input
                                            type="text"
                                            value={step.expectedResult}
                                            onChange={(e) => updateStep(index, 'expectedResult', e.target.value)}
                                            className="input-field"
                                            placeholder="Expected result"
                                        />
                                    </div>
                                ))}
                            </div>
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
                            {loading ? 'Saving...' : testCase ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestCaseForm;
