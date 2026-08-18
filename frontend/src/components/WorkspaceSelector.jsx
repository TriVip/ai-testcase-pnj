import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { workspacesAPI } from '../services/api';
import ConfirmDialog from './common/ConfirmDialog';

const IconChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const IconPlus = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const IconUsers = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const IconX = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// Static (non-live) list of who's in the active workspace. `members` already
// arrives fully populated with name/email/picture from GET /api/workspaces —
// this only renders what's already in memory, no extra request. The owner
// gets a remove button on every other row; nobody gets one on the owner's
// own row — that requires the separate "leave" flow instead.
const MemberList = ({ workspace, currentUserId, onRemoveMember }) => {
    const members = workspace?.members || [];
    if (members.length === 0) return null;
    const ownerId = workspace.createdBy?._id || workspace.createdBy;
    const isOwner = currentUserId === ownerId;

    return (
        <div style={{ marginTop: 12 }}>
            <div style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text-on-sidebar-active)', opacity: 0.6,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, padding: '0 2px',
            }}>
                Members ({members.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 160, overflowY: 'auto' }}>
                {members.map(m => (
                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 2px' }}>
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                            background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 10, fontWeight: 600,
                        }}>
                            {m.picture
                                ? <img src={m.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : (m.name || m.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate" style={{ fontSize: 12, color: 'var(--text-on-sidebar-active)', flex: 1 }} title={m.email}>
                            {m.name || m.email}
                        </span>
                        {m._id === ownerId ? (
                            <span style={{ fontSize: 10, color: 'var(--text-on-sidebar-active)', opacity: 0.55, flexShrink: 0 }}>owner</span>
                        ) : isOwner && (
                            <button
                                onClick={() => onRemoveMember(m)}
                                title={`Remove ${m.name || m.email}`}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                                    lineHeight: 0, color: 'var(--text-on-sidebar-active)', opacity: 0.5, flexShrink: 0,
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                            >
                                <IconX />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const WorkspaceSelector = () => {
    const {
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        fetchWorkspaces,
        accessDeniedNotice,
        dismissAccessDeniedNotice,
    } = useWorkspace();
    const { user } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const isOwner = activeWorkspace && user && (activeWorkspace.createdBy?._id || activeWorkspace.createdBy) === user._id;

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: null,
    });

    // Escape listener for modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isLoading) {
                if (isCreateModalOpen) setIsCreateModalOpen(false);
                if (isInviteModalOpen) setIsInviteModalOpen(false);
                if (isDropdownOpen) setIsDropdownOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCreateModalOpen, isInviteModalOpen, isDropdownOpen, isLoading]);

    const handleRemoveMember = (member) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Remove Team Member',
            message: `Remove ${member.name || member.email} from "${activeWorkspace.name}"? They will lose access immediately.`,
            confirmText: 'Remove Member',
            cancelText: 'Cancel',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await workspacesAPI.removeMember(activeWorkspace._id, member._id);
                    await fetchWorkspaces();
                } catch (err) {
                    console.error('Failed to remove member:', err);
                } finally {
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const handleLeaveWorkspace = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Leave Workspace',
            message: `Leave "${activeWorkspace.name}"? You will immediately lose access to all its test cases and test plans.`,
            confirmText: 'Leave Workspace',
            cancelText: 'Cancel',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await workspacesAPI.leave(activeWorkspace._id);
                    await fetchWorkspaces();
                } catch (err) {
                    console.error('Failed to leave workspace:', err);
                } finally {
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            setError(null);
            const res = await workspacesAPI.create({ name: newWorkspaceName });
            // Close modals first
            setIsCreateModalOpen(false);
            setNewWorkspaceName('');
            setIsDropdownOpen(false);

            // Set active right away to avoid UI lag, then refetch
            setActiveWorkspace(res.data);
            await fetchWorkspaces();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            setError(null);
            await workspacesAPI.invite(activeWorkspace._id, inviteEmail);
            await fetchWorkspaces(); // Refresh to show new member if needed
            setIsInviteModalOpen(false);
            setInviteEmail('');
            setIsDropdownOpen(false);
            alert('Member invited successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to invite member');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '0 16px', marginBottom: 16, position: 'relative' }}>
            <span className="sidebar-section-label" style={{ marginTop: 0 }}>WORKSPACE</span>

            {/* Shown when the server rejected the workspace we had selected and
                the app switched away from it on its own — without this the
                selection would appear to change for no reason. */}
            {accessDeniedNotice && (
                <div
                    role="status"
                    style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8,
                        padding: '8px 10px', borderRadius: 'var(--radius)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: 'var(--text-on-sidebar-active)', fontSize: 11, lineHeight: 1.4,
                    }}
                >
                    <span style={{ flex: 1 }}>{accessDeniedNotice}</span>
                    <button
                        onClick={dismissAccessDeniedNotice}
                        aria-label="Dismiss"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            lineHeight: 0, color: 'inherit', opacity: 0.7, flexShrink: 0,
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Positioned relative to just this wrapper — not the outer
                container, which also holds the invite/leave buttons and the
                member list below. Anchoring to the outer container made the
                dropdown's `top: 100%` resolve against the height of all of
                that trailing content too, so it opened far below the toggle
                button instead of right under it. */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                        padding: '8px 12px', background: isDropdownOpen ? 'var(--bg-sidebar-active)' : 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius)', color: 'var(--text-on-sidebar-active)', cursor: 'pointer',
                        fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => { if (!isDropdownOpen) e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)'; }}
                    onMouseLeave={(e) => { if (!isDropdownOpen) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
                    title={activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                >
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textAlign: 'left' }}>
                        {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                        <IconChevronDown />
                    </div>
                </button>

                {
                    isDropdownOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                            marginTop: 4, padding: '4px 0', maxHeight: 250, overflowY: 'auto'
                        }}>
                            <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Your Workspaces
                            </div>
                            {workspaces.map(w => (
                                <button
                                    key={w._id}
                                    onClick={() => {
                                        setActiveWorkspace(w);
                                        setIsDropdownOpen(false);
                                    }}
                                    title={w.name}
                                    style={{
                                        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                                        background: activeWorkspace?._id === w._id ? 'var(--bg-surface-2)' : 'transparent',
                                        border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                                        fontSize: 'var(--text-sm)', transition: 'background-color var(--transition-fast)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = activeWorkspace?._id === w._id ? 'var(--bg-surface-2)' : 'transparent'; }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {w.name}
                                    </span>
                                    {w.isPersonal && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 8, flexShrink: 0 }}>(Personal)</span>}
                                </button>
                            ))}

                            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                            <button
                                onClick={() => { setIsCreateModalOpen(true); setIsDropdownOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', padding: '8px 12px',
                                    background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer',
                                    fontSize: 'var(--text-sm)', fontWeight: 500, gap: 8, transition: 'background-color var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <IconPlus /> Create New Workspace
                            </button>
                        </div>
                    )}
            </div>

            {activeWorkspace && !activeWorkspace.isPersonal && (
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    style={{
                        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '6px 12px', marginTop: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius)', color: 'var(--text-on-sidebar-active)', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 600, transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                    title="Invite members to this workspace"
                >
                    <IconUsers /> Invite Team Members
                </button>
            )}

            {activeWorkspace && !activeWorkspace.isPersonal && !isOwner && (
                <button
                    onClick={handleLeaveWorkspace}
                    style={{
                        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '6px 12px', marginTop: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius)', color: 'var(--text-on-sidebar-active)', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 600, transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                    title="Leave this workspace"
                >
                    Leave Workspace
                </button>
            )}

            <MemberList workspace={activeWorkspace} currentUserId={user?._id} onRemoveMember={handleRemoveMember} />

            {/* Create Workspace Modal */}
            {
                isCreateModalOpen && createPortal(
                    <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h2 className="modal-title">Create New Workspace</h2>
                                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsCreateModalOpen(false)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateWorkspace}>
                                <div className="modal-body" style={{ padding: '20px' }}>
                                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                                    <div className="form-group">
                                        <label className="form-label">Workspace Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={newWorkspaceName}
                                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                                            placeholder="e.g. My Team, Project Alpha"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || !newWorkspaceName.trim()}>
                                        {isLoading ? 'Creating...' : 'Create Workspace'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Invite Member Modal */}
            {
                isInviteModalOpen && activeWorkspace && createPortal(
                    <div className="modal-backdrop" onClick={() => setIsInviteModalOpen(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h2 className="modal-title">Invite to {activeWorkspace.name}</h2>
                                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsInviteModalOpen(false)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleInviteMember}>
                                <div className="modal-body" style={{ padding: '20px' }}>
                                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                                    <div className="form-group">
                                        <label className="form-label">Member Email</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="Email address of existing user"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsInviteModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || !inviteEmail.trim()}>
                                        {isLoading ? 'Inviting...' : 'Invite Member'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default WorkspaceSelector;
