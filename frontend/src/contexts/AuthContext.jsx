import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Login with credentials, saves user directly from response (no extra /current call)
    const loginWithCredentials = async (username, password) => {
        const response = await api.post('/auth/login', { username, password }, { withCredentials: true });
        setUser(response.data.user);
        return response.data;
    };

    // Register, saves user directly from response (no extra /current call)
    const registerUser = async (formData) => {
        const response = await api.post('/auth/register', formData, { withCredentials: true });
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
            setUser(null);
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        loading,
        loginWithCredentials,
        registerUser,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
