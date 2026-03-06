import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

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
    importTestCases: (file) => {
        const formData = new FormData();
        formData.append('file', file);
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

export default api;
