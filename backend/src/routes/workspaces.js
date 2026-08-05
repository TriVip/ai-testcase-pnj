import express from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/workspaces
// @desc    Create a new workspace
// @access  Private
router.post('/', isAuthenticated, async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Workspace name is required' });
        }

        const workspace = new Workspace({
            name,
            createdBy: req.userId,
            members: [req.userId],
        });

        const savedWorkspace = await workspace.save();
        res.status(201).json(savedWorkspace);
    } catch (error) {
        console.error('Error creating workspace:', error);
        next(error);
    }
});

// @route   GET /api/workspaces
// @desc    Get all workspaces the user is part of
// @access  Private
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const workspaces = await Workspace.find({ members: req.userId })
            .populate('createdBy', 'name email picture')
            .populate('members', 'name email picture')
            .sort({ createdAt: -1 });

        res.json(workspaces);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        next(error);
    }
});

// @route   POST /api/workspaces/:id/invite
// @desc    Invite a user to a workspace
// @access  Private
router.post('/:id/invite', isAuthenticated, async (req, res, next) => {
    try {
        const { email } = req.body;
        const workspaceId = req.params.id;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Only creator can invite 
        if (workspace.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to invite members' });
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        if (workspace.members.includes(userToInvite._id)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        workspace.members.push(userToInvite._id);
        await workspace.save();

        const updatedWorkspace = await Workspace.findById(workspaceId)
            .populate('createdBy', 'name email picture')
            .populate('members', 'name email picture');

        res.json(updatedWorkspace);
    } catch (error) {
        console.error('Error inviting member:', error);
        next(error);
    }
});

export default router;
