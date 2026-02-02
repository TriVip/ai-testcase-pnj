import { useState } from 'react';
import { aiAPI, testCasesAPI } from '../services/api';
import { useToast, ToastContainer } from './Toast';

const AISuggestionModal = ({ onClose, onSuggestionsAdded }) => {
    const [featureDescription, setFeatureDescription] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
    const toast = useToast();

    const handleGenerate = async () => {
        if (!featureDescription.trim()) {
            toast.warning('Please enter a feature description');
            return;
        }

        setLoading(true);
        setSuggestions([]);
        setSelectedSuggestions(new Set());
        
        try {
            toast.info('Generating test cases with AI...', 2000);
            const response = await aiAPI.suggestTestCases(featureDescription);
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

    const handleAddSelected = async () => {
        if (selectedSuggestions.size === 0) {
            toast.warning('Please select at least one suggestion');
            return;
        }

        setLoading(true);
        try {
            toast.info(`Adding ${selectedSuggestions.size} test cases...`, 2000);
            
            const promises = Array.from(selectedSuggestions).map(index => {
                const suggestion = suggestions[index];
                return testCasesAPI.create({
                    ...suggestion,
                    status: 'Draft',
                });
            });

            await Promise.all(promises);
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">🤖 AI Test Case Suggestions</h2>
                            <p className="text-gray-600 mt-1">Describe your feature and let AI generate test cases</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Input Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Feature Description
                        </label>
                        <textarea
                            value={featureDescription}
                            onChange={(e) => setFeatureDescription(e.target.value)}
                            className="input-field"
                            rows="4"
                            placeholder="Describe the feature you want to test. For example: 'User login functionality with email and password, including remember me option and forgot password link'"
                            disabled={loading}
                        />
                        <button
                            onClick={handleGenerate}
                            className="btn-primary mt-3"
                            disabled={loading}
                        >
                            {loading && suggestions.length === 0 ? (
                                <span className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Generating...</span>
                                </span>
                            ) : (
                                'Generate Suggestions'
                            )}
                        </button>
                    </div>

                    {/* Suggestions List */}
                    {suggestions.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-900">
                                    Generated Suggestions ({suggestions.length})
                                </h3>
                                <span className="text-sm text-gray-600">
                                    {selectedSuggestions.size} selected
                                </span>
                            </div>

                            <div className="space-y-4">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className={`bg-white/50 rounded-lg p-4 cursor-pointer border-2 transition-all ${selectedSuggestions.has(index)
                                                ? 'border-primary-500 bg-primary-50/50'
                                                : 'border-transparent hover:border-gray-300'
                                            }`}
                                        onClick={() => toggleSelection(index)}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedSuggestions.has(index)}
                                                onChange={() => toggleSelection(index)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                                                    <span className={`text-sm font-medium ${getPriorityColor(suggestion.priority)}`}>
                                                        {suggestion.priority}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>

                                                {suggestion.steps && suggestion.steps.length > 0 && (
                                                    <div className="bg-white/70 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-gray-700 mb-2">Test Steps:</p>
                                                        <ol className="text-sm text-gray-600 space-y-1">
                                                            {suggestion.steps.map((step, stepIndex) => (
                                                                <li key={stepIndex} className="text-xs">
                                                                    <span className="font-medium">{stepIndex + 1}.</span> {step.action}
                                                                    {step.expectedResult && (
                                                                        <span className="text-gray-500"> → {step.expectedResult}</span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}

                                                {suggestion.category && (
                                                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                        {suggestion.category}
                                                    </span>
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
                    <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddSelected}
                            className="btn-primary"
                            disabled={loading || selectedSuggestions.size === 0}
                        >
                            {loading ? 'Adding...' : `Add Selected (${selectedSuggestions.size})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default AISuggestionModal;
