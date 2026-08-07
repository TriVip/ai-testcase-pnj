// TestPlan only stores test cases in one direction (plan -> test cases), so
// "which plan(s) is this test case in" has to be derived from the full plan
// list rather than read off the test case itself. Shared by any page that
// needs to look this up (Test Cases' plan filter, Bug Tracking's navigation).
export const buildTcToPlansMap = (testPlans) => {
    const map = {};
    testPlans.forEach(plan => {
        (plan.testCases || []).forEach(tc => {
            const id = tc._id || tc;
            (map[id] ||= []).push(plan);
        });
    });
    return map;
};
