import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';

/**
 * Scoping helpers for workspace-owned resources (test cases, test plans).
 *
 * The active workspace arrives as the `x-workspace-id` request header, which the
 * frontend reads from localStorage. That value is fully under the client's
 * control, so it can never be trusted on its own: scoping a query by workspace
 * alone lets anyone read or delete another workspace's data just by editing
 * localStorage. Every helper here verifies membership before the caller's id is
 * allowed to widen a query beyond that user's own rows.
 */

/** True when `userId` is a member of `workspaceId`. */
export const userCanAccessWorkspace = async (userId, workspaceId) => {
    if (!mongoose.isValidObjectId(workspaceId)) {
        return false;
    }
    const workspace = await Workspace.exists({ _id: workspaceId, members: userId });
    return Boolean(workspace);
};

/**
 * Error thrown when a request names a workspace the caller isn't a member of.
 * Carries a 403 so the shared express error handler maps it correctly.
 */
export class WorkspaceAccessError extends Error {
    constructor(message = 'Not authorized for this workspace') {
        super(message);
        this.name = 'WorkspaceAccessError';
        this.status = 403;
    }
}

/**
 * Build the ownership filter for a request, verifying workspace membership.
 *
 * - No `x-workspace-id` header  -> scope to the caller's own rows.
 * - Header present, caller is a member -> scope to the whole workspace, so
 *   teammates can see each other's work (this is the intended sharing model).
 * - Header present, caller is NOT a member -> throw WorkspaceAccessError.
 *
 * `extra` is merged in for the `_id` clause, e.g.
 *   await buildScopeQuery(req, { _id: req.params.id })
 *   await buildScopeQuery(req, { _id: { $in: ids } })
 */
export const buildScopeQuery = async (req, extra = {}) => {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
        return { user: req.userId, ...extra };
    }

    if (!(await userCanAccessWorkspace(req.userId, workspaceId))) {
        throw new WorkspaceAccessError();
    }

    return { workspace: workspaceId, ...extra };
};

/**
 * Resolve the workspace a newly created resource should belong to.
 *
 * Returns the verified workspace id, or null when no workspace header was sent.
 * Throws WorkspaceAccessError if the caller isn't a member of the one named.
 */
export const resolveWorkspaceForWrite = async (req) => {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
        return null;
    }

    if (!(await userCanAccessWorkspace(req.userId, workspaceId))) {
        throw new WorkspaceAccessError();
    }

    return workspaceId;
};
