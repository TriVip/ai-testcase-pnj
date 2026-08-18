import { describe, it } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import Workspace from '../src/models/Workspace.js';
import {
    buildScopeQuery,
    userCanAccessWorkspace,
    resolveWorkspaceForWrite,
    WorkspaceAccessError,
    WORKSPACE_ACCESS_DENIED,
} from '../src/utils/workspaceAccess.js';

describe('Workspace Access & Scoping', () => {
    it('returns user-only scope when no x-workspace-id header is provided', async () => {
        const req = {
            userId: new mongoose.Types.ObjectId().toString(),
            headers: {},
        };

        const scope = await buildScopeQuery(req);
        assert.strictEqual(scope.user, req.userId);
        assert.strictEqual(scope.workspace, undefined);
    });

    it('returns user-only scope with merged extra clauses', async () => {
        const req = {
            userId: new mongoose.Types.ObjectId().toString(),
            headers: {},
        };
        const extraId = new mongoose.Types.ObjectId();

        const scope = await buildScopeQuery(req, { _id: extraId });
        assert.strictEqual(scope.user, req.userId);
        assert.strictEqual(scope.workspace, undefined);
        assert.strictEqual(scope._id, extraId);
    });

    it('throws WorkspaceAccessError if user is not a member of the workspace', async () => {
        const validWorkspaceId = new mongoose.Types.ObjectId().toString();
        const req = {
            userId: new mongoose.Types.ObjectId().toString(),
            headers: { 'x-workspace-id': validWorkspaceId },
        };

        // Mock Workspace.exists to return false (not a member)
        const originalExists = Workspace.exists;
        Workspace.exists = async () => null;

        try {
            await assert.rejects(
                async () => {
                    await buildScopeQuery(req);
                },
                (err) => {
                    assert.strictEqual(err.name, 'WorkspaceAccessError');
                    assert.strictEqual(err.status, 403);
                    assert.strictEqual(err.code, WORKSPACE_ACCESS_DENIED);
                    return true;
                }
            );
        } finally {
            Workspace.exists = originalExists;
        }
    });

    it('returns workspace scope when user is verified member', async () => {
        const validWorkspaceId = new mongoose.Types.ObjectId().toString();
        const req = {
            userId: new mongoose.Types.ObjectId().toString(),
            headers: { 'x-workspace-id': validWorkspaceId },
        };

        const originalExists = Workspace.exists;
        Workspace.exists = async () => ({ _id: validWorkspaceId });

        try {
            const scope = await buildScopeQuery(req, { category: 'Auth' });
            assert.strictEqual(scope.workspace, validWorkspaceId);
            assert.strictEqual(scope.category, 'Auth');
            assert.strictEqual(scope.user, undefined);
        } finally {
            Workspace.exists = originalExists;
        }
    });

    it('resolveWorkspaceForWrite returns null when no header is present', async () => {
        const req = {
            userId: new mongoose.Types.ObjectId().toString(),
            headers: {},
        };

        const ws = await resolveWorkspaceForWrite(req);
        assert.strictEqual(ws, null);
    });
});
