import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Welcome Section */}
                <div className="mb-12 animate-slide-down">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600">
                        Manage your test cases and plans with AI-powered assistance
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <Link to="/testcases" className="card group hover:scale-105 transition-transform duration-300">
                        <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Test Cases</h3>
                                <p className="text-gray-600 mb-4">
                                    Create, edit, and manage your test cases with AI suggestions
                                </p>
                                <span className="text-primary-600 font-medium group-hover:underline">
                                    Go to Test Cases →
                                </span>
                            </div>
                        </div>
                    </Link>

                    <Link to="/testplans" className="card group hover:scale-105 transition-transform duration-300">
                        <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Test Plans</h3>
                                <p className="text-gray-600 mb-4">
                                    Organize test cases into comprehensive test plans
                                </p>
                                <span className="text-accent-600 font-medium group-hover:underline">
                                    Go to Test Plans →
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🤖</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">AI-Powered</h4>
                        <p className="text-sm text-gray-600">
                            Generate test cases automatically using OpenAI
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Export to Excel</h4>
                        <p className="text-sm text-gray-600">
                            Download your test cases in XLSX format
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Secure & Private</h4>
                        <p className="text-sm text-gray-600">
                            Your data is protected with Google OAuth
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
