import React, { createContext, useContext, useState, useEffect } from 'react';
import { workspacesAPI } from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspaceState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const setActiveWorkspace = (workspace) => {
        setActiveWorkspaceState(workspace);
        if (workspace) {
            localStorage.setItem('activeWorkspaceId', workspace._id);
        } else {
            localStorage.removeItem('activeWorkspaceId');
        }
    };

    const fetchWorkspaces = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const response = await workspacesAPI.getAll();
            const fetchedWorkspaces = response.data;
            setWorkspaces(fetchedWorkspaces);

            if (fetchedWorkspaces.length > 0) {
                const savedId = localStorage.getItem('activeWorkspaceId');
                const savedWorkspace = fetchedWorkspaces.find((w) => w._id === savedId);

                if (savedWorkspace) {
                    setActiveWorkspace(savedWorkspace);
                } else {
                    // Default to personal workspace or the first one
                    const personal = fetchedWorkspaces.find(w => w.isPersonal) || fetchedWorkspaces[0];
                    setActiveWorkspace(personal);
                }
            } else {
                setActiveWorkspace(null);
            }
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchWorkspaces();
        } else {
            setWorkspaces([]);
            setActiveWorkspace(null);
        }
    }, [user]);

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                activeWorkspace,
                setActiveWorkspace,
                fetchWorkspaces,
                isLoading
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};
