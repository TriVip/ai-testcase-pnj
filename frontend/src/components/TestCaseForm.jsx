import { useState, useEffect } from 'react';
import { testCasesAPI } from '../services/api';

const TestCaseForm = ({ testCase, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Draft',
        category: 'General',
        feature: 'General',
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
                feature: testCase.feature || 'General',
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
        <div
            className="modal-backdrop"
            onClick={onClose}
        >
            <div
                className="modal"
                style={{ maxWidth: 760 }}
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2 className="modal-title">
                            {testCase ? 'Edit Test Case' : 'New Test Case'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost btn-icon"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {/* Title */}
                        <div className="form-group">
                            <label className="form-label">Title *</label>
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
                        <div className="form-group">
                            <label className="form-label">Description *</label>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
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
                            <div className="form-group">
                                <label className="form-label">Status</label>
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
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Functional"
                                />
                            </div>
                        </div>

                        {/* Feature/Module */}
                        <div className="form-group">
                            <label className="form-label">Feature/Module</label>
                            <input
                                type="text"
                                value={formData.feature}
                                onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                                className="input-field"
                                placeholder="e.g., Login, Checkout, User Profile"
                            />
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>Used to group test cases in test plans</p>
                        </div>

                        {/* Tags */}
                        <div className="form-group">
                            <label className="form-label">Tags</label>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
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
                                    className="btn btn-secondary btn-sm"
                                >
                                    Add
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                                {formData.tags.map((tag) => (
                                    <span key={tag} className="status-tag status-pending" style={{ gap: 'var(--space-2)' }}>
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, lineHeight: 1 }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Steps */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                <label className="form-label" style={{ margin: 0 }}>Test Steps</label>
                                <button
                                    type="button"
                                    onClick={addStep}
                                    className="btn btn-ghost btn-sm"
                                >
                                    + Add Step
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {formData.steps.map((step, index) => (
                                    <div key={index} style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Step {step.stepNumber}</span>
                                            {formData.steps.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeStep(index)}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--status-fail)', fontSize: 'var(--text-xs)' }}
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

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary btn-sm"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={loading}
                        >
                            {loading ? 'Saving…' : testCase ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestCaseForm;
