/**
 * Shared type definitions for the AI Test Case Generator
 * These types are used across both frontend and backend
 */

/**
 * @typedef {Object} User
 * @property {string} _id - User ID
 * @property {string} googleId - Google OAuth ID
 * @property {string} email - User email
 * @property {string} name - User full name
 * @property {string} picture - User profile picture URL
 * @property {Date} createdAt - Account creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} TestStep
 * @property {number} stepNumber - Step number
 * @property {string} action - Action to perform
 * @property {string} expectedResult - Expected result
 */

/**
 * @typedef {Object} TestCase
 * @property {string} _id - Test case ID
 * @property {string} title - Test case title
 * @property {string} description - Test case description
 * @property {TestStep[]} steps - Test steps
 * @property {'Low'|'Medium'|'High'|'Critical'} priority - Priority level
 * @property {'Draft'|'Active'|'Deprecated'} status - Test case status
 * @property {string} category - Test category
 * @property {string[]} tags - Tags
 * @property {string} user - User ID (reference)
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} TestPlan
 * @property {string} _id - Test plan ID
 * @property {string} name - Test plan name
 * @property {string} description - Test plan description
 * @property {string[]|TestCase[]} testCases - Test case IDs or populated test cases
 * @property {'Planning'|'In Progress'|'Completed'|'On Hold'} status - Test plan status
 * @property {Date} startDate - Start date
 * @property {Date} endDate - End date
 * @property {string} user - User ID (reference)
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

export { };
