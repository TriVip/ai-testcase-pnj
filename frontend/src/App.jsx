import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestCases from './pages/TestCases';
import TestPlans from './pages/TestPlans';
import Automation from './pages/Automation';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Loading…</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <WorkspaceProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/testcases"
                            element={
                                <PrivateRoute>
                                    <TestCases />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/testplans"
                            element={
                                <PrivateRoute>
                                    <TestPlans />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/automation"
                            element={
                                <PrivateRoute>
                                    <Automation />
                                </PrivateRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </WorkspaceProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
