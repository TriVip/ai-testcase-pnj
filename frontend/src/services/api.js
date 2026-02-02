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
    suggestTestCases: (featureDescription) => api.post('/ai/suggest-testcases', { featureDescription }),
    suggestTestPlan: (projectDescription) => api.post('/ai/suggest-testplan', { projectDescription }),
    improveTestCase: (testCase) => api.post('/ai/improve-testcase', { testCase }),
};

export default api;
