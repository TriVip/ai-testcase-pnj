import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
    workspacesAPI,
    ACTIVE_WORKSPACE_KEY,
    WORKSPACE_ACCESS_DENIED_EVENT,
} from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspaceState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Set when the server rejects the workspace we had cached, so the UI can
    // explain why the selection changed on its own.
    const [accessDeniedNotice, setAccessDeniedNotice] = useState(null);

    // The server-side choice wins over this browser's cached one, so switching
    // on one device carries over to the others on their next load. Kept in a
    // ref (not read from `user`) so a refetch never reverts a switch made in
    // this session.
    const lastWorkspaceRef = useRef(null);

    const applyActiveWorkspace = (workspace) => {
        setActiveWorkspaceState(workspace);
        if (workspace) {
            localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace._id);
        } else {
            localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
        }
    };

    // User-initiated switch: also remember it on the server for other devices.
    const setActiveWorkspace = (workspace) => {
        applyActiveWorkspace(workspace);
        if (workspace) {
            lastWorkspaceRef.current = workspace._id;
            workspacesAPI.setActive(workspace._id).catch((error) => {
                console.error('Failed to save active workspace:', error);
            });
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
                const savedWorkspace =
                    fetchedWorkspaces.find((w) => w._id === lastWorkspaceRef.current) ||
                    fetchedWorkspaces.find((w) => w._id === localStorage.getItem(ACTIVE_WORKSPACE_KEY));

                if (savedWorkspace) {
                    applyActiveWorkspace(savedWorkspace);
                } else {
                    // Default to personal workspace or the first one
                    const personal = fetchedWorkspaces.find(w => w.isPersonal) || fetchedWorkspaces[0];
                    applyActiveWorkspace(personal);
                }
            } else {
                applyActiveWorkspace(null);
            }
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Wait for auth to resolve. `user` is null while /auth/current is still
        // in flight, and treating that as "logged out" would clear the stored
        // workspace id before it could ever be restored — the selection would
        // silently reset to the personal workspace on every page load.
        if (authLoading) return;

        if (user) {
            lastWorkspaceRef.current = user.lastWorkspace || null;
            fetchWorkspaces();
        } else {
            lastWorkspaceRef.current = null;
            setWorkspaces([]);
            applyActiveWorkspace(null);
        }
    }, [user, authLoading]);

    // The API layer clears the cached workspace id when the server rejects it
    // (removed from the workspace, or it was deleted) and fires this event.
    // Reload the list so the selector reflects what the user can actually reach
    // — fetchWorkspaces falls back to the personal workspace on its own, since
    // the stale id is no longer in the fetched set.
    useEffect(() => {
        if (!user) return undefined;

        const handleAccessDenied = () => {
            setAccessDeniedNotice(
                'You no longer have access to that workspace. Switched to your personal workspace.'
            );
            fetchWorkspaces();
        };

        window.addEventListener(WORKSPACE_ACCESS_DENIED_EVENT, handleAccessDenied);
        return () => window.removeEventListener(WORKSPACE_ACCESS_DENIED_EVENT, handleAccessDenied);
    }, [user]);

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                activeWorkspace,
                setActiveWorkspace,
                fetchWorkspaces,
                isLoading,
                accessDeniedNotice,
                dismissAccessDeniedNotice: () => setAccessDeniedNotice(null),
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};
