const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(
        /const query = { user: req\.userId };\s*if \(workspaceId\) query\.workspace = workspaceId;/g,
        'const query = workspaceId ? { workspace: workspaceId } : { user: req.userId };'
    );
    
    content = content.replace(
        /const query = { _id: (req\.[a-zA-Z\.]+), user: req\.userId };\s*if \(workspaceId\) query\.workspace = workspaceId;/g,
        'const query = { _id: $1 };\n        if (workspaceId) query.workspace = workspaceId;\n        else query.user = req.userId;'
    );
    
    content = content.replace(
        /const query = { _id: { \$in: ids }, user: req\.userId };\s*if \(workspaceId\) query\.workspace = workspaceId;/g,
        'const query = { _id: { $$in: ids } };\n        if (workspaceId) query.workspace = workspaceId;\n        else query.user = req.userId;'
    );

    fs.writeFileSync(file, content);
}

try {
    fixFile('/Users/rekcal/Documents/ai-testcase-gen/backend/src/routes/testPlans.js');
    fixFile('/Users/rekcal/Documents/ai-testcase-gen/backend/src/routes/testCases.js');
    console.log('Fixed workspace queries successfully.');
} catch (e) {
    console.error('Error fixing queries:', e);
}
