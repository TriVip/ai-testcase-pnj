import { useState } from 'react';
import api from '../services/api';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister
                ? formData
                : { username: formData.username, password: formData.password };

            await api.post(endpoint, payload, {
                withCredentials: true,
            });

            // Redirect to dashboard on success
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="card animate-slide-up">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img src="/logo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl font-bold text-gradient mb-3 text-center">
                        AI Test Case Generator
                    </h1>
                    <p className="text-gray-600 mb-8 text-center">
                        {isRegister ? 'Create your account' : 'Sign in to your account'}
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="input-field"
                                placeholder="Enter username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field"
                                placeholder="Enter password"
                            />
                        </div>

                        {isRegister && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter full name"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary"
                        >
                            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
                        </button>
                    </form>

                    {/* Toggle Register/Login */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                        </button>
                    </div>

                    {/* Features */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-3 text-center">Features:</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="text-primary-600">✓</span>
                                <span className="text-gray-700">AI-powered test case suggestions</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-accent-600">✓</span>
                                <span className="text-gray-700">Organize with test plans</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-green-600">✓</span>
                                <span className="text-gray-700">Export to Excel (XLSX)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
