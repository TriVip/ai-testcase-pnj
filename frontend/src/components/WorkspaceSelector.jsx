import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { workspacesAPI } from '../services/api';

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

const WorkspaceSelector = () => {
    const { workspaces, activeWorkspace, setActiveWorkspace, fetchWorkspaces } = useWorkspace();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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
                        position: 'absolute', top: '100%', left: 16, right: 16, zIndex: 100,
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

            {/* Create Workspace Modal */}
            {
                isCreateModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h2>Create New Workspace</h2>
                                <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreateWorkspace} style={{ padding: 20 }}>
                                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                                <div className="form-group">
                                    <label className="form-label">Workspace Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        placeholder="e.g. My Team, Project Alpha"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={isLoading || !newWorkspaceName.trim()}>
                                        {isLoading ? 'Creating...' : 'Create Workspace'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Invite Member Modal */}
            {
                isInviteModalOpen && activeWorkspace && (
                    <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h2>Invite to {activeWorkspace.name}</h2>
                                <button className="modal-close" onClick={() => setIsInviteModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={handleInviteMember} style={{ padding: 20 }}>
                                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                                <div className="form-group">
                                    <label className="form-label">Member Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="Email address of existing user"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={isLoading || !inviteEmail.trim()}>
                                        {isLoading ? 'Inviting...' : 'Invite Member'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default WorkspaceSelector;
