import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestCases from './pages/TestCases';
import TestPlans from './pages/TestPlans';
import BugTracking from './pages/BugTracking';
import Automation from './pages/Automation';
import { SkeletonText, SkeletonLines, SkeletonTable } from './components/common/Skeleton';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div aria-busy="true" aria-label="Loading" style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-app)' }}>
                <div style={{ width: 'var(--sidebar-width)', flexShrink: 0, background: 'var(--bg-sidebar)', padding: 'var(--space-4)' }}>
                    <SkeletonText width="60%" height={20} style={{ marginBottom: 'var(--space-6)' }} />
                    <SkeletonLines count={5} height={16} gap="var(--space-4)" />
                </div>
                <div style={{ flex: 1, padding: 'var(--space-8)', minWidth: 0 }}>
                    <SkeletonText width={180} height={26} style={{ marginBottom: 'var(--space-6)' }} />
                    <SkeletonTable rows={6} cols={5} />
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
                            path="/bugtracking"
                            element={
                                <PrivateRoute>
                                    <BugTracking />
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
