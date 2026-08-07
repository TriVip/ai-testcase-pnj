import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

export const ACTIVE_WORKSPACE_KEY = 'activeWorkspaceId';

// Emitted when the server rejects the cached workspace id. WorkspaceContext
// listens for it and reloads the workspace list so the selector stops showing
// a workspace the user can no longer reach.
export const WORKSPACE_ACCESS_DENIED_EVENT = 'workspace-access-denied';

// Add a request interceptor to include workspace ID
api.interceptors.request.use((config) => {
    const workspaceId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    if (workspaceId) {
        config.headers['x-workspace-id'] = workspaceId;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Recover from a stale workspace id.
//
// The active workspace lives in localStorage and is sent on every request. It
// can stop being valid while the app is open — the user is removed from the
// workspace, or it is deleted — and the server answers 403 from then on. Left
// alone the app would keep replaying the bad id and every page would fail until
// a manual reload.
//
// On that specific 403 we drop the cached id, tell WorkspaceContext to refresh,
// and replay the request once. The retry runs through the request interceptor
// again, finds no id to attach, and comes back scoped to the user's own data —
// so the page renders instead of showing an error.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response, config } = error;

        const isStaleWorkspace =
            response?.status === 403 &&
            response.data?.code === 'WORKSPACE_ACCESS_DENIED';

        // `_workspaceRetry` guards against a loop: if the replay fails too, the
        // error propagates to the caller instead of retrying forever.
        if (!isStaleWorkspace || !config || config._workspaceRetry) {
            return Promise.reject(error);
        }

        // Parallel requests can all fail on the same stale id. Only the first
        // one to clear it announces the change, so the context refetches once.
        const hadStaleId = localStorage.getItem(ACTIVE_WORKSPACE_KEY) !== null;
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
        if (hadStaleId) {
            window.dispatchEvent(new CustomEvent(WORKSPACE_ACCESS_DENIED_EVENT));
        }

        config._workspaceRetry = true;
        // The rejected header is still on this config object. The request
        // interceptor only ever sets the header, never removes it, so without
        // this the replay would resend the same stale id and fail again.
        delete config.headers['x-workspace-id'];
        return api(config);
    }
);

// Auth API
export const authAPI = {
    getCurrentUser: () => api.get('/auth/current'),
    logout: () => api.post('/auth/logout'),
};

// Test Cases API
export const testCasesAPI = {
    getAll: () => api.get('/testcases'),
    getOne: (id) => api.get(`/testcases/${id}`),
    create: (data) => api.post('/testcases', data),
    update: (id, data) => api.put(`/testcases/${id}`, data),
    delete: (id) => api.delete(`/testcases/${id}`),
    batchDelete: (ids) => api.post('/testcases/batch-delete', { ids }),
    importTestCases: (file, { planId, newPlanName } = {}) => {
        const formData = new FormData();
        formData.append('file', file);
        if (planId) formData.append('planId', planId);
        if (newPlanName) formData.append('newPlanName', newPlanName);
        return api.post('/testcases/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    downloadTemplate: (format = 'xlsx') => {
        return api.get(`/testcases/template?format=${format}`, {
            responseType: 'blob',
        });
    },
    getHistory: (id) => api.get(`/testcases/${id}/history`),
};

// Test Plans API
export const testPlansAPI = {
    getAll: () => api.get('/testplans'),
    getOne: (id) => api.get(`/testplans/${id}`),
    create: (data) => api.post('/testplans', data),
    update: (id, data) => api.put(`/testplans/${id}`, data),
    delete: (id) => api.delete(`/testplans/${id}`),
    addTestCase: (planId, testCaseId) => api.post(`/testplans/${planId}/testcases`, { testCaseId }),
    removeTestCase: (planId, testCaseId) => api.delete(`/testplans/${planId}/testcases/${testCaseId}`),
    getHistory: (id) => api.get(`/testplans/${id}/history`),
};

// AI API
export const aiAPI = {
    suggestTestCases: (featureDescription, file = null) => {
        if (file) {
            const formData = new FormData();
            formData.append('featureDescription', featureDescription);
            formData.append('file', file);
            return api.post('/ai/suggest-testcases', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }
        return api.post('/ai/suggest-testcases', { featureDescription });
    },
    suggestTestPlan: (projectDescription) => api.post('/ai/suggest-testplan', { projectDescription }),
    improveTestCase: (testCase) => api.post('/ai/improve-testcase', { testCase }),
};

// Jira API
export const jiraAPI = {
    createTicket: (data) => api.post('/jira/ticket', data),
};

// Workspaces API
export const workspacesAPI = {
    getAll: () => api.get('/workspaces'),
    create: (data) => api.post('/workspaces', data),
    invite: (id, email) => api.post(`/workspaces/${id}/invite`, { email }),
    removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}`),
    leave: (id) => api.post(`/workspaces/${id}/leave`),
};

export default api;
