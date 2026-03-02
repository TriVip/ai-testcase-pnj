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
                            {testPlan ? 'Edit Test Plan' : 'New Test Plan'}
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
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label">Name *</label>
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
                        <div className="form-group">
                            <label className="form-label">Description *</label>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                            <div className="form-group">
                                <label className="form-label">Status</label>
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
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* Test Cases Selection */}
                        <div className="form-group">
                            <label className="form-label">
                                Test Cases ({formData.testCases.length} selected)
                            </label>
                            {availableTestCases.length === 0 ? (
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No test cases available. Create some test cases first.</p>
                            ) : (
                                <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 'var(--space-2)', maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {availableTestCases.map((tc) => (
                                        <label
                                            key={tc._id}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'background var(--transition)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.testCases.includes(tc._id)}
                                                onChange={() => toggleTestCase(tc._id)}
                                                style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{tc.title}</p>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 3, alignItems: 'center' }}>
                                                    <span className={`status-tag prio-${tc.priority?.toLowerCase()}`}>{tc.priority}</span>
                                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{tc.category}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                            {loading ? 'Saving…' : testPlan ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestPlanForm;
