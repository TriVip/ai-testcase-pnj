import { useState } from 'react';
import { aiAPI, testCasesAPI } from '../services/api';
import { useToast, ToastContainer } from './Toast';

const AISuggestionModal = ({ onClose, onSuggestionsAdded }) => {
    const [featureDescription, setFeatureDescription] = useState('');
    const [file, setFile] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
    const toast = useToast();

    const handleGenerate = async () => {
        if (!featureDescription.trim() && !file) {
            toast.warning('Please enter a feature description or attach a document');
            return;
        }

        setLoading(true);
        setSuggestions([]);
        setSelectedSuggestions(new Set());

        try {
            toast.info('Generating test cases with AI...', 2000);
            const response = await aiAPI.suggestTestCases(featureDescription, file);
            setSuggestions(response.data.suggestions);
            toast.success(`Generated ${response.data.suggestions.length} test case suggestions!`);
        } catch (error) {
            console.error('Failed to generate suggestions:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to generate suggestions';
            toast.error(errorMsg, 5000);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (index) => {
        const newSelected = new Set(selectedSuggestions);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedSuggestions(newSelected);
    };

    const handleSelectAll = () => {
        const allIndices = new Set(suggestions.map((_, index) => index));
        setSelectedSuggestions(allIndices);
    };

    const handleDeselectAll = () => {
        setSelectedSuggestions(new Set());
    };

    const handleAddSelected = async () => {
        if (selectedSuggestions.size === 0) {
            toast.warning('Please select at least one suggestion');
            return;
        }

        setLoading(true);
        try {
            toast.info(`Adding ${selectedSuggestions.size} test cases...`, 2000);

            // Insert in reverse order so that when sorted by createdAt descending (newest first),
            // the top suggestion from the modal appears at the top of the test cases list
            const indices = Array.from(selectedSuggestions).sort((a, b) => b - a);

            for (const index of indices) {
                const suggestion = suggestions[index];
                await testCasesAPI.create({
                    ...suggestion,
                    status: 'Draft',
                });
            }
            toast.success(`Successfully added ${selectedSuggestions.size} test cases!`);
            onSuggestionsAdded();
            setTimeout(onClose, 1000); // Wait for toast to show
        } catch (error) {
            console.error('Failed to add suggestions:', error);
            toast.error('Failed to add some suggestions. Please try again.', 5000);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            Critical: 'text-purple-600',
            High: 'text-red-600',
            Medium: 'text-yellow-600',
            Low: 'text-green-600',
        };
        return colors[priority] || 'text-gray-600';
    };

    return (
        <>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
            <div
                className="modal-backdrop"
                onClick={onClose}
            >
                <div
                    className="modal"
                    style={{ maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div>
                            <h2 className="modal-title">AI Test Case Suggestions</h2>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>Describe your feature and let AI generate test cases</p>
                        </div>
                        <button onClick={onClose} className="btn btn-ghost btn-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                        {/* Input Section */}
                        <div className="form-group">
                            <label className="form-label">Feature Description</label>
                            <textarea
                                value={featureDescription}
                                onChange={(e) => setFeatureDescription(e.target.value)}
                                className="input-field"
                                rows="3"
                                placeholder="Describe the feature you want to test. E.g. 'User login with email/password, remember me, forgot password'"
                                disabled={loading}
                            />
                            <div style={{ marginTop: 'var(--space-3)' }}>
                                <label className="btn btn-outline btn-sm" style={{ marginRight: 'var(--space-3)', cursor: 'pointer' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    Attach File
                                    <input
                                        type="file"
                                        accept=".txt,.pdf,.docx"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                        disabled={loading}
                                    />
                                </label>
                                {file && <span style={{ fontSize: 'var(--text-xs)', marginRight: 'var(--space-3)' }}>{file.name}</span>}

                                <button
                                    onClick={handleGenerate}
                                    className="btn btn-primary btn-sm"
                                    disabled={loading}
                                >
                                    {loading && suggestions.length === 0 ? (
                                        <><div className="spinner" style={{ width: 12, height: 12 }} /> Generating…</>
                                    ) : (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                            Generate Suggestions
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Suggestions List */}
                        {suggestions.length > 0 && (
                            <div style={{ marginTop: 'var(--space-6)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Generated Suggestions ({suggestions.length})</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{selectedSuggestions.size} selected</span>
                                        <button onClick={handleSelectAll} className="btn btn-ghost btn-sm" disabled={selectedSuggestions.size === suggestions.length}>Select All</button>
                                        <button onClick={handleDeselectAll} className="btn btn-ghost btn-sm" disabled={selectedSuggestions.size === 0}>Deselect All</button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                background: selectedSuggestions.has(index) ? 'var(--brand-light)' : 'var(--bg-surface-2)',
                                                borderRadius: 'var(--radius)',
                                                padding: 'var(--space-3) var(--space-4)',
                                                cursor: 'pointer',
                                                border: `2px solid ${selectedSuggestions.has(index) ? 'var(--brand-muted)' : 'transparent'}`,
                                                transition: 'border-color var(--transition), background var(--transition)',
                                            }}
                                            onClick={() => toggleSelection(index)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSuggestions.has(index)}
                                                    onChange={() => toggleSelection(index)}
                                                    style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-1)' }}>
                                                        <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{suggestion.title}</h4>
                                                        <span className={`status-tag prio-${suggestion.priority?.toLowerCase()}`}>{suggestion.priority}</span>
                                                    </div>
                                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', lineHeight: 1.5 }}>{suggestion.description}</p>

                                                    {suggestion.steps?.length > 0 && (
                                                        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-2)' }}>
                                                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Steps</p>
                                                            {suggestion.steps.map((step, si) => (
                                                                <div key={si} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                                                                    <span style={{ fontWeight: 600 }}>{si + 1}.</span> {step.action}
                                                                    {step.expectedResult && <span style={{ color: 'var(--text-tertiary)' }}> → {step.expectedResult}</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {suggestion.category && (
                                                        <span className="status-tag status-pending">{suggestion.category}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {suggestions.length > 0 && (
                        <div className="modal-footer">
                            <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
                            <button
                                onClick={handleAddSelected}
                                className="btn btn-primary btn-sm"
                                disabled={loading || selectedSuggestions.size === 0}
                            >
                                {loading ? 'Adding…' : `Add Selected (${selectedSuggestions.size})`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AISuggestionModal;
