#!/usr/bin/env node
// MCP server that lets AI agents work with test cases / test plans.
//
// It is a thin client over the existing REST API rather than a second path into
// MongoDB, so workspace scoping, the ALLOWED_FIELDS whitelist, activity logging,
// executedBy attribution and planStatusSync all keep applying unchanged.
//
// Env:
//   TESTCASE_API_URL       backend origin, e.g. https://testcase-gen-backend.onrender.com
//   TESTCASE_TOKEN         the JWT from the `token` cookie after Google sign-in
//                          (sent as a Bearer token; expires after 7 days)
//   TESTCASE_WORKSPACE_ID  optional default workspace; without it (and without a
//                          per-call workspaceId) calls hit the personal scope
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_URL = (process.env.TESTCASE_API_URL || 'http://localhost:9999').replace(/\/$/, '');
const TOKEN = process.env.TESTCASE_TOKEN;
const DEFAULT_WORKSPACE = process.env.TESTCASE_WORKSPACE_ID;

if (!TOKEN) {
    console.error('TESTCASE_TOKEN is required (the JWT from the `token` cookie after signing in).');
    process.exit(1);
}

const api = async (method, path, { body, query, workspaceId } = {}) => {
    const url = new URL(`/api${path}`, API_URL);
    for (const [k, v] of Object.entries(query || {})) {
        if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const headers = { Authorization: `Bearer ${TOKEN}` };
    const ws = workspaceId || DEFAULT_WORKSPACE;
    if (ws) headers['x-workspace-id'] = ws;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    return text ? JSON.parse(text) : null;
};

// Wrap an API call as a tool handler: JSON result on success, isError on failure.
const tool = (fn) => async (args) => {
    try {
        return { content: [{ type: 'text', text: JSON.stringify(await fn(args), null, 2) }] };
    } catch (err) {
        return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
};

// Enums mirror backend/src/models — the backend still validates, these just
// tell the agent what's accepted up front.
const priority = z.enum(['Low', 'Medium', 'High', 'Critical']);
const tcStatus = z.enum(['Draft', 'Active', 'Deprecated']);
const tcExecution = z.enum(['Pending', 'Pass', 'Failed', 'N/A']);
const fixStatus = z.enum(['Đã fix', 'Chưa fix', 'Không fix', '']);
const planStatus = z.enum(['Planning', 'In Progress', 'Completed', 'On Hold', 'Obsolete']);
const planExecution = z.enum(['Pending', 'Pass', 'Failed']);

const workspaceId = z.string().optional()
    .describe('Workspace to act in (from list_workspaces). Defaults to TESTCASE_WORKSPACE_ID, else the personal scope.');
// Ids are interpolated into URL paths, so pin them to ObjectId shape.
const id = z.string().regex(/^[a-f0-9]{24}$/i, 'must be a 24-hex MongoDB _id').describe('MongoDB _id');
const page = z.number().int().min(1).optional().describe('Page number (default 1)');
const limit = z.number().int().min(1).max(100).optional().describe('Page size (default 25, max 100)');

const testCaseFields = {
    title: z.string(),
    description: z.string(),
    externalId: z.string().describe('Human-readable id from a source sheet, e.g. "BB-M1-01"'),
    preCondition: z.string(),
    testData: z.string(),
    steps: z.array(z.object({
        stepNumber: z.number().int(),
        action: z.string(),
        expectedResult: z.string(),
    })),
    priority,
    status: tcStatus,
    category: z.string(),
    feature: z.string(),
    project: z.string(),
    tags: z.array(z.string()),
    executionStatus: tcExecution,
    executionNotes: z.string(),
    bugType: z.enum(['Bug', 'Đề xuất', '']).describe("'' clears it"),
    bugSeverity: z.enum(['High', 'Medium', 'Low', '']).describe("'' clears it"),
    fixStatus: fixStatus.describe("'' clears it. 'Chưa fix' on any test case fails every plan containing it"),
    bugId: z.string(),
    jiraTicketUrl: z.string(),
};
const optional = (shape) => Object.fromEntries(Object.entries(shape).map(([k, v]) => [k, v.optional()]));

const testPlanFields = {
    name: z.string(),
    description: z.string(),
    testCases: z.array(id).describe('Full list of test case ids (replaces the existing list)'),
    status: planStatus,
    startDate: z.string().describe('ISO date'),
    endDate: z.string().describe('ISO date'),
    executionStatus: planExecution,
    executionNotes: z.string(),
};

const server = new McpServer({ name: 'testcase-gen', version: '1.0.0' });
const readOnly = { readOnlyHint: true };
const destructive = { destructiveHint: true };

server.registerTool('whoami', {
    description: 'Current signed-in user (also confirms the token works).',
    annotations: readOnly,
}, tool(() => api('GET', '/auth/current')));

server.registerTool('list_workspaces', {
    description: 'Workspaces the user belongs to. Pass an _id from here as workspaceId to other tools.',
    annotations: readOnly,
}, tool(() => api('GET', '/workspaces')));

server.registerTool('list_test_cases', {
    description: 'List/search test cases (newest first, paginated).',
    inputSchema: {
        workspaceId, page, limit,
        search: z.string().optional().describe('Matches title, description, category, externalId'),
        priority: priority.optional(),
        status: tcStatus.optional(),
        category: z.string().optional(),
        feature: z.string().optional(),
        executionStatus: tcExecution.optional(),
        fixStatus: fixStatus.optional(),
    },
    annotations: readOnly,
}, tool(({ workspaceId, page = 1, limit = 25, ...filters }) =>
    api('GET', '/testcases', { workspaceId, query: { page, limit, ...filters } })));

server.registerTool('get_test_case', {
    description: 'Get one test case by id.',
    inputSchema: { workspaceId, id },
    annotations: readOnly,
}, tool(({ workspaceId, id }) => api('GET', `/testcases/${id}`, { workspaceId })));

server.registerTool('get_test_case_history', {
    description: 'Activity log for a test case (which fields changed, by whom, when — not old/new values).',
    inputSchema: { workspaceId, id },
    annotations: readOnly,
}, tool(({ workspaceId, id }) => api('GET', `/testcases/${id}/history`, { workspaceId })));

server.registerTool('create_test_case', {
    description: 'Create a test case.',
    inputSchema: { workspaceId, ...optional(testCaseFields), title: testCaseFields.title, description: testCaseFields.description },
}, tool(({ workspaceId, ...body }) => api('POST', '/testcases', { workspaceId, body })));

server.registerTool('update_test_case', {
    description: 'Update a test case. Only the fields you pass are changed. Changing executionStatus records you as the executor.',
    inputSchema: { workspaceId, id, ...optional(testCaseFields) },
}, tool(({ workspaceId, id, ...body }) => api('PUT', `/testcases/${id}`, { workspaceId, body })));

server.registerTool('delete_test_case', {
    description: 'Permanently delete a test case.',
    inputSchema: { workspaceId, id },
    annotations: destructive,
}, tool(({ workspaceId, id }) => api('DELETE', `/testcases/${id}`, { workspaceId })));

server.registerTool('list_test_plans', {
    description: 'List/search test plans (newest first, paginated, test cases populated).',
    inputSchema: {
        workspaceId, page, limit,
        search: z.string().optional().describe('Matches name, description'),
        status: planStatus.optional(),
        executionStatus: planExecution.optional(),
    },
    annotations: readOnly,
}, tool(({ workspaceId, page = 1, limit = 25, ...filters }) =>
    api('GET', '/testplans', { workspaceId, query: { page, limit, ...filters } })));

server.registerTool('get_test_plan', {
    description: 'Get one test plan with its test cases.',
    inputSchema: { workspaceId, id },
    annotations: readOnly,
}, tool(({ workspaceId, id }) => api('GET', `/testplans/${id}`, { workspaceId })));

server.registerTool('create_test_plan', {
    description: 'Create a test plan.',
    inputSchema: { workspaceId, ...optional(testPlanFields), name: testPlanFields.name, description: testPlanFields.description },
}, tool(({ workspaceId, ...body }) => api('POST', '/testplans', { workspaceId, body })));

server.registerTool('update_test_plan', {
    description: 'Update a test plan. Only the fields you pass are changed. To add/remove a single test case prefer add_/remove_test_case_*_plan.',
    inputSchema: { workspaceId, id, ...optional(testPlanFields) },
}, tool(({ workspaceId, id, ...body }) => api('PUT', `/testplans/${id}`, { workspaceId, body })));

server.registerTool('delete_test_plan', {
    description: 'Permanently delete a test plan (its test cases are kept).',
    inputSchema: { workspaceId, id },
    annotations: destructive,
}, tool(({ workspaceId, id }) => api('DELETE', `/testplans/${id}`, { workspaceId })));

server.registerTool('add_test_case_to_plan', {
    description: 'Add an existing test case to a test plan.',
    inputSchema: { workspaceId, planId: id, testCaseId: id },
}, tool(({ workspaceId, planId, testCaseId }) =>
    api('POST', `/testplans/${planId}/testcases`, { workspaceId, body: { testCaseId } })));

server.registerTool('remove_test_case_from_plan', {
    description: 'Remove a test case from a test plan (the test case itself is kept).',
    inputSchema: { workspaceId, planId: id, testCaseId: id },
}, tool(({ workspaceId, planId, testCaseId }) =>
    api('DELETE', `/testplans/${planId}/testcases/${testCaseId}`, { workspaceId })));

await server.connect(new StdioServerTransport());
