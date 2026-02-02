import { useState } from 'react';
import { aiAPI, testCasesAPI, testPlansAPI } from '../services/api';
import { useToast, ToastContainer } from './Toast';

const AITestPlanModal = ({ onClose, onTestPlanCreated }) => {
    const [projectDescription, setProjectDescription] = useState('');
    const [testPlanData, setTestPlanData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedScenarios, setExpandedScenarios] = useState(new Set());
    const toast = useToast();

    const handleGenerate = async () => {
        if (!projectDescription.trim()) {
            toast.warning('Please enter a project description');
            return;
        }

        setLoading(true);
        setTestPlanData(null);
        
        try {
            toast.info('AI is creating a comprehensive test plan...', 2000);
            const response = await aiAPI.suggestTestPlan(projectDescription);
            setTestPlanData(response.data.testPlan);
            // Expand first scenario by default
            setExpandedScenarios(new Set([0]));
            const totalCases = response.data.testPlan.testScenarios?.reduce((sum, s) => sum + (s.testCases?.length || 0), 0) || 0;
            toast.success(`Generated test plan with ${totalCases} test cases!`);
        } catch (error) {
            console.error('Failed to generate test plan:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to generate test plan';
            toast.error(errorMsg, 5000);
        } finally {
            setLoading(false);
        }
    };

    const toggleScenario = (index) => {
        const newExpanded = new Set(expandedScenarios);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedScenarios(newExpanded);
    };

    const handleCreateTestPlan = async () => {
        if (!testPlanData) return;

        setLoading(true);
        try {
            const totalCases = getTotalTestCases();
            toast.info(`Creating test plan with ${totalCases} test cases...`, 2000);
            
            // First, create all test cases
            const allTestCases = [];
            for (const scenario of testPlanData.testScenarios || []) {
                for (const testCase of scenario.testCases || []) {
                    const createdCase = await testCasesAPI.create({
                        ...testCase,
                        status: 'Draft',
                    });
                    allTestCases.push(createdCase.data._id);
                }
            }

            // Then create the test plan with all test cases
            await testPlansAPI.create({
                name: testPlanData.name,
                description: testPlanData.description,
                status: 'Planning',
                testCases: allTestCases,
            });

            toast.success(`Successfully created test plan with ${totalCases} test cases!`);
            onTestPlanCreated();
            setTimeout(onClose, 1000);
        } catch (error) {
            console.error('Failed to create test plan:', error);
            toast.error('Failed to create test plan. Please try again.', 5000);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            Critical: 'text-purple-600 bg-purple-50',
            High: 'text-red-600 bg-red-50',
            Medium: 'text-yellow-600 bg-yellow-50',
            Low: 'text-green-600 bg-green-50',
        };
        return colors[priority] || 'text-gray-600 bg-gray-50';
    };

    const getTotalTestCases = () => {
        if (!testPlanData?.testScenarios) return 0;
        return testPlanData.testScenarios.reduce((sum, scenario) => 
            sum + (scenario.testCases?.length || 0), 0
        );
    };

    return (
        <>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">🚀 AI Test Plan Generator</h2>
                            <p className="text-gray-600 mt-1">Describe your project and let AI create a comprehensive test plan</p>
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
                            Project Description
                        </label>
                        <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            className="input-field"
                            rows="5"
                            placeholder="Describe your project or feature set. For example: 'E-commerce website with user registration, product catalog, shopping cart, payment processing, order management, and admin dashboard'"
                            disabled={loading}
                        />
                        <button
                            onClick={handleGenerate}
                            className="btn-primary mt-3"
                            disabled={loading}
                        >
                            {loading && !testPlanData ? (
                                <span className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Generating Test Plan...</span>
                                </span>
                            ) : (
                                '🤖 Generate Test Plan'
                            )}
                        </button>
                    </div>

                    {/* Test Plan Preview */}
                    {testPlanData && (
                        <div>
                            <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {testPlanData.name}
                                </h3>
                                <p className="text-gray-700 mb-4">{testPlanData.description}</p>
                                <div className="flex items-center space-x-6 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-primary-700">
                                            {testPlanData.testScenarios?.length || 0}
                                        </span>
                                        <span className="text-gray-600">Test Scenarios</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-primary-700">
                                            {getTotalTestCases()}
                                        </span>
                                        <span className="text-gray-600">Test Cases</span>
                                    </div>
                                </div>
                            </div>

                            {/* Test Scenarios */}
                            <div className="space-y-4">
                                {testPlanData.testScenarios?.map((scenario, scenarioIndex) => (
                                    <div key={scenarioIndex} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                                        {/* Scenario Header */}
                                        <div 
                                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleScenario(scenarioIndex)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <span className="text-lg">
                                                            {expandedScenarios.has(scenarioIndex) ? '▼' : '▶'}
                                                        </span>
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                            {scenario.title}
                                                        </h4>
                                                        <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(scenario.priority)}`}>
                                                            {scenario.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 ml-8">{scenario.description}</p>
                                                </div>
                                                <span className="text-sm text-gray-500 ml-4">
                                                    {scenario.testCases?.length || 0} test cases
                                                </span>
                                            </div>
                                        </div>

                                        {/* Test Cases */}
                                        {expandedScenarios.has(scenarioIndex) && (
                                            <div className="border-t border-gray-200 bg-gray-50/50 p-4">
                                                <div className="space-y-3">
                                                    {scenario.testCases?.map((testCase, caseIndex) => (
                                                        <div key={caseIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <span className="text-xs font-medium text-gray-500">
                                                                            TC-{scenarioIndex + 1}.{caseIndex + 1}
                                                                        </span>
                                                                        <h5 className="font-semibold text-gray-900">
                                                                            {testCase.title}
                                                                        </h5>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mb-3">
                                                                        {testCase.description}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end space-y-2 ml-4">
                                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(testCase.priority)}`}>
                                                                        {testCase.priority}
                                                                    </span>
                                                                    {testCase.category && (
                                                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                            {testCase.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Test Steps */}
                                                            {testCase.steps && testCase.steps.length > 0 && (
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <p className="text-xs font-medium text-gray-700 mb-2">Test Steps:</p>
                                                                    <ol className="space-y-2">
                                                                        {testCase.steps.map((step, stepIndex) => (
                                                                            <li key={stepIndex} className="text-xs">
                                                                                <div className="flex items-start space-x-2">
                                                                                    <span className="font-medium text-primary-600 min-w-[20px]">
                                                                                        {step.stepNumber}.
                                                                                    </span>
                                                                                    <div className="flex-1">
                                                                                        <p className="text-gray-700 font-medium">{step.action}</p>
                                                                                        {step.expectedResult && (
                                                                                            <p className="text-gray-500 mt-1">
                                                                                                ✓ {step.expectedResult}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ol>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Footer */}
                {testPlanData && (
                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                                This will create <strong>{getTotalTestCases()} test cases</strong> organized into{' '}
                                <strong>{testPlanData.testScenarios?.length || 0} scenarios</strong>
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={onClose}
                                    className="btn-secondary"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTestPlan}
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Creating...</span>
                                        </span>
                                    ) : (
                                        '✅ Create Test Plan'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </>
    );
};

export default AITestPlanModal;
