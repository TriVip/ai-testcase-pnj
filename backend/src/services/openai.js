import OpenAI from 'openai';

// Lazy initialization - create OpenAI client when needed
const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// Helper function to extract JSON from response
const extractJSON = (content) => {
    // Try to find JSON array
    let jsonMatch = content.match(/\[[\s\S]*\]/);

    // If not found, try to find JSON object
    if (!jsonMatch) {
        jsonMatch = content.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
        throw new Error('Failed to extract JSON from OpenAI response');
    }

    return JSON.parse(jsonMatch[0]);
};

// Generate Test Case Suggestions
export const generateTestCaseSuggestions = async (featureDescription) => {
    try {
        const openai = getOpenAIClient();
        const prompt = `You are a senior QA engineer with expertise in test case design. Generate comprehensive test cases for the following feature:

**Feature Description:** ${featureDescription}

Generate 5-8 diverse test cases in the exact SAME LANGUAGE as the Feature Description (e.g., if the description is in Vietnamese, generate Vietnamese test cases), covering:
1. **Happy Path** - Normal successful flows
2. **Edge Cases** - Boundary values, limits, extremes
3. **Error Handling** - Invalid inputs, error states
4. **Security** - Authentication, authorization, data validation
5. **Performance** - Load, stress scenarios if applicable
6. **Usability** - User experience considerations

Return ONLY a JSON array in this exact format:
[
  {
    "title": "Clear, specific test case title",
    "description": "Detailed description of what this validates and why it matters",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Specific action to perform",
        "expectedResult": "Clear expected outcome"
      }
    ],
    "priority": "Critical|High|Medium|Low",
    "category": "Functional|UI|Performance|Security|Integration|Regression"
  }
]

Make test cases:
- Specific and actionable
- Cover different scenarios
- Include realistic test data examples
- Prioritized appropriately
- Professional and comprehensive`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a senior QA engineer who generates comprehensive, professional test cases. Always respond with ONLY valid JSON, no markdown formatting or explanations. CRITICAL INSTRUCTION: If the user\'s input is in Vietnamese, you MUST generate all content (title, description, steps, expectedResult, actions) entirely in Vietnamese language (tiếng Việt). Do not use English unless the user explicitly asks for English.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 2500,
        });

        const content = response.choices[0].message.content;
        const testCases = extractJSON(content);

        // Validate response structure
        if (!Array.isArray(testCases)) {
            throw new Error('Invalid response format: expected an array of test cases');
        }

        return testCases;
    } catch (error) {
        console.error('OpenAI API Error:', error.message);

        // Provide more specific error messages
        if (error.code === 'insufficient_quota') {
            throw new Error('OpenAI API quota exceeded. Please check your billing.');
        } else if (error.code === 'invalid_api_key') {
            throw new Error('Invalid OpenAI API key. Please check your configuration.');
        }

        throw new Error('Failed to generate test case suggestions: ' + error.message);
    }
};

// Generate Test Plan Suggestions
export const generateTestPlanSuggestions = async (projectDescription) => {
    try {
        const openai = getOpenAIClient();
        const prompt = `You are a senior QA lead creating a comprehensive test plan. Based on the following project description, generate a detailed test plan:

**Project Description:** ${projectDescription}

Generate a complete test plan structure in the exact SAME LANGUAGE as the Project Description (e.g., if the description is in Vietnamese, generate in Vietnamese) with 4-6 major test scenarios/modules. Return ONLY a JSON object in this exact format:

{
  "name": "Descriptive test plan name",
  "description": "Overview of what this test plan covers",
  "testScenarios": [
    {
      "title": "Major test scenario/module name",
      "description": "What this scenario covers",
      "priority": "Critical|High|Medium|Low",
      "testCases": [
        {
          "title": "Specific test case title",
          "description": "What this test validates",
          "steps": [
            {
              "stepNumber": 1,
              "action": "Action to perform",
              "expectedResult": "Expected outcome"
            }
          ],
          "priority": "Critical|High|Medium|Low",
          "category": "Functional|UI|Performance|Security|Integration"
        }
      ]
    }
  ]
}

The test plan should be:
- Comprehensive and organized by logical modules/scenarios
- Cover all critical functionality
- Include diverse test types (functional, UI, performance, security)
- Properly prioritized
- Production-ready`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a senior QA lead who creates comprehensive test plans. Always respond with ONLY valid JSON, no markdown formatting or explanations. CRITICAL INSTRUCTION: If the user\'s input is in Vietnamese, you MUST generate all content (test scenarios, cases, descriptions, actions, expected results) entirely in Vietnamese language (tiếng Việt). Do not use English unless the user explicitly asks for English.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 3000,
        });

        const content = response.choices[0].message.content;
        const testPlan = extractJSON(content);

        return testPlan;
    } catch (error) {
        console.error('OpenAI API Error:', error.message);

        if (error.code === 'insufficient_quota') {
            throw new Error('OpenAI API quota exceeded. Please check your billing.');
        } else if (error.code === 'invalid_api_key') {
            throw new Error('Invalid OpenAI API key. Please check your configuration.');
        }

        throw new Error('Failed to generate test plan suggestions: ' + error.message);
    }
};

// Improve existing test case
export const improveTestCase = async (testCase) => {
    try {
        const openai = getOpenAIClient();
        const prompt = `You are a senior QA engineer reviewing a test case. Improve the following test case to make it more comprehensive, clear, and professional:

**Current Test Case:**
Title: ${testCase.title}
Description: ${testCase.description}
Steps: ${JSON.stringify(testCase.steps || [])}
Priority: ${testCase.priority}
Category: ${testCase.category}

Provide an improved version in the exact SAME LANGUAGE as the Current Test Case that:
- Has clearer, more specific title and description
- Includes more detailed steps with specific test data
- Has better expected results
- Follows testing best practices
- Maintains the same priority and category unless clearly wrong

Return ONLY a JSON object in this format:
{
  "title": "Improved title",
  "description": "Improved description",
  "steps": [
    {
      "stepNumber": 1,
      "action": "Specific action",
      "expectedResult": "Clear expected result"
    }
  ],
  "priority": "Critical|High|Medium|Low",
  "category": "Functional|UI|Performance|Security|Integration|Regression",
  "improvements": "Brief explanation of what was improved"
}`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a senior QA engineer who reviews and improves test cases. Always respond with ONLY valid JSON. IMPORTANT: You MUST generate content in the SAME LANGUAGE as the input test case.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.5,
            max_tokens: 1500,
        });

        const content = response.choices[0].message.content;
        const improved = extractJSON(content);

        return improved;
    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        throw new Error('Failed to improve test case: ' + error.message);
    }
};
