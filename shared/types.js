/**
 * Shared type definitions for the AI Test Case Generator (QA Manager)
 * These types reflect current Mongoose models and are used across frontend and backend.
 */

/**
 * @typedef {Object} User
 * @property {string} _id - User ID
 * @property {string} [username] - Unique username
 * @property {string} email - User email
 * @property {string} name - User full name
 * @property {string} [picture] - User profile picture URL
 * @property {Date} createdAt - Account creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} Workspace
 * @property {string} _id - Workspace ID
 * @property {string} name - Workspace name
 * @property {string|User} createdBy - Creator user ID or populated User object
 * @property {(string|User)[]} members - Array of member user IDs or populated User objects
 * @property {boolean} isPersonal - True if this is the user's personal default workspace
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} TestStep
 * @property {number} stepNumber - Step order number (1-indexed)
 * @property {string} action - Specific action to perform
 * @property {string} expectedResult - Expected outcome for this step
 */

/**
 * @typedef {Object} TestCase
 * @property {string} _id - Test case ID
 * @property {string} title - Test case title
 * @property {string} description - Detailed description
 * @property {string} [externalId] - External ID from imported sheet (e.g. "BB-M1-01")
 * @property {string} [preCondition] - Prerequisites / preconditions
 * @property {string} [testData] - Test data input
 * @property {TestStep[]} steps - Ordered test steps
 * @property {'Low'|'Medium'|'High'|'Critical'} priority - Priority level
 * @property {'Draft'|'Active'|'Deprecated'} status - Lifecycle status
 * @property {string} category - Test category (Functional, UI, Security, etc.)
 * @property {string} feature - Feature or module name (e.g. "Authentication")
 * @property {string[]} [tags] - Search tags
 * @property {'Pending'|'Pass'|'Failed'|'N/A'} executionStatus - Execution outcome
 * @property {string} [executionNotes] - Execution notes / observations
 * @property {'Bug'|'Đề xuất'|''} [bugType] - Defect type classification
 * @property {'High'|'Medium'|'Low'|''} [bugSeverity] - Defect severity level
 * @property {'Đã fix'|'Chưa fix'|'Không fix'|''} [fixStatus] - Bug fix resolution state
 * @property {string} [bugId] - External bug reference ID (e.g. "BUG-101")
 * @property {string} [jiraTicketUrl] - URL of linked Jira issue
 * @property {string|User} user - Owner User ID or populated object
 * @property {string|Workspace} [workspace] - Owning Workspace ID or populated object
 * @property {string|User} [executedBy] - Last executor User ID or populated object
 * @property {Date} [executedAt] - Timestamp of last execution status change
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} TestPlan
 * @property {string} _id - Test plan ID
 * @property {string} name - Test plan name
 * @property {string} description - Test plan overview
 * @property {(string|TestCase)[]} testCases - Test case IDs or populated TestCase objects
 * @property {'Planning'|'In Progress'|'Completed'|'On Hold'|'Obsolete'} status - Lifecycle status
 * @property {Date} [startDate] - Start date
 * @property {Date} [endDate] - End date
 * @property {'Pending'|'Pass'|'Failed'} executionStatus - Rollup execution status
 * @property {string} [executionNotes] - Plan-level execution notes
 * @property {string|User} user - Creator User ID or populated object
 * @property {string|Workspace} [workspace] - Owning Workspace ID or populated object
 * @property {string|User} [executedBy] - Last plan-level executor User ID or populated object
 * @property {Date} [executedAt] - Timestamp of last plan execution change
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} ActivityLog
 * @property {string} _id - Log ID
 * @property {'TestCase'|'TestPlan'} entityType - Target entity type
 * @property {string} entityId - Target entity ID
 * @property {string|Workspace} [workspace] - Scoped workspace ID
 * @property {string|User} user - Actor User ID or populated object
 * @property {'created'|'updated'|'execution_status_changed'} action - Performed action
 * @property {string[]} [changedFields] - Array of field names modified
 * @property {string} [toStatus] - New status if execution_status_changed
 * @property {Date} createdAt - Timestamp
 */

export { };
