# MCP server

Lets AI agents (Claude Code, Claude Desktop, Cursor, …) list, create, update and
execute test cases / test plans. It calls the existing REST API with your own
session token, so it sees exactly what you see in the web app — same workspace
permissions, same activity log, same plan-status auto-sync.

## Get a token

1. Sign in at https://ai-testcase-pnj.pages.dev
2. DevTools → Application → Cookies → the API origin → copy the `token` value.

It expires after 7 days; paste a fresh one when calls start returning 401.
Treat it like a password — anyone holding it can act as you.

## Configure

```bash
npm install   # from the repo root (mcp is an npm workspace)
```

Claude Code:

```bash
claude mcp add testcase-gen \
  -e TESTCASE_API_URL=https://testcase-gen-backend.onrender.com \
  -e TESTCASE_TOKEN=<token> \
  -- node /absolute/path/to/ai-testcase-gen/mcp/src/index.js
```

Any other client (`mcpServers` JSON):

```json
{
  "testcase-gen": {
    "command": "node",
    "args": ["/absolute/path/to/ai-testcase-gen/mcp/src/index.js"],
    "env": {
      "TESTCASE_API_URL": "https://testcase-gen-backend.onrender.com",
      "TESTCASE_TOKEN": "<token>",
      "TESTCASE_WORKSPACE_ID": "<optional default workspace _id>"
    }
  }
}
```

Without `TESTCASE_WORKSPACE_ID` (or a per-call `workspaceId`), calls hit your
personal scope — call `list_workspaces` to find a shared workspace's id.

## Tools

`whoami`, `list_workspaces`, `list_test_cases`, `get_test_case`,
`get_test_case_history`, `create_test_case`, `update_test_case`,
`delete_test_case`, `list_test_plans`, `get_test_plan`, `create_test_plan`,
`update_test_plan`, `delete_test_plan`, `add_test_case_to_plan`,
`remove_test_case_from_plan`.
