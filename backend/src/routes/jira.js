import express from 'express';
import { protect } from '../middleware/auth.js';
import TestCase from '../models/TestCase.js';

const router = express.Router();

// POST /api/jira/ticket
// Create a Jira ticket for a failed test case
router.post('/ticket', protect, async (req, res) => {
    try {
        const { testCaseId, planId } = req.body;

        if (!testCaseId) {
            return res.status(400).json({ message: 'testCaseId is required' });
        }

        const testCase = await TestCase.findById(testCaseId);
        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        // 1. Verify environment variables are present
        const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
        const JIRA_EMAIL = process.env.JIRA_EMAIL;
        const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
        const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
        const JIRA_ISSUE_TYPE = process.env.JIRA_ISSUE_TYPE || 'Bug';

        if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
            return res.status(500).json({
                message: 'Jira configuration is missing. Please check your .env file.',
                error: 'Missing Jira Env Vars'
            });
        }

        // 2. Prepare description from Test Case steps
        let descriptionText = `${testCase.description || 'No description provided'}\n\n`;

        if (testCase.steps && testCase.steps.length > 0) {
            descriptionText += '*Steps to Reproduce:*\n';
            testCase.steps.forEach(step => {
                descriptionText += `${step.stepNumber}. ${step.action}\n`;
                if (step.expectedResult) {
                    descriptionText += `   Expected: ${step.expectedResult}\n`;
                }
            });
        }

        if (testCase.executionNotes) {
            descriptionText += `\n*Execution Notes:*\n${testCase.executionNotes}\n`;
        }

        // 3. Prepare Jira API payload (Jira Cloud REST API v3 requires Atlassian Document Format for description)
        // For simplicity and compatibility we can use ADF:
        const payload = {
            fields: {
                project: {
                    key: JIRA_PROJECT_KEY
                },
                summary: `[Failed TC] ${testCase.title}`,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: descriptionText
                                }
                            ]
                        }
                    ]
                },
                issuetype: {
                    name: JIRA_ISSUE_TYPE
                }
            }
        };

        // 4. Send Request to Jira
        const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
        const issueUrl = `${JIRA_BASE_URL}/rest/api/3/issue`;

        const jiraRes = await axios.post(issueUrl, payload, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const ticketKey = jiraRes.data.key;
        const ticketUrl = `${JIRA_BASE_URL}/browse/${ticketKey}`;

        // 5. Update TestCase with the new Jira ticket URL
        testCase.jiraTicketUrl = ticketUrl;
        await testCase.save();

        res.status(201).json({
            message: 'Jira ticket created successfully',
            ticketUrl,
            ticketKey
        });

    } catch (error) {
        console.error('Error creating Jira ticket:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to create Jira ticket',
            error: error.response?.data || error.message
        });
    }
});

export default router;
